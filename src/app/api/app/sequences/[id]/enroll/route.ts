import { route, ok } from "@/server/http";
import { enrollContacts, stopEnrollment } from "@/server/services/sequenceService";
import { enrollSchema } from "@/lib/validations/sequence";

export const dynamic = "force-dynamic";

export const POST = route({ role: "SALES_REP", body: enrollSchema }, async ({ ctx, params, body }) =>
  ok(await enrollContacts(ctx, params.id, body.contactIds), { status: 201 })
);

// Stop one enrollment: DELETE ?enrollmentId=...
export const DELETE = route({ role: "SALES_REP" }, async ({ ctx, req }) => {
  const enrollmentId = new URL(req.url).searchParams.get("enrollmentId") || "";
  await stopEnrollment(ctx, enrollmentId);
  return ok({ ok: true });
});
