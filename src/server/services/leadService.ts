import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { scoreLead } from "@/lib/scoring";
import { getLeadLimit } from "@/server/services/billingService";
import { notify } from "@/server/services/notificationService";
import { PlanLimitError } from "@/lib/plans";
import type { CreateLeadInput, UpdateLeadInput } from "@/lib/validations/lead";

// ── helpers ─────────────────────────────────────────────────────────────
function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type LeadRow = Awaited<ReturnType<typeof prisma.lead.findFirst>>;

export function serializeLead(row: NonNullable<LeadRow> & { assignedUser?: { id: string; name: string } | null }) {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contactPerson,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    category: row.category,
    industry: row.industry,
    rating: row.rating,
    reviews: row.reviews,
    maps: row.maps,
    source: row.source,
    status: row.status,
    leadScore: row.leadScore,
    campaignId: row.campaignId,
    dealValue: row.dealValue != null ? Number(row.dealValue) : null,
    expectedCloseDate: row.expectedCloseDate ? row.expectedCloseDate.toISOString() : null,
    scoreBreakdown: parseJson<Record<string, number>>(row.scoreBreakdown, {}),
    tags: parseJson<string[]>(row.tags, []),
    assignedUserId: row.assignedUserId,
    assignedUser: row.assignedUser ? { id: row.assignedUser.id, name: row.assignedUser.name } : null,
    savedAt: row.savedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type SerializedLead = ReturnType<typeof serializeLead>;

async function logActivity(
  organizationId: string,
  userId: string | null,
  leadId: number,
  type: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activity.create({
    data: {
      organizationId,
      userId,
      leadId,
      type,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// ── queries (all scoped to ctx.organizationId) ──────────────────────────
type LeadFilters = { status?: string; q?: string; assignedUserId?: string };

function leadWhere(ctx: TenantContext, filters: LeadFilters) {
  return {
    organizationId: ctx.organizationId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { category: { contains: filters.q } },
            { address: { contains: filters.q } },
            { email: { contains: filters.q } },
          ],
        }
      : {}),
  };
}

const LEAD_ORDER = [{ leadScore: "desc" as const }, { savedAt: "desc" as const }];

/** All matching leads (no pagination) — used by stats, pipeline, reports, dashboard. */
export async function listLeads(ctx: TenantContext, filters: LeadFilters = {}): Promise<SerializedLead[]> {
  const rows = await prisma.lead.findMany({
    where: leadWhere(ctx, filters),
    include: { assignedUser: { select: { id: true, name: true } } },
    orderBy: LEAD_ORDER,
  });
  return rows.map(serializeLead);
}

/** Paginated leads for the Leads table. */
export async function listLeadsPaged(
  ctx: TenantContext,
  filters: LeadFilters,
  page: number,
  pageSize: number
): Promise<{ leads: SerializedLead[]; total: number }> {
  const where = leadWhere(ctx, filters);
  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedUser: { select: { id: true, name: true } } },
      orderBy: LEAD_ORDER,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { leads: rows.map(serializeLead), total };
}

export async function getLead(ctx: TenantContext, id: number) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { assignedUser: { select: { id: true, name: true } } },
  });
  if (!lead) return null;

  const [activities, notes] = await Promise.all([
    prisma.activity.findMany({
      where: { leadId: id, organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.note.findMany({
      where: { leadId: id, organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    lead: serializeLead(lead),
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      metadata: parseJson<Record<string, unknown>>(a.metadata, {}),
      createdAt: a.createdAt.toISOString(),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function createLead(ctx: TenantContext, input: CreateLeadInput): Promise<SerializedLead> {
  const { score, breakdown } = scoreLead(input);
  const key = `${input.name}|${input.address ?? ""}`.toLowerCase() + `|${ctx.organizationId}`;

  // Idempotent: if this business is already in the org's CRM, return it as-is
  // (so "Save to CRM" from Discover can be clicked safely / repeatedly).
  const existing = await prisma.lead.findFirst({
    where: { key, organizationId: ctx.organizationId },
    include: { assignedUser: { select: { id: true, name: true } } },
  });
  if (existing) return serializeLead(existing);

  // Enforce the plan's lead cap (Free = 50; Pro/Agency = unlimited).
  const limit = await getLeadLimit(ctx.organizationId);
  if (limit != null) {
    const count = await prisma.lead.count({ where: { organizationId: ctx.organizationId } });
    if (count >= limit) throw new PlanLimitError(limit);
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: ctx.organizationId,
      key, // already org-namespaced above to avoid cross-tenant clashes
      name: input.name,
      contactPerson: input.contactPerson ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      website: input.website ?? "",
      address: input.address ?? "",
      category: input.category ?? "",
      industry: input.industry ?? "",
      rating: input.rating ?? null,
      reviews: input.reviews ?? null,
      source: input.source ?? "MANUAL",
      status: "NEW",
      leadScore: score,
      scoreBreakdown: JSON.stringify(breakdown),
    },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  await logActivity(ctx.organizationId, ctx.userId, lead.id, "LEAD_CREATED");
  return serializeLead(lead);
}

export async function updateLead(
  ctx: TenantContext,
  id: number,
  input: UpdateLeadInput
): Promise<SerializedLead | null> {
  const current = await prisma.lead.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!current) return null;

  const data: Record<string, unknown> = {};
  if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
  if (input.assignedUserId !== undefined) data.assignedUserId = input.assignedUserId;
  if (input.status !== undefined) data.status = input.status;
  if (input.dealValue !== undefined) data.dealValue = input.dealValue;
  if (input.expectedCloseDate !== undefined) {
    data.expectedCloseDate = input.expectedCloseDate ? new Date(input.expectedCloseDate) : null;
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  // Activity logging + notifications for meaningful changes.
  if (input.status !== undefined && input.status !== current.status) {
    await logActivity(ctx.organizationId, ctx.userId, id, "STATUS_CHANGED", {
      from: current.status,
      to: input.status,
    });
    if (input.status === "WON" && lead.assignedUserId) {
      await notify(ctx.organizationId, lead.assignedUserId, {
        type: "DEAL_WON",
        title: `🎉 ${lead.name} marked Won`,
        body: lead.dealValue != null ? `Deal value $${Number(lead.dealValue)}` : "",
        link: `/app/leads/${id}`,
      });
    }
  }
  if (input.assignedUserId !== undefined && input.assignedUserId !== current.assignedUserId) {
    await logActivity(ctx.organizationId, ctx.userId, id, "LEAD_ASSIGNED", {
      assignedUserId: input.assignedUserId,
    });
    // Notify the new assignee (unless they assigned it to themselves).
    if (input.assignedUserId && input.assignedUserId !== ctx.userId) {
      await notify(ctx.organizationId, input.assignedUserId, {
        type: "LEAD_ASSIGNED",
        title: `You were assigned ${lead.name}`,
        link: `/app/leads/${id}`,
      });
    }
  }

  return serializeLead(lead);
}

export async function deleteLead(ctx: TenantContext, id: number): Promise<boolean> {
  const res = await prisma.lead.deleteMany({
    where: { id, organizationId: ctx.organizationId },
  });
  return res.count > 0;
}

export async function addNote(ctx: TenantContext, leadId: number, body: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!lead) return null;

  const note = await prisma.note.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, leadId, body },
  });
  await logActivity(ctx.organizationId, ctx.userId, leadId, "NOTE_ADDED");
  return { id: note.id, body: note.body, createdAt: note.createdAt.toISOString() };
}

/** Pipeline view: all org leads + summary stats (computed from the lead = opportunity). */
export async function getPipelineStats(ctx: TenantContext) {
  const leads = await listLeads(ctx);

  const total = leads.length;
  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const open = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");

  const openValue = open.reduce((s, l) => s + (l.dealValue ?? 0), 0);
  const wonValue = won.reduce((s, l) => s + (l.dealValue ?? 0), 0);
  const closed = won.length + lost.length;

  return {
    leads,
    stats: {
      total,
      openCount: open.length,
      wonCount: won.length,
      openValue,
      wonValue,
      // Win rate = won / (won + lost); conversion = won / total.
      winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
      conversionRate: total > 0 ? Math.round((won.length / total) * 100) : 0,
      avgWonValue: won.length > 0 ? Math.round(wonValue / won.length) : 0,
    },
  };
}

/** Team members in the org — for the assignee dropdown. */
export async function listOrgMembers(ctx: TenantContext) {
  const users = await prisma.user.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return users;
}
