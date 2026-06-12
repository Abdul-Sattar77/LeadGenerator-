import { NextResponse } from "next/server";
import { getTenantContext } from "@/server/tenant";
import { prisma } from "@/server/db";
import { exchangeCode } from "@/lib/googleMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const settings = (q: string) => NextResponse.redirect(new URL(`/app/settings?gmail=${q}`, base));

  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.redirect(new URL("/login", base));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(/g_oauth_state=([^;]+)/)?.[1];

  if (url.searchParams.get("error")) return settings("denied");
  if (!code || !state || state !== cookieState) return settings("error");

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.email) return settings("error");

    // Upsert the user's google account (one per user).
    const existing = await prisma.account.findFirst({ where: { userId: ctx.userId, provider: "google" } });
    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          providerAccountId: tokens.email,
          email: tokens.email,
          accessToken: tokens.accessToken,
          // keep the previous refresh token if Google didn't return a new one
          refreshToken: tokens.refreshToken ?? existing.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: ctx.userId,
          provider: "google",
          providerAccountId: tokens.email,
          email: tokens.email,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      });
    }
    const res = settings("connected");
    res.cookies.set("g_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return settings("error");
  }
}
