import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export async function listPipelines(ctx: TenantContext) {
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      stages: { orderBy: { order: "asc" }, include: { _count: { select: { deals: true } } } },
    },
  });
  return pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    stages: p.stages.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      probability: s.probability,
      kind: s.kind,
      color: s.color,
      dealCount: s._count.deals,
    })),
  }));
}

export interface StageInput {
  id?: string;
  name: string;
  probability: number;
  kind: string; // OPEN | WON | LOST
  color?: string;
}

const PALETTE = ["#94a3b8", "#6366f1", "#a855f7", "#f59e0b", "#10b981", "#ef4444"];

/**
 * Replace a pipeline's stages from the editor. Existing stages (with id) are
 * updated, new ones created, removed ones deleted — but a removed stage that
 * still has deals is blocked (move them first) to avoid orphaning deals.
 */
export async function savePipelineStages(ctx: TenantContext, pipelineId: string, stages: StageInput[]) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, organizationId: ctx.organizationId },
    include: { stages: { include: { _count: { select: { deals: true } } } } },
  });
  if (!pipeline) throw new Error("Pipeline not found.");
  if (!stages.length) throw new Error("A pipeline needs at least one stage.");

  const keptIds = new Set(stages.filter((s) => s.id).map((s) => s.id));
  const removed = pipeline.stages.filter((s) => !keptIds.has(s.id));
  const blocked = removed.find((s) => s._count.deals > 0);
  if (blocked) throw new Error(`"${blocked.name}" still has deals — move them to another stage before deleting it.`);

  await prisma.$transaction([
    ...removed.map((s) => prisma.pipelineStage.delete({ where: { id: s.id } })),
    ...stages.map((s, i) =>
      s.id
        ? prisma.pipelineStage.update({
            where: { id: s.id },
            data: { name: s.name, order: i, probability: s.probability, kind: s.kind },
          })
        : prisma.pipelineStage.create({
            data: {
              pipelineId,
              name: s.name,
              order: i,
              probability: s.probability,
              kind: s.kind,
              color: s.color ?? PALETTE[i % PALETTE.length],
            },
          })
    ),
  ]);
}

/** Resolve the pipeline to show (requested → default → first). */
export async function resolvePipeline(ctx: TenantContext, pipelineId?: string) {
  return prisma.pipeline.findFirst({
    where: {
      organizationId: ctx.organizationId,
      ...(pipelineId ? { id: pipelineId } : {}),
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { stages: { orderBy: { order: "asc" } } },
  });
}
