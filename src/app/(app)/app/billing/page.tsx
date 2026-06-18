import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getBilling } from "@/server/services/billingService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan & billing · LeadFinder" };

export default async function BillingPage({ searchParams }: { searchParams: { upgraded?: string } }) {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "ADMIN")) return <Forbidden need="Admin" />;

  const billing = await getBilling(ctx);
  return <BillingClient billing={billing} upgraded={searchParams.upgraded ?? null} />;
}
