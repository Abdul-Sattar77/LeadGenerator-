import { route, ok, fail } from "@/server/http";
import { getDeal, updateDeal, deleteDeal } from "@/server/services/dealService";
import { updateDealSchema } from "@/lib/validations/deal";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, params }) => {
  const deal = await getDeal(ctx, params.id);
  if (!deal) return fail("Deal not found.", 404);
  return ok(deal);
});

export const PATCH = route({ role: "SALES_REP", body: updateDealSchema }, async ({ ctx, params, body }) => {
  return ok(await updateDeal(ctx, params.id, body));
});

export const DELETE = route({ role: "MANAGER" }, async ({ ctx, params }) => {
  await deleteDeal(ctx, params.id);
  return ok({ ok: true });
});
