import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import Forbidden from "@/app/(app)/_components/Forbidden";
import SequencesClient from "./SequencesClient";

export const metadata = { title: "Sequences · LeadFinder" };

export default async function SequencesPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;
  return <SequencesClient />;
}
