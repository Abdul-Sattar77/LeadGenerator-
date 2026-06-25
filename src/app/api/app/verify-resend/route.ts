import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { requestVerification } from "@/server/services/verifyService";

export const dynamic = "force-dynamic";

// Authed: resend the verification email to the logged-in user.
export async function POST() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await requestVerification(ctx.email); } catch { /* swallow */ }
  return NextResponse.json({ ok: true });
}
