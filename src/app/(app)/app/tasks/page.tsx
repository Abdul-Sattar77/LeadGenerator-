import { requireAuth } from "@/server/tenant";
import { listOrgMembers, listLeads } from "@/server/services/leadService";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const ctx = await requireAuth();
  const [members, leads] = await Promise.all([listOrgMembers(ctx), listLeads(ctx)]);
  return <TasksClient members={members} leads={leads.map((l) => ({ id: l.id, name: l.name }))} />;
}
