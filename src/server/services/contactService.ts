import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { getTimeline } from "@/server/services/recordService";
import { getLeadLimit } from "@/server/services/billingService";
import type { CreateContactInput, UpdateContactInput } from "@/lib/validations/contact";

export interface ContactFilters {
  q?: string;
  ownerId?: string;
  companyId?: string;
  lifecycleStage?: string;
  tagId?: string;
}

async function assertCompanyInOrg(ctx: TenantContext, companyId?: string) {
  if (!companyId) return;
  const c = await prisma.company.findFirst({
    where: { id: companyId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!c) throw new Error("Company not found in your organization.");
}

export async function listContacts(
  ctx: TenantContext,
  filters: ContactFilters,
  page = 1,
  pageSize = 20
) {
  const where = {
    organizationId: ctx.organizationId,
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
    ...(filters.lifecycleStage ? { lifecycleStage: filters.lifecycleStage } : {}),
    ...(filters.tagId ? { tagLinks: { some: { tagId: filters.tagId } } } : {}),
    ...(filters.q
      ? {
          OR: [
            { firstName: { contains: filters.q } },
            { lastName: { contains: filters.q } },
            { email: { contains: filters.q } },
            { phone: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
        _count: { select: { dealLinks: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts: rows.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      title: c.title,
      lifecycleStage: c.lifecycleStage,
      leadScore: c.leadScore,
      company: c.company,
      owner: c.owner,
      tags: c.tagLinks.map((tl) => tl.tag),
      dealCount: c._count.dealLinks,
      createdAt: c.createdAt,
    })),
    total,
  };
}

export async function getContact(ctx: TenantContext, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      owner: { select: { id: true, name: true } },
      company: { select: { id: true, name: true, industry: true } },
      dealLinks: {
        include: {
          deal: { include: { stage: { select: { name: true, kind: true } } } },
        },
      },
      tagLinks: { include: { tag: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!contact) return null;

  const timeline = await getTimeline(ctx, { contactId: id });
  return {
    ...contact,
    deals: contact.dealLinks.map((dl) => dl.deal),
    timeline,
  };
}

export async function createContact(ctx: TenantContext, input: CreateContactInput) {
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  await assertCompanyInOrg(ctx, input.companyId);
  return prisma.contact.create({
    data: {
      organizationId: ctx.organizationId,
      source: "MANUAL",
      lifecycleStage: input.lifecycleStage ?? "LEAD",
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email,
      phone: input.phone,
      title: input.title,
      companyId: input.companyId,
      ownerId: input.ownerId,
    },
  });
}

export async function updateContact(ctx: TenantContext, id: string, input: UpdateContactInput) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Contact not found.");
  if (!(await isOrgMember(ctx, input.ownerId))) {
    throw new Error("Owner must be a member of your organization.");
  }
  await assertCompanyInOrg(ctx, input.companyId);
  return prisma.contact.update({ where: { id }, data: input });
}

export async function deleteContact(ctx: TenantContext, id: string) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!existing) throw new Error("Contact not found.");
  await prisma.contact.delete({ where: { id } });
}

// ── Bulk actions ─────────────────────────────────────────────────────────
export async function bulkContacts(
  ctx: TenantContext,
  ids: string[],
  action: "delete" | "assignOwner" | "addTag" | "setLifecycle",
  value?: string
) {
  const scope = { id: { in: ids }, organizationId: ctx.organizationId };

  if (action === "delete") {
    const res = await prisma.contact.deleteMany({ where: scope });
    return { affected: res.count };
  }
  if (action === "assignOwner") {
    if (value && !(await isOrgMember(ctx, value))) throw new Error("Owner must be in your organization.");
    const res = await prisma.contact.updateMany({ where: scope, data: { ownerId: value || null } });
    return { affected: res.count };
  }
  if (action === "setLifecycle") {
    if (!value) throw new Error("Lifecycle stage required.");
    const res = await prisma.contact.updateMany({ where: scope, data: { lifecycleStage: value } });
    return { affected: res.count };
  }
  if (action === "addTag") {
    if (!value) throw new Error("Tag required.");
    const tag = await prisma.tag.findFirst({ where: { id: value, organizationId: ctx.organizationId }, select: { id: true } });
    if (!tag) throw new Error("Tag not found.");
    const targets = await prisma.contact.findMany({ where: scope, select: { id: true } });
    let added = 0;
    for (const t of targets) {
      const exists = await prisma.tagLink.findFirst({ where: { tagId: value, contactId: t.id }, select: { id: true } });
      if (!exists) { await prisma.tagLink.create({ data: { tagId: value, contactId: t.id } }); added++; }
    }
    return { affected: added };
  }
  throw new Error("Unknown action.");
}

// ── CSV import ─────────────────────────────────────────────────────────────
export interface ImportRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  companyName?: string;
}

export async function importContacts(ctx: TenantContext, rows: ImportRow[]) {
  let created = 0;
  let skipped = 0;
  const companyCache = new Map<string, string>(); // name(lower) -> id
  const seenEmails = new Set<string>(); // in-batch email dedupe

  // Respect the plan's company cap (Free = 100): don't create new companies past it.
  const limit = await getLeadLimit(ctx.organizationId);
  let companyCount = limit == null ? 0 : await prisma.company.count({ where: { organizationId: ctx.organizationId } });

  for (const r of rows) {
    const firstName = (r.firstName || "").trim();
    const email = (r.email || "").trim().toLowerCase();
    if (!firstName && !email) { skipped++; continue; }

    if (email) {
      if (seenEmails.has(email)) { skipped++; continue; }
      const dupe = await prisma.contact.findFirst({ where: { organizationId: ctx.organizationId, email }, select: { id: true } });
      if (dupe) { skipped++; continue; }
      seenEmails.add(email);
    }

    let companyId: string | undefined;
    const companyName = (r.companyName || "").trim();
    if (companyName) {
      const key = companyName.toLowerCase();
      companyId = companyCache.get(key);
      if (!companyId) {
        const found = await prisma.company.findFirst({ where: { organizationId: ctx.organizationId, name: companyName }, select: { id: true } });
        if (found) {
          companyId = found.id;
          companyCache.set(key, companyId);
        } else if (limit == null || companyCount < limit) {
          const co = await prisma.company.create({ data: { organizationId: ctx.organizationId, name: companyName, source: "IMPORT", ownerId: ctx.userId } });
          companyId = co.id;
          companyCount++;
          companyCache.set(key, companyId);
        }
        // else: at the company cap — import the contact without creating a company.
      }
    }

    await prisma.contact.create({
      data: {
        organizationId: ctx.organizationId,
        firstName: firstName || email.split("@")[0],
        lastName: (r.lastName || "").trim(),
        email: email || null,
        phone: (r.phone || "").trim() || null,
        title: (r.title || "").trim() || null,
        companyId,
        ownerId: ctx.userId,
        source: "IMPORT",
      },
    });
    created++;
  }
  return { created, skipped };
}
