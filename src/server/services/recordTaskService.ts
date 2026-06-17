import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { notify } from "@/server/services/notificationService";
import type { RecordTarget } from "@/server/services/recordService";
import type { CreateRecordTaskInput } from "@/lib/validations/task";

function isOverdue(status: string, dueDate: Date | null): boolean {
  if (status === "COMPLETED" || !dueDate) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return dueDate.getTime() < startOfToday.getTime();
}

type Row = {
  id: string; title: string; type: string; status: string; priority: string;
  dueDate: Date | null; completedAt: Date | null;
  assignedUser: { id: string; name: string } | null;
};

function serialize(row: Row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: isOverdue(row.status, row.dueDate) ? "OVERDUE" : row.status,
    priority: row.priority,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    assignedUser: row.assignedUser,
  };
}

export type SerializedRecordTask = ReturnType<typeof serialize>;

const INCLUDE = { assignedUser: { select: { id: true, name: true } } } as const;

function whereFor(ctx: TenantContext, target: RecordTarget) {
  return {
    organizationId: ctx.organizationId,
    ...(target.companyId ? { companyId: target.companyId } : {}),
    ...(target.contactId ? { contactId: target.contactId } : {}),
    ...(target.dealId ? { dealId: target.dealId } : {}),
  };
}

export async function listRecordTasks(ctx: TenantContext, target: RecordTarget): Promise<SerializedRecordTask[]> {
  const rows = await prisma.task.findMany({
    where: whereFor(ctx, target),
    include: INCLUDE,
    orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(serialize);
}

export async function createRecordTask(
  ctx: TenantContext,
  target: RecordTarget,
  input: CreateRecordTaskInput
): Promise<SerializedRecordTask> {
  const task = await prisma.task.create({
    data: {
      organizationId: ctx.organizationId,
      title: input.title,
      type: input.type ?? "CALL",
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assignedUserId: input.assignedUserId ?? ctx.userId,
      createdById: ctx.userId,
      companyId: target.companyId ?? null,
      contactId: target.contactId ?? null,
      dealId: target.dealId ?? null,
    },
    include: INCLUDE,
  });

  await prisma.activity.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      type: "TASK_CREATED",
      companyId: target.companyId ?? null,
      contactId: target.contactId ?? null,
      dealId: target.dealId ?? null,
    },
  });

  if (task.assignedUserId && task.assignedUserId !== ctx.userId) {
    await notify(ctx.organizationId, task.assignedUserId, {
      type: "TASK_ASSIGNED",
      title: `New task: ${task.title}`,
      link: "/app/tasks",
    });
  }
  return serialize(task);
}
