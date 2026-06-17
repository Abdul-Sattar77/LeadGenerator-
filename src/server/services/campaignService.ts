import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { campaignEmailStats } from "@/server/services/emailService";
import { z } from "zod";
import type { createCampaignSchema, updateCampaignSchema } from "@/lib/validations/campaign";

type CreateInput = z.infer<typeof createCampaignSchema>;
type UpdateInput = z.infer<typeof updateCampaignSchema>;

const LIFECYCLE = ["LEAD", "QUALIFIED", "CUSTOMER", "EVANGELIST"] as const;

function serializeContact(c: {
  id: string; firstName: string; lastName: string; email: string | null;
  lifecycleStage: string; leadScore: number;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
}) {
  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    company: c.company,
    status: c.lifecycleStage,
    leadScore: c.leadScore,
    assignedUser: c.owner,
  };
}

const CONTACT_SELECT = {
  id: true, firstName: true, lastName: true, email: true, lifecycleStage: true, leadScore: true,
  company: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
} as const;

export async function listCampaigns(ctx: TenantContext) {
  const rows = await prisma.campaign.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true } } },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    leadCount: c._count.contacts,
    wonCount: 0,
    wonValue: 0,
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

  const contactRows = await prisma.contact.findMany({
    where: { organizationId: ctx.organizationId, campaignId: id },
    select: CONTACT_SELECT,
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
  });
  const leads = contactRows.map(serializeContact);

  // Deal aggregates for the campaign's contacts (won / pipeline value).
  const contactIds = contactRows.map((c) => c.id);
  const deals = contactIds.length
    ? await prisma.deal.findMany({
        where: { organizationId: ctx.organizationId, primaryContactId: { in: contactIds } },
        select: { value: true, status: true },
      })
    : [];
  const won = deals.filter((d) => d.status === "WON");
  const open = deals.filter((d) => d.status === "OPEN");

  const byStatus = LIFECYCLE.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }));
  const emailStats = await campaignEmailStats(ctx, id);
  const withEmail = leads.filter((l) => Boolean(l.email)).length;

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
      withEmail,
      wonCount: won.length,
      wonValue: won.reduce((s, d) => s + Number(d.value ?? 0), 0),
      pipelineValue: open.reduce((s, d) => s + Number(d.value ?? 0), 0),
      byStatus,
      email: emailStats,
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
  // Detach contacts first (keep them, just remove campaign membership).
  await prisma.contact.updateMany({ where: { organizationId: ctx.organizationId, campaignId: id }, data: { campaignId: null } });
  const res = await prisma.campaign.deleteMany({ where: { id, organizationId: ctx.organizationId } });
  return res.count > 0;
}

export async function addContactsToCampaign(ctx: TenantContext, id: string, contactIds: string[]): Promise<number> {
  const campaign = await prisma.campaign.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
  if (!campaign) return 0;
  const res = await prisma.contact.updateMany({
    where: { id: { in: contactIds }, organizationId: ctx.organizationId },
    data: { campaignId: id },
  });
  return res.count;
}

export async function removeContactFromCampaign(ctx: TenantContext, id: string, contactId: string): Promise<boolean> {
  const res = await prisma.contact.updateMany({
    where: { id: contactId, organizationId: ctx.organizationId, campaignId: id },
    data: { campaignId: null },
  });
  return res.count > 0;
}

/** Contacts not yet in any campaign — candidates to add. */
export async function listAddableContacts(ctx: TenantContext) {
  const rows = await prisma.contact.findMany({
    where: { organizationId: ctx.organizationId, campaignId: null },
    select: CONTACT_SELECT,
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(serializeContact);
}
