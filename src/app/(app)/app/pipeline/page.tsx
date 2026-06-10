import { requireAuth } from "@/server/tenant";
import { getPipelineStats } from "@/server/services/leadService";
import PipelineBoard from "./PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const ctx = await requireAuth();
  const { leads, stats } = await getPipelineStats(ctx);
  return <PipelineBoard initialLeads={leads} initialStats={stats} />;
}
