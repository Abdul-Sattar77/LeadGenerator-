import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { serializeLead } from "@/server/services/leadService";
import { LEAD_STATUSES } from "@/lib/enums";
import { z } from "zod";
import type { createCampaignSchema, updateCampaignSchema } from "@/lib/validations/campaign";

type CreateInput = z.infer<typeof createCampaignSchema>;
type UpdateInput = z.infer<typeof updateCampaignSchema>;

export async function listCampaigns(ctx: TenantContext) {
  const rows = await prisma.campaign.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  // Won count + value per campaign (single grouped query).
  const wonAgg = await prisma.lead.groupBy({
    by: ["campaignId"],
    where: { organizationId: ctx.organizationId, status: "WON", campaignId: { not: null } },
    _count: { _all: true },
    _sum: { dealValue: true },
  });
  const wonMap = new Map(wonAgg.map((r) => [r.campaignId, { won: r._count._all, value: Number(r._sum.dealValue ?? 0) }]));

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    leadCount: c._count.leads,
    wonCount: wonMap.get(c.id)?.won ?? 0,
    wonValue: wonMap.get(c.id)?.value ?? 0,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createCampaign(ctx: TenantContext, input: CreateInput) {
  const c = await prisma.campaign.create({
    data: {
      organizationId: ctx.organizationId,
      name: input.name,
      description: input.description ?? "",
      createdById: ctx.userId,
    },
  });
  return { id: c.id, name: c.name };
}

export async function getCampaign(ctx: TenantContext, id: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!campaign) return null;

  const leadRows = await prisma.lead.findMany({
    where: { organizationId: ctx.organizationId, campaignId: id },
    include: { assignedUser: { select: { id: true, name: true } } },
    orderBy: [{ leadScore: "desc" }, { savedAt: "desc" }],
  });
  const leads = leadRows.map(serializeLead);

  const byStatus = LEAD_STATUSES.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }));
  const won = leads.filter((l) => l.status === "WON");

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
    },
    leads,
    stats: {
      total: leads.length,
      wonCount: won.length,
      wonValue: won.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      pipelineValue: leads.filter((l) => l.status !== "WON" && l.status !== "LOST").reduce((s, l) => s + (l.dealValue ?? 0), 0),
      byStatus,
    },
  };
}

export async function updateCampaign(ctx: TenantContext, id: string, input: UpdateInput): Promise<boolean> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  const res = await prisma.campaign.updateMany({ where: { id, organizationId: ctx.organizationId }, data });
  return res.count > 0;
}

export async function deleteCampaign(ctx: TenantContext, id: string): Promise<boolean> {
  // Detach leads first (keep the leads, just remove campaign membership).
  await prisma.lead.updateMany({ where: { organizationId: ctx.organizationId, campaignId: id }, data: { campaignId: null } });
  const res = await prisma.campaign.deleteMany({ where: { id, organizationId: ctx.organizationId } });
  return res.count > 0;
}

export async function addLeadsToCampaign(ctx: TenantContext, id: string, leadIds: number[]): Promise<number> {
  const campaign = await prisma.campaign.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
  if (!campaign) return 0;
  const res = await prisma.lead.updateMany({
    where: { id: { in: leadIds }, organizationId: ctx.organizationId },
    data: { campaignId: id },
  });
  return res.count;
}

export async function removeLeadFromCampaign(ctx: TenantContext, id: string, leadId: number): Promise<boolean> {
  const res = await prisma.lead.updateMany({
    where: { id: leadId, organizationId: ctx.organizationId, campaignId: id },
    data: { campaignId: null },
  });
  return res.count > 0;
}

/** Leads not yet in any campaign — candidates to add. */
export async function listAddableLeads(ctx: TenantContext) {
  const rows = await prisma.lead.findMany({
    where: { organizationId: ctx.organizationId, campaignId: null },
    include: { assignedUser: { select: { id: true, name: true } } },
    orderBy: [{ leadScore: "desc" }, { savedAt: "desc" }],
  });
  return rows.map(serializeLead);
}
