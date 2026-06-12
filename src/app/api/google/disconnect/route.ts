import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.account.deleteMany({ where: { userId: ctx.userId, provider: "google" } });
  return NextResponse.json({ ok: true });
}
