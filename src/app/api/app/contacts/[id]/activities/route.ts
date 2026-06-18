import { route, ok } from "@/server/http";
import { logRecordActivity } from "@/server/services/recordService";
import { logActivitySchema } from "@/lib/validations/activity";

export const dynamic = "force-dynamic";

export const POST = route({ role: "SALES_REP", body: logActivitySchema }, async ({ ctx, params, body }) => {
  await logRecordActivity(ctx, { contactId: params.id }, body);
  return ok({ ok: true }, { status: 201 });
});
