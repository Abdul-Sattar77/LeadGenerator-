import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { searchPlaces } from "@/lib/google";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { planOf } from "@/lib/plans";
import { rateLimit, clientIp } from "@/server/rateLimit";

// Always run fresh on the server (never cache lead results).
export const dynamic = "force-dynamic";

const ANON_COOKIE = "lf_anon_search";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  if (!query) {
    return NextResponse.json({ error: "Please enter a search query." }, { status: 400 });
  }

  const session = await auth();

  // Rate limit per IP to protect the paid Google API from abuse/loops.
  // (Also closes the anon-cookie bypass: a script sending no cookies still gets capped.)
  const ip = clientIp(request);
  const limit = session?.user?.organizationId ? 30 : 8; // per minute
  const rl = rateLimit(`search:${ip}`, limit, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many searches — please slow down and try again shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // Per-plan cap: Free (and anonymous) = 20 leads/search; paid = up to 60.
  let maxAllowed = 20;
  let plan = "ANON";
  if (session?.user?.organizationId) {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId },
      select: { plan: true },
    });
    plan = planOf(sub?.plan ?? "FREE").tier;
    maxAllowed = plan === "FREE" ? 20 : 60;
  } else {
    // Anonymous visitors get ONE free search, then must sign up.
    const used = cookies().get(ANON_COOKIE)?.value;
    if (used) {
      return NextResponse.json(
        { error: "Create a free account to keep searching.", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }
  }

  const requested = parseInt(searchParams.get("max") || "20", 10) || 20;
  const max = Math.min(requested, maxAllowed);

  try {
    const results = await searchPlaces(query, max);
    const res = NextResponse.json({ results, query, plan, max, maxAllowed });
    // Mark the anonymous free search as used (30 days).
    if (!session) {
      res.cookies.set(ANON_COOKIE, "1", {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err.message, reason: err.reason || "unknown" },
      { status: err.status || 500 }
    );
  }
}
