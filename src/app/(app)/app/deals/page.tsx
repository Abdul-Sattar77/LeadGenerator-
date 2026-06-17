import { requireAuth } from "@/server/tenant";
import DealsBoard from "./DealsBoard";

export const metadata = { title: "Deals · LeadFinder" };

export default async function DealsPage() {
  await requireAuth();
  return <DealsBoard />;
}
