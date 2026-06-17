import { route, ok } from "@/server/http";
import { addNote } from "@/server/services/recordService";
import { noteSchema } from "@/lib/validations/contact";

export const dynamic = "force-dynamic";

export const POST = route({ role: "SALES_REP", body: noteSchema }, async ({ ctx, params, body }) => {
  const note = await addNote(ctx, { dealId: params.id }, body.body);
  return ok(note, { status: 201 });
});
