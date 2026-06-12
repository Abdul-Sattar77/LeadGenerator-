"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/plans";

const HIDE_PREFIXES = ["/login", "/register", "/forgot-password", "/verify-email"];
const FREE_LIMIT = PLANS.FREE.leadLimit ?? 100;

// Upgrade strip shown ABOVE all chrome to:
//  - logged-out visitors, and
//  - logged-in users still on the Free plan.
// Hidden for paid (Pro/Agency) users. Clicking it goes to pricing.
export default function PromoBanner() {
  const pathname = usePathname();
  const { status } = useSession();
  const authed = status === "authenticated";

  // Only fetch the plan once we know the user is signed in.
  const { data } = useQuery({
    queryKey: ["plan"],
    queryFn: async () => {
      const res = await fetch("/api/app/plan");
      if (!res.ok) throw new Error();
      return (await res.json()) as { plan: string };
    },
    enabled: authed,
    staleTime: 60_000,
  });

  // Never show on auth screens.
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  // Authed: wait until we know the plan, then hide for paid users.
  if (authed) {
    if (!data) return null;
    if (data.plan !== "FREE") return null;
  } else if (status === "loading") {
    // Avoid a flash before we know auth state on app routes.
    if (pathname.startsWith("/app")) return null;
  }

  const message = authed
    ? `You're on the Free plan — ${FREE_LIMIT} leads included.`
    : `Get your first ${FREE_LIMIT} leads free — no credit card needed.`;

  return (
    <Link
      href="/pricing"
      className="group block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white"
    >
      <div className="container flex h-10 items-center justify-center gap-2 text-center text-sm">
        <Sparkles className="h-4 w-4 shrink-0 text-white/90" />
        <span className="font-medium">
          {message}{" "}
          <span className="hidden sm:inline text-white/90">Upgrade to Pro for unlimited leads.</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold transition-colors group-hover:bg-white/30">
          {authed ? "Upgrade" : "See pricing"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
