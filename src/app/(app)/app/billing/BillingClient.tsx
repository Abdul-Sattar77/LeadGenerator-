"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, CreditCard, Gauge, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { PLAN_TIERS, type PlanTier } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";

type Billing = {
  orgName: string;
  plan: PlanTier;
  status: string;
  leadCount: number;
  leadLimit: number | null;
  memberCount: number;
  seatLimit: number;
};

export default function BillingClient({ billing, upgraded }: { billing: Billing; upgraded: string | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [switching, setSwitching] = useState<PlanTier | null>(null);

  async function switchPlan(plan: PlanTier) {
    if (plan === billing.plan) return;
    setSwitching(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) { window.location.href = data.url; return; }
    setSwitching(null);
    if (res.ok) { qc.invalidateQueries({ queryKey: ["plan"] }); router.refresh(); }
  }

  const limit = billing.leadLimit;
  const usagePct = limit ? Math.min(100, Math.round((billing.leadCount / limit) * 100)) : 0;
  const nearLimit = limit != null && billing.leadCount / limit >= 0.8;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Plan & billing" subtitle="Your subscription, usage and upgrades." icon={CreditCard} />

      {upgraded && PLANS[upgraded as PlanTier] && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Sparkles className="h-4 w-4" /></span>
          <div className="text-sm"><span className="font-semibold">You’re on {PLANS[upgraded as PlanTier].name}!</span> Your subscription is active — enjoy unlimited companies.</div>
        </div>
      )}

      {/* Usage */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Usage</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Companies</span>
              <span className="font-semibold">{billing.leadCount}{limit != null ? ` / ${limit}` : " / ∞"}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className={cn("h-full rounded-full", nearLimit ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500")} style={{ width: limit ? `${usagePct}%` : "100%" }} />
            </div>
            {nearLimit && <p className="mt-1.5 text-xs font-medium text-rose-600">You’re close to your limit — upgrade for unlimited companies.</p>}
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Seats</span>
              <span className="font-semibold">{billing.memberCount} / {billing.seatLimit}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500" style={{ width: `${Math.min(100, (billing.memberCount / billing.seatLimit) * 100)}%` }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Plans</h2>
        <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Current: {PLANS[billing.plan].name}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_TIERS.map((tier) => {
          const p = PLANS[tier];
          const current = tier === billing.plan;
          return (
            <Card key={tier} className={cn("relative flex flex-col p-6", current ? "ring-2 ring-primary shadow-glow" : "card-lift")}>
              {current && <span className="brand-gradient absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-soft">Current plan</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-extrabold tracking-tight">${p.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ mo</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>
                ))}
              </ul>
              <Button variant={current ? "outline" : "gradient"} className="mt-5 w-full" disabled={current || switching != null} onClick={() => switchPlan(tier)}>
                {switching === tier ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {current ? "Current plan" : `Switch to ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Plan changes apply instantly in this demo. In production, paid plans go through Stripe Checkout.</p>
    </div>
  );
}
