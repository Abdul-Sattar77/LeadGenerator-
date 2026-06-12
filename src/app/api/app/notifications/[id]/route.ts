import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { markRead } from "@/server/services/notificationService";

export const dynamic = "force-dynamic";

// PATCH /api/app/notifications/:id  -> mark one read
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markRead(ctx, params.id);
  return NextResponse.json({ ok: true });
}
