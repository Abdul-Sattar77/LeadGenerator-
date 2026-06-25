import { route, ok } from "@/server/http";
import { savePipelineStages } from "@/server/services/pipelineService";
import { savePipelineStagesSchema } from "@/lib/validations/pipeline";

export const dynamic = "force-dynamic";

export const PUT = route({ role: "MANAGER", body: savePipelineStagesSchema }, async ({ ctx, params, body }) => {
  await savePipelineStages(ctx, params.id, body.stages);
  return ok({ ok: true });
});
