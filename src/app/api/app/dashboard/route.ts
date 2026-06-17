import { route, ok } from "@/server/http";
import { getCrmSummary } from "@/server/services/dashboardV2Service";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx }) => {
  return ok(await getCrmSummary(ctx));
});
