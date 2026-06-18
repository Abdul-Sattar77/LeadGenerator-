import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { resolvePipeline } from "@/server/services/pipelineService";

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** New companies / contacts / deals per month for the last 6 months. */
export async function getTimeseries(ctx: TenantContext) {
  const org = ctx.organizationId;
  const now = new Date();
  // Build 6 month buckets (oldest → newest).
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { y: d.getFullYear(), m: d.getMonth(), label: MONTHS[d.getMonth()], companies: 0, contacts: 0, deals: 0 };
  });
  const start = new Date(buckets[0].y, buckets[0].m, 1);
  const idxOf = (date: Date) => buckets.findIndex((b) => b.y === date.getFullYear() && b.m === date.getMonth());

  const [companies, contacts, deals] = await Promise.all([
    prisma.company.findMany({ where: { organizationId: org, createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.contact.findMany({ where: { organizationId: org, createdAt: { gte: start } }, select: { createdAt: true } }),
    prisma.deal.findMany({ where: { organizationId: org, createdAt: { gte: start } }, select: { createdAt: true } }),
  ]);
  for (const c of companies) { const i = idxOf(c.createdAt); if (i >= 0) buckets[i].companies++; }
  for (const c of contacts) { const i = idxOf(c.createdAt); if (i >= 0) buckets[i].contacts++; }
  for (const d of deals) { const i = idxOf(d.createdAt); if (i >= 0) buckets[i].deals++; }

  return buckets.map((b) => ({ label: b.label, companies: b.companies, contacts: b.contacts, deals: b.deals }));
}

/** Headline CRM metrics computed from the relational model (Company/Contact/Deal). */
export async function getCrmSummary(ctx: TenantContext) {
  const org = ctx.organizationId;
  const pipeline = await resolvePipeline(ctx, undefined);

  const [companies, contacts, deals, timeseries] = await Promise.all([
    prisma.company.count({ where: { organizationId: org } }),
    prisma.contact.count({ where: { organizationId: org } }),
    prisma.deal.findMany({
      where: { organizationId: org, ...(pipeline ? { pipelineId: pipeline.id } : {}) },
      select: { value: true, status: true, stageId: true },
    }),
    getTimeseries(ctx),
  ]);

  const open = deals.filter((d) => d.status === "OPEN");
  const won = deals.filter((d) => d.status === "WON");
  const lost = deals.filter((d) => d.status === "LOST");
  const closed = won.length + lost.length;

  const stages = (pipeline?.stages ?? []).map((s) => {
    const inStage = deals.filter((d) => d.stageId === s.id);
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      count: inStage.length,
      value: inStage.reduce((sum, d) => sum + num(d.value), 0),
    };
  });

  return {
    companies,
    contacts,
    openDeals: open.length,
    openValue: open.reduce((s, d) => s + num(d.value), 0),
    wonValue: won.reduce((s, d) => s + num(d.value), 0),
    winRate: closed ? Math.round((won.length / closed) * 100) : 0,
    stages,
    timeseries,
  };
}
