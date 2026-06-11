import type Stripe from "stripe";
import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { getStripe } from "@/lib/stripe";
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

// ── Stripe ─────────────────────────────────────────────────────────────

/** Create a Stripe Checkout session for a paid plan. Returns the URL, or null
 *  when Stripe isn't configured (caller falls back to an instant switch). */
export async function createCheckoutSession(ctx: TenantContext, tier: PlanTier, origin: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const plan = PLANS[tier];
  const sub = await prisma.subscription.findUnique({ where: { organizationId: ctx.organizationId } });

  // Reuse or create the org's Stripe customer.
  let customerId = sub?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email || undefined,
      name: ctx.name || undefined,
      metadata: { organizationId: ctx.organizationId },
    });
    customerId = customer.id;
    await prisma.subscription.update({ where: { organizationId: ctx.organizationId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: `LeadFinder ${plan.name}` },
          unit_amount: plan.price * 100,
          recurring: { interval: "month" },
        },
      },
    ],
    success_url: `${origin}/app/settings?upgraded=${tier}`,
    cancel_url: `${origin}/app/settings`,
    metadata: { organizationId: ctx.organizationId, plan: tier },
    subscription_data: { metadata: { organizationId: ctx.organizationId, plan: tier } },
  });

  return session.url;
}

/** Cancel a paid Stripe subscription (used when downgrading to Free). */
export async function cancelStripeSubscription(organizationId: string): Promise<void> {
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { organizationId } });
  if (stripe && sub?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch {
      /* already cancelled / not found — ignore */
    }
  }
  await prisma.subscription.update({
    where: { organizationId },
    data: { stripeSubscriptionId: null, status: "CANCELED" },
  });
}

/** Apply a verified Stripe webhook event to the org's subscription. */
export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const orgId = s.metadata?.organizationId;
      const plan = s.metadata?.plan as PlanTier | undefined;
      if (orgId && plan) {
        await prisma.subscription.updateMany({
          where: { organizationId: orgId },
          data: {
            plan,
            status: "ACTIVE",
            stripeCustomerId: typeof s.customer === "string" ? s.customer : undefined,
            stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : undefined,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (orgId) {
        const status = sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : sub.status === "canceled" ? "CANCELED" : "ACTIVE";
        // current_period_end isn't on the pinned type for all API versions — read defensively.
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        await prisma.subscription.updateMany({
          where: { organizationId: orgId },
          data: { status, ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}) },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (orgId) {
        await prisma.subscription.updateMany({
          where: { organizationId: orgId },
          data: { plan: "FREE", status: "CANCELED", stripeSubscriptionId: null },
        });
      }
      break;
    }
  }
}
