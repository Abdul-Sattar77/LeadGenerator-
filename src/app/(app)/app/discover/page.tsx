import { requireAuth } from "@/server/tenant";
import { getBilling } from "@/server/services/billingService";
import DiscoverClient from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const ctx = await requireAuth();
  const billing = await getBilling(ctx);
  return <DiscoverClient isPaid={billing.plan !== "FREE"} />;
}
