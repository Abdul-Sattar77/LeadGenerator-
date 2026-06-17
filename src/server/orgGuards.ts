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
