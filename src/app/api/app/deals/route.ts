import { route, ok } from "@/server/http";
import { getBoard, createDeal } from "@/server/services/dealService";
import { createDealSchema } from "@/lib/validations/deal";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx, req }) => {
  const { searchParams } = new URL(req.url);
  const board = await getBoard(ctx, searchParams.get("pipelineId") || undefined);
  return ok(board);
});

export const POST = route({ role: "SALES_REP", body: createDealSchema }, async ({ ctx, body }) => {
  const deal = await createDeal(ctx, body);
  return ok(deal, { status: 201 });
});
