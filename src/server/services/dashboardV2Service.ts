import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { resolvePipeline } from "@/server/services/pipelineService";

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

/** Headline CRM metrics computed from the relational model (Company/Contact/Deal). */
export async function getCrmSummary(ctx: TenantContext) {
  const org = ctx.organizationId;
  const pipeline = await resolvePipeline(ctx, undefined);

  const [companies, contacts, deals] = await Promise.all([
    prisma.company.count({ where: { organizationId: org } }),
    prisma.contact.count({ where: { organizationId: org } }),
    prisma.deal.findMany({
      where: { organizationId: org, ...(pipeline ? { pipelineId: pipeline.id } : {}) },
      select: { value: true, status: true, stageId: true },
    }),
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
  };
}
