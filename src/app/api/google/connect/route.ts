import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getTenantContext } from "@/server/tenant";
import { googleEnabled, authUrl } from "@/lib/googleMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kicks off Google OAuth. Sets a CSRF state cookie, then redirects to Google.
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/app/settings?gmail=unconfigured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authUrl(state));
  res.cookies.set("g_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
