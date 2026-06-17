import { requireAuth } from "@/server/tenant";
import CompanyDetail from "./CompanyDetail";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();
  return <CompanyDetail id={params.id} />;
}
