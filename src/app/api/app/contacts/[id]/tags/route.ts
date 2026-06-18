import { route, ok } from "@/server/http";
import { attachTag, detachTag } from "@/server/services/tagService";
import { attachTagSchema } from "@/lib/validations/tag";

export const dynamic = "force-dynamic";

export const POST = route({ role: "SALES_REP", body: attachTagSchema }, async ({ ctx, params, body }) =>
  ok(await attachTag(ctx, { contactId: params.id }, body), { status: 201 })
);

export const DELETE = route({ role: "SALES_REP" }, async ({ ctx, params, req }) => {
  const tagId = new URL(req.url).searchParams.get("tagId") || "";
  await detachTag(ctx, { contactId: params.id }, tagId);
  return ok({ ok: true });
});
