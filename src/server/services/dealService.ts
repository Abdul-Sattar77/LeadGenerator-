import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { isOrgMember } from "@/server/orgGuards";
import { resolvePipeline } from "@/server/services/pipelineService";
import { getTimeline, logActivity } from "@/server/services/recordService";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validations/deal";

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

async function assertCompany(ctx: TenantContext, companyId?: string) {
  if (!companyId) return;
  const c = await prisma.company.findFirst({ where: { id: companyId, organizationId: ctx.organizationId }, select: { id: true } });
  if (!c) throw new Error("Company not found in your organization.");
}
async function assertContact(ctx: TenantContext, contactId?: string) {
  if (!contactId) return;
  const c = await prisma.contact.findFirst({ where: { id: contactId, organizationId: ctx.organizationId }, select: { id: true } });
  if (!c) throw new Error("Contact not found in your organization.");
}

/** The Kanban board for one pipeline: stages, deals grouped per stage, KPIs. */
export async function getBoard(ctx: TenantContext, pipelineId?: string) {
  const pipeline = await resolvePipeline(ctx, pipelineId);
  if (!pipeline) return null;

  const deals = await prisma.deal.findMany({
    where: { organizationId: ctx.organizationId, pipelineId: pipeline.id },
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      primaryContact: { select: { id: true, firstName: true, lastName: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  const rows = deals.map((d) => ({
    id: d.id,
    name: d.name,
    value: num(d.value),
    stageId: d.stageId,
    status: d.status,
    company: d.company,
    primaryContact: d.primaryContact
      ? { id: d.primaryContact.id, name: `${d.primaryContact.firstName} ${d.primaryContact.lastName}`.trim() }
      : null,
    owner: d.owner,
  }));

  const won = rows.filter((d) => d.status === "WON");
  const lost = rows.filter((d) => d.status === "LOST");
  const open = rows.filter((d) => d.status === "OPEN");
  const wonValue = won.reduce((s, d) => s + d.value, 0);
  const closed = won.length + lost.length;

  return {
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      stages: pipeline.stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind, probability: s.probability, color: s.color })),
    },
    deals: rows,
    stats: {
      total: rows.length,
      openCount: open.length,
      openValue: open.reduce((s, d) => s + d.value, 0),
      wonCount: won.length,
      wonValue,
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      avgWonValue: won.length ? Math.round(wonValue / won.length) : 0,
    },
  };
}

export async function getDeal(ctx: TenantContext, id: string) {
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      company: { select: { id: true, name: true } },
      primaryContact: { select: { id: true, firstName: true, lastName: true, email: true } },
      owner: { select: { id: true, name: true } },
      pipeline: { include: { stages: { orderBy: { order: "asc" }, select: { id: true, name: true, kind: true } } } },
      stage: { select: { id: true, name: true, kind: true, probability: true } },
      contactLinks: { include: { contact: { select: { id: true, firstName: true, lastName: true, email: true, title: true } } } },
    },
  });
  if (!deal) return null;

  const timeline = await getTimeline(ctx, { dealId: id });
  return {
    ...deal,
    value: num(deal.value),
    contacts: deal.contactLinks.map((cl) => ({ ...cl.contact, role: cl.role })),
    timeline,
  };
}

export async function createDeal(ctx: TenantContext, input: CreateDealInput) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: input.pipelineId, organizationId: ctx.organizationId },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  if (!pipeline) throw new Error("Pipeline not found.");
  const stage = input.stageId ? pipeline.stages.find((s) => s.id === input.stageId) : pipeline.stages[0];
  if (!stage) throw new Error("Stage not found in this pipeline.");

  if (!(await isOrgMember(ctx, input.ownerId))) throw new Error("Owner must be a member of your organization.");
  await assertCompany(ctx, input.companyId);
  await assertContact(ctx, input.primaryContactId);

  const status = stage.kind === "WON" ? "WON" : stage.kind === "LOST" ? "LOST" : "OPEN";

  const deal = await prisma.deal.create({
    data: {
      organizationId: ctx.organizationId,
      name: input.name,
      value: input.value ?? null,
      pipelineId: pipeline.id,
      stageId: stage.id,
      status,
      companyId: input.companyId,
      primaryContactId: input.primaryContactId,
      ownerId: input.ownerId,
      expectedCloseDate: input.expectedCloseDate,
      wonAt: status === "WON" ? new Date() : null,
      source: "MANUAL",
    },
  });

  if (input.primaryContactId) {
    await prisma.dealContact.create({ data: { dealId: deal.id, contactId: input.primaryContactId, role: "Primary" } });
  }
  await logActivity(ctx, "DEAL_CREATED", { dealId: deal.id, companyId: input.companyId, contactId: input.primaryContactId }, { name: deal.name });
  return deal;
}

export async function updateDeal(ctx: TenantContext, id: string, input: UpdateDealInput) {
  const existing = await prisma.deal.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { stage: { select: { id: true, name: true } }, pipeline: { include: { stages: true } } },
  });
  if (!existing) throw new Error("Deal not found.");
  if (!(await isOrgMember(ctx, input.ownerId))) throw new Error("Owner must be a member of your organization.");
  await assertCompany(ctx, input.companyId);
  await assertContact(ctx, input.primaryContactId);

  const data: Record<string, unknown> = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.value !== undefined ? { value: input.value } : {}),
    ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
    ...(input.primaryContactId !== undefined ? { primaryContactId: input.primaryContactId } : {}),
    ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
    ...(input.lostReason !== undefined ? { lostReason: input.lostReason } : {}),
    ...(input.expectedCloseDate !== undefined ? { expectedCloseDate: input.expectedCloseDate } : {}),
  };

  // Stage move → recompute status, stamp wonAt, log a STAGE_CHANGED activity.
  if (input.stageId && input.stageId !== existing.stageId) {
    const newStage = existing.pipeline.stages.find((s) => s.id === input.stageId);
    if (!newStage) throw new Error("Target stage not in this deal's pipeline.");
    const status = newStage.kind === "WON" ? "WON" : newStage.kind === "LOST" ? "LOST" : "OPEN";
    data.stageId = newStage.id;
    data.status = status;
    data.wonAt = status === "WON" ? new Date() : null;
    await logActivity(ctx, "STAGE_CHANGED", { dealId: id }, { from: existing.stage?.name ?? "—", to: newStage.name });
  }

  return prisma.deal.update({ where: { id }, data });
}

export async function deleteDeal(ctx: TenantContext, id: string) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
  if (!existing) throw new Error("Deal not found.");
  await prisma.deal.delete({ where: { id } });
}
