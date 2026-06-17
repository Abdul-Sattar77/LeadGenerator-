import { route, ok } from "@/server/http";
import { listContacts, createContact } from "@/server/services/contactService";
import { createContactSchema } from "@/lib/validations/contact";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, req }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "20", 10) || 20));
  const result = await listContacts(
    ctx,
    {
      q: searchParams.get("q") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      companyId: searchParams.get("companyId") || undefined,
      lifecycleStage: searchParams.get("lifecycleStage") || undefined,
    },
    page,
    pageSize
  );
  return ok({ ...result, page, pageSize });
});

export const POST = route({ role: "SALES_REP", body: createContactSchema }, async ({ ctx, body }) => {
  const contact = await createContact(ctx, body);
  return ok(contact, { status: 201 });
});
