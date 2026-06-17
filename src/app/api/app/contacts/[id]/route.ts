import { route, ok, fail } from "@/server/http";
import { getContact, updateContact, deleteContact } from "@/server/services/contactService";
import { updateContactSchema } from "@/lib/validations/contact";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, params }) => {
  const contact = await getContact(ctx, params.id);
  if (!contact) return fail("Contact not found.", 404);
  return ok(contact);
});

export const PATCH = route({ role: "SALES_REP", body: updateContactSchema }, async ({ ctx, params, body }) => {
  return ok(await updateContact(ctx, params.id, body));
});

export const DELETE = route({ role: "MANAGER" }, async ({ ctx, params }) => {
  await deleteContact(ctx, params.id);
  return ok({ ok: true });
});
