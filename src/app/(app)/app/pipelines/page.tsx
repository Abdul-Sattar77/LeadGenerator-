import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import Forbidden from "@/app/(app)/_components/Forbidden";
import PipelinesClient from "./PipelinesClient";

export const metadata = { title: "Pipeline stages · LeadFinder" };

export default async function PipelinesPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;
  return <PipelinesClient />;
}
