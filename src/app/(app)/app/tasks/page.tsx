import { requireAuth } from "@/server/tenant";
import { listMembers } from "@/server/services/teamService";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const ctx = await requireAuth();
  const members = await listMembers(ctx);
  return <TasksClient members={members.map((m) => ({ id: m.id, name: m.name, role: m.role }))} />;
}
