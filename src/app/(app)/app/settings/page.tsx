import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getBilling } from "@/server/services/billingService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "ADMIN")) return <Forbidden need="Admin" />;

  const billing = await getBilling(ctx);
  return <SettingsClient billing={billing} />;
}
