import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { listMembers } from "@/server/services/teamService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;

  const members = await listMembers(ctx);
  return <TeamClient initial={members} isAdmin={roleAtLeast(ctx.role, "ADMIN")} />;
}
