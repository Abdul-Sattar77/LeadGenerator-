import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import Forbidden from "@/app/(app)/_components/Forbidden";
import SequenceDetail from "./SequenceDetail";

export default async function SequenceDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;
  return <SequenceDetail id={params.id} />;
}
