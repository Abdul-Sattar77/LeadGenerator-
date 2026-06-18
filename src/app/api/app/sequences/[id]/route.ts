import { route, ok, fail } from "@/server/http";
import { getSequence, updateSequence, deleteSequence } from "@/server/services/sequenceService";
import { updateSequenceSchema } from "@/lib/validations/sequence";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, params }) => {
  const seq = await getSequence(ctx, params.id);
  if (!seq) return fail("Sequence not found.", 404);
  return ok(seq);
});

export const PATCH = route({ role: "MANAGER", body: updateSequenceSchema }, async ({ ctx, params, body }) => {
  await updateSequence(ctx, params.id, body);
  return ok({ ok: true });
});

export const DELETE = route({ role: "MANAGER" }, async ({ ctx, params }) => {
  await deleteSequence(ctx, params.id);
  return ok({ ok: true });
});
