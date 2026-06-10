import { requireAuth } from "@/server/tenant";
import DiscoverClient from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  await requireAuth();
  return <DiscoverClient />;
}
