import { notFound } from "next/navigation";
import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getCampaign, listAddableLeads } from "@/server/services/campaignService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import CampaignDetailClient from "./CampaignDetailClient";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;

  const data = await getCampaign(ctx, params.id);
  if (!data) notFound();
  const addable = await listAddableLeads(ctx);

  return <CampaignDetailClient id={params.id} initial={data} addable={addable} />;
}
