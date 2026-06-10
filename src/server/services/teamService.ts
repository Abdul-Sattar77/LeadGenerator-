import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import type { AddMemberInput } from "@/lib/validations/team";

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isSelf: boolean;
  assignedLeads: number;
  wonLeads: number;
  revenue: number;
  openTasks: number;
}

export async function listMembers(ctx: TenantContext): Promise<MemberRow[]> {
  const [users, leadCounts, wonAgg, openTasks] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.lead.groupBy({
      by: ["assignedUserId"],
      where: { organizationId: ctx.organizationId, assignedUserId: { not: null } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["assignedUserId"],
      where: { organizationId: ctx.organizationId, status: "WON", assignedUserId: { not: null } },
      _count: { _all: true },
      _sum: { dealValue: true },
    }),
    prisma.task.groupBy({
      by: ["assignedUserId"],
      where: { organizationId: ctx.organizationId, status: { not: "COMPLETED" }, assignedUserId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const leadMap = new Map(leadCounts.map((r) => [r.assignedUserId, r._count._all]));
  const wonCountMap = new Map(wonAgg.map((r) => [r.assignedUserId, r._count._all]));
  const wonValueMap = new Map(wonAgg.map((r) => [r.assignedUserId, Number(r._sum.dealValue ?? 0)]));
  const taskMap = new Map(openTasks.map((r) => [r.assignedUserId, r._count._all]));

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isSelf: u.id === ctx.userId,
    assignedLeads: leadMap.get(u.id) ?? 0,
    wonLeads: wonCountMap.get(u.id) ?? 0,
    revenue: wonValueMap.get(u.id) ?? 0,
    openTasks: taskMap.get(u.id) ?? 0,
  }));
}

/** Creates a member in the org with a generated temporary password (returned once). */
export async function addMember(ctx: TenantContext, input: AddMemberInput): Promise<{ tempPassword: string } | { error: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return { error: "A user with this email already exists." };

  const tempPassword = crypto.randomBytes(6).toString("base64url"); // ~8 chars
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.create({
    data: {
      organizationId: ctx.organizationId,
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  });
  return { tempPassword };
}

export async function updateMemberRole(ctx: TenantContext, userId: string, role: string): Promise<boolean> {
  // Scope the update to this org; never let an admin demote themselves into lockout.
  if (userId === ctx.userId) return false;
  const res = await prisma.user.updateMany({
    where: { id: userId, organizationId: ctx.organizationId },
    data: { role },
  });
  return res.count > 0;
}

export async function removeMember(ctx: TenantContext, userId: string): Promise<boolean> {
  if (userId === ctx.userId) return false; // can't remove yourself
  // Unassign their leads/tasks first (FK is SetNull-friendly via optional relation).
  await prisma.$transaction([
    prisma.lead.updateMany({ where: { organizationId: ctx.organizationId, assignedUserId: userId }, data: { assignedUserId: null } }),
    prisma.task.updateMany({ where: { organizationId: ctx.organizationId, assignedUserId: userId }, data: { assignedUserId: null } }),
  ]);
  const res = await prisma.user.deleteMany({ where: { id: userId, organizationId: ctx.organizationId } });
  return res.count > 0;
}
