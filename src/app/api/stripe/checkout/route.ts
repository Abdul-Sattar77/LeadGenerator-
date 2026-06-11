import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast, PLAN_TIERS } from "@/lib/enums";
import { createCheckoutSession, setPlan, cancelStripeSubscription } from "@/server/services/billingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ plan: z.enum(PLAN_TIERS) });

// POST /api/stripe/checkout { plan }
//  - Free  -> cancel any Stripe sub + instant downgrade
//  - Paid  -> Stripe Checkout URL (or instant switch if Stripe isn't configured)
export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Only admins can change the plan." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 422 });
  const { plan } = parsed.data;

  if (plan === "FREE") {
    await cancelStripeSubscription(ctx.organizationId);
    await setPlan(ctx, "FREE");
    return NextResponse.json({ instant: true });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = await createCheckoutSession(ctx, plan, origin);
  if (url) return NextResponse.json({ url });

  // Stripe not configured — fall back to an instant switch (demo mode).
  await setPlan(ctx, plan);
  return NextResponse.json({ instant: true });
}
