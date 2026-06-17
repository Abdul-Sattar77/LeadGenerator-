import { route, ok } from "@/server/http";
import { listPipelines } from "@/server/services/pipelineService";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx }) => {
  return ok(await listPipelines(ctx));
});
