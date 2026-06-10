import { requireAuth } from "@/server/tenant";
import { listOrgMembers } from "@/server/services/leadService";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const ctx = await requireAuth();
  const members = await listOrgMembers(ctx);
  return <LeadsClient members={members} />;
}
