import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { PLANS, planOf } from "@/lib/plans";
import type { PlanTier } from "@/lib/enums";

export async function getBilling(ctx: TenantContext) {
  const [org, sub, leadCount, memberCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: ctx.organizationId }, select: { name: true } }),
    prisma.subscription.findUnique({ where: { organizationId: ctx.organizationId } }),
    prisma.lead.count({ where: { organizationId: ctx.organizationId } }),
    prisma.user.count({ where: { organizationId: ctx.organizationId } }),
  ]);

  const plan = planOf(sub?.plan ?? "FREE");
  return {
    orgName: org?.name ?? "",
    plan: plan.tier,
    status: sub?.status ?? "TRIALING",
    leadCount,
    leadLimit: plan.leadLimit,
    memberCount,
    seatLimit: plan.seats,
  };
}

/** Switch plan. In production this happens via the Stripe webhook after checkout;
 *  here it updates the subscription directly (instant) so the flow is usable now. */
export async function setPlan(ctx: TenantContext, tier: PlanTier): Promise<boolean> {
  if (!PLANS[tier]) return false;
  await prisma.subscription.update({
    where: { organizationId: ctx.organizationId },
    data: { plan: tier, status: "ACTIVE" },
  });
  return true;
}

export async function updateOrgName(ctx: TenantContext, name: string): Promise<void> {
  await prisma.organization.update({ where: { id: ctx.organizationId }, data: { name } });
}

/** Lead cap for an org's current plan, or null if unlimited. */
export async function getLeadLimit(organizationId: string): Promise<number | null> {
  const sub = await prisma.subscription.findUnique({ where: { organizationId }, select: { plan: true } });
  return planOf(sub?.plan ?? "FREE").leadLimit;
}
