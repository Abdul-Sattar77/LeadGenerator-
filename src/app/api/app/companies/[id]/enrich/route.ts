import { route, ok, fail } from "@/server/http";
import { enrichCompany } from "@/server/services/enrichmentService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = route({ role: "SALES_REP" }, async ({ ctx, params }) => {
  try {
    return ok(await enrichCompany(ctx, params.id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Enrichment failed.", 422);
  }
});
