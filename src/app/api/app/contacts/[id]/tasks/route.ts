import { route, ok } from "@/server/http";
import { listRecordTasks, createRecordTask } from "@/server/services/recordTaskService";
import { createRecordTaskSchema } from "@/lib/validations/task";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, params }) => {
  return ok(await listRecordTasks(ctx, { contactId: params.id }));
});

export const POST = route({ role: "SALES_REP", body: createRecordTaskSchema }, async ({ ctx, params, body }) => {
  return ok(await createRecordTask(ctx, { contactId: params.id }, body), { status: 201 });
});
