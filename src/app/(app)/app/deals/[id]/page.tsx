import { requireAuth } from "@/server/tenant";
import DealDetail from "./DealDetail";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();
  return <DealDetail id={params.id} />;
}
