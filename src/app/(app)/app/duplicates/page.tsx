import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import Forbidden from "@/app/(app)/_components/Forbidden";
import DuplicatesClient from "./DuplicatesClient";

export const metadata = { title: "Duplicates · LeadFinder" };

export default async function DuplicatesPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;
  return <DuplicatesClient />;
}
