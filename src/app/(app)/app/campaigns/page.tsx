import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { listCampaigns } from "@/server/services/campaignService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import CampaignsClient from "./CampaignsClient";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;
  return <CampaignsClient initial={await listCampaigns(ctx)} />;
}
