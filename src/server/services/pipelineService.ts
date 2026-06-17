import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

export async function listPipelines(ctx: TenantContext) {
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { stages: { orderBy: { order: "asc" } } },
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
    })),
  }));
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
