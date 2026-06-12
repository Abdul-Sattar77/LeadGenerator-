import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// Lightweight current-plan lookup for the upgrade banner.
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: ctx.organizationId },
    select: { plan: true },
  });
  return NextResponse.json({ plan: sub?.plan ?? "FREE" });
}
