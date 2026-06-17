import { requireAuth } from "@/server/tenant";
import CompaniesClient from "./CompaniesClient";

export const metadata = { title: "Companies · LeadFinder" };

export default async function CompaniesPage() {
  await requireAuth();
  return <CompaniesClient />;
}
