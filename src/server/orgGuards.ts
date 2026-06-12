import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";

// Membership checks used before persisting request-supplied foreign keys, so a
// caller can't assign records to users/leads in another organization.

/** True if `userId` is a member of the caller's org (null/undefined = "unassigned" = allowed). */
export async function isOrgMember(ctx: TenantContext, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return true;
  const u = await prisma.user.findFirst({
    where: { id: userId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  return Boolean(u);
}

/** True if `leadId` belongs to the caller's org (null/undefined allowed). */
export async function isOrgLead(ctx: TenantContext, leadId: number | null | undefined): Promise<boolean> {
  if (leadId == null) return true;
  const l = await prisma.lead.findFirst({
    where: { id: leadId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  return Boolean(l);
}
