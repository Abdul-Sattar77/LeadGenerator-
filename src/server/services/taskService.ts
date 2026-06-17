import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { notify } from "@/server/services/notificationService";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/task";

type TaskRow = Awaited<ReturnType<typeof prisma.task.findFirst>>;

function isOverdue(status: string, dueDate: Date | null): boolean {
  if (status === "COMPLETED" || !dueDate) return false;
  // Overdue = the due DAY is before today (a task due today is not overdue).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return dueDate.getTime() < startOfToday.getTime();
}

function serializeTask(
  row: NonNullable<TaskRow> & {
    assignedUser?: { id: string; name: string } | null;
    lead?: { id: number; name: string } | null;
  }
) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    // Derive OVERDUE on read (no background job needed for display).
    status: isOverdue(row.status, row.dueDate) ? "OVERDUE" : row.status,
    priority: row.priority,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    assignedUser: row.assignedUser ? { id: row.assignedUser.id, name: row.assignedUser.name } : null,
    lead: row.lead ? { id: row.lead.id, name: row.lead.name } : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type SerializedTask = ReturnType<typeof serializeTask>;

const INCLUDE = {
  assignedUser: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
} as const;

export async function listTasks(
  ctx: TenantContext,
  filters: { view?: string; leadId?: number } = {}
): Promise<SerializedTask[]> {
  const rows = await prisma.task.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(filters.leadId ? { leadId: filters.leadId } : {}),
      ...(filters.view === "completed" ? { status: "COMPLETED" } : {}),
      ...(filters.view === "open" ? { status: { not: "COMPLETED" } } : {}),
    },
    include: INCLUDE,
    orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  let tasks = rows.map(serializeTask);
  if (filters.view === "overdue") tasks = tasks.filter((t) => t.status === "OVERDUE");
  return tasks;
}

export async function createTask(ctx: TenantContext, input: CreateTaskInput): Promise<SerializedTask> {
  const task = await prisma.task.create({
    data: {
      organizationId: ctx.organizationId,
      title: input.title,
      description: input.description ?? "",
      type: input.type ?? "CALL",
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assignedUserId: input.assignedUserId ?? ctx.userId,
      createdById: ctx.userId,
      leadId: input.leadId ?? null,
    },
    include: INCLUDE,
  });

  if (task.leadId) {
    await prisma.activity.create({
      data: { organizationId: ctx.organizationId, userId: ctx.userId, leadId: task.leadId, type: "TASK_CREATED" },
    });
  }
  // Notify the assignee if the task was assigned to someone else.
  if (task.assignedUserId && task.assignedUserId !== ctx.userId) {
    await notify(ctx.organizationId, task.assignedUserId, {
      type: "TASK_ASSIGNED",
      title: `New task: ${task.title}`,
      link: "/app/tasks",
    });
  }
  return serializeTask(task);
}

export async function updateTask(
  ctx: TenantContext,
  id: string,
  input: UpdateTaskInput
): Promise<SerializedTask | null> {
  const current = await prisma.task.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!current) return null;

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.assignedUserId !== undefined) data.assignedUserId = input.assignedUserId;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.status !== undefined) {
    data.status = input.status;
    data.completedAt = input.status === "COMPLETED" ? new Date() : null;
  }

  const task = await prisma.task.update({ where: { id }, data, include: INCLUDE });

  if (input.status === "COMPLETED" && current.status !== "COMPLETED") {
    // Log completion to whichever record the task is attached to (lead or v2 entity).
    const link = {
      leadId: task.leadId ?? undefined,
      companyId: task.companyId ?? undefined,
      contactId: task.contactId ?? undefined,
      dealId: task.dealId ?? undefined,
    };
    if (link.leadId || link.companyId || link.contactId || link.dealId) {
      await prisma.activity.create({
        data: { organizationId: ctx.organizationId, userId: ctx.userId, type: "TASK_COMPLETED", ...link },
      });
    }
  }
  return serializeTask(task);
}

export async function deleteTask(ctx: TenantContext, id: string): Promise<boolean> {
  const res = await prisma.task.deleteMany({ where: { id, organizationId: ctx.organizationId } });
  return res.count > 0;
}

/** Count of tasks due today (and not completed) — for the dashboard KPI. */
export async function countTasksDueToday(ctx: TenantContext): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.task.count({
    where: {
      organizationId: ctx.organizationId,
      status: { not: "COMPLETED" },
      dueDate: { gte: start, lt: end },
    },
  });
}
