"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign, Percent, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import { StatCard } from "@/components/ui/stat-card";
import type { LeadStatus } from "@/lib/enums";

type Funnel = { label: string; count: number }[];
type ByStage = { status: string; count: number }[];

// KPI row lives in a client component so the lucide icons resolve client-side
// (lucide isn't a client module, so server→client element passing would fail).
const KPI_ICONS = {
  users: Users, trending: TrendingUp, dollar: DollarSign, percent: Percent, check: CheckSquare,
} as const;

type Tone = "indigo" | "emerald" | "amber" | "sky" | "violet" | "rose";
type Kpi = { label: string; value: string | number; icon: keyof typeof KPI_ICONS; tone: Tone };

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((k, i) => {
        const Icon = KPI_ICONS[k.icon];
        return (
          <StatCard key={k.label} label={k.label} value={k.value} tone={k.tone} index={i} icon={<Icon className="h-5 w-5" />} />
        );
      })}
    </div>
  );
}

const FUNNEL_GRAD = [
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-fuchsia-500",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-teal-500",
];

export function ConversionFunnel({ funnel }: { funnel: Funnel }) {
  const top = Math.max(1, funnel[0]?.count ?? 1);
  return (
    <div className="space-y-3">
      {funnel.map((f, i) => {
        const pct = Math.round((f.count / top) * 100);
        const conv = i === 0 ? 100 : Math.round((f.count / (funnel[0].count || 1)) * 100);
        return (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{f.label}</span>
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground">{f.count}</span> · {conv}%
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-secondary/60">
              <motion.div
                className={cn("flex h-full items-center rounded-lg bg-gradient-to-r", FUNNEL_GRAD[i % FUNNEL_GRAD.length])}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, 6)}%` }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniBars({ data, tone, money = false }: { data: { label: string; value: number }[]; tone: string; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = (n: number) => (money ? (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${n}`) : String(n));
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d, i) => (
        <div key={d.label + i} className="flex h-full flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground">{fmt(d.value)}</span>
          <div className="flex w-full flex-1 items-end">
            <motion.div
              className={cn("w-full rounded-t-md", tone)}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LeadsByStage({ byStage }: { byStage: ByStage }) {
  const max = Math.max(1, ...byStage.map((s) => s.count));
  return (
    <div className="space-y-2.5">
      {byStage.map((s, i) => {
        const meta = LEAD_STATUS_META[s.status as LeadStatus];
        return (
          <div key={s.status} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{meta.label}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-md bg-secondary/50">
              <motion.div
                className={cn("h-full rounded-md", meta.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${(s.count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-bold">{s.count}</span>
          </div>
        );
      })}
    </div>
  );
}
