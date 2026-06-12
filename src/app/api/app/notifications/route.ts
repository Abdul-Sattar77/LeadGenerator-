import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { listNotifications, markAllRead } from "@/server/services/notificationService";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listNotifications(ctx));
}

// PATCH /api/app/notifications  -> mark all read
export async function PATCH() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(ctx);
  return NextResponse.json({ ok: true });
}
