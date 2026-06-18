import { route, ok } from "@/server/http";
import { saveSteps } from "@/server/services/sequenceService";
import { saveStepsSchema } from "@/lib/validations/sequence";

export const dynamic = "force-dynamic";

export const PUT = route({ role: "MANAGER", body: saveStepsSchema }, async ({ ctx, params, body }) => {
  await saveSteps(ctx, params.id, body.steps);
  return ok({ ok: true });
});
