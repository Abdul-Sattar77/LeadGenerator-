import { route, ok, fail } from "@/server/http";
import { saveDiscoveredCompany } from "@/server/services/intakeService";
import { discoverSaveSchema } from "@/lib/validations/intake";
import { PlanLimitError } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const POST = route({ role: "SALES_REP", body: discoverSaveSchema }, async ({ ctx, body }) => {
  try {
    const result = await saveDiscoveredCompany(ctx, body);
    return ok(result, { status: 201 });
  } catch (e) {
    if (e instanceof PlanLimitError) return fail(e.message, 402);
    throw e;
  }
});
