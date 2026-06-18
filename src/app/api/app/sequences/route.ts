import { route, ok } from "@/server/http";
import { listSequences, createSequence } from "@/server/services/sequenceService";
import { createSequenceSchema } from "@/lib/validations/sequence";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx }) => ok(await listSequences(ctx)));

export const POST = route({ role: "MANAGER", body: createSequenceSchema }, async ({ ctx, body }) =>
  ok(await createSequence(ctx, body.name), { status: 201 })
);
