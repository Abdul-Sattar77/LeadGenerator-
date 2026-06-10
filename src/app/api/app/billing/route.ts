import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/server/tenant";
import { roleAtLeast, PLAN_TIERS } from "@/lib/enums";
import { setPlan } from "@/server/services/billingService";

export const dynamic = "force-dynamic";

const schema = z.object({ plan: z.enum(PLAN_TIERS) });

// POST /api/app/billing { plan } — switch plan (Stripe checkout slots in here in prod).
export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, "ADMIN")) return NextResponse.json({ error: "Only admins can change the plan." }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 422 });

  const ok = await setPlan(ctx, parsed.data.plan);
  if (!ok) return NextResponse.json({ error: "Could not change plan." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
