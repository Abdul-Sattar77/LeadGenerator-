"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Building2, Contact2, Handshake, TrendingUp, Trophy, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { CountUp } from "@/components/app/CountUp";
import { EASE, fadeUp, stagger } from "@/lib/motion";

interface Summary {
  companies: number;
  contacts: number;
  openDeals: number;
  openValue: number;
  wonValue: number;
  winRate: number;
  stages: { id: string; name: string; kind: string; count: number; value: number }[];
}

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(n)}`;

function accent(kind: string) {
  if (kind === "WON") return "bg-emerald-500";
  if (kind === "LOST") return "bg-rose-500";
  return "bg-indigo-500";
}

export function CrmSummary() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-v2"], queryFn: () => api<Summary>("/api/app/dashboard") });

  if (isLoading || !data) {
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary/50" />;
  }

  const kpis = [
    { label: "Companies", value: data.companies, icon: Building2, href: "/app/companies", fmt: (n: number) => Math.round(n).toString() },
    { label: "Contacts", value: data.contacts, icon: Contact2, href: "/app/contacts", fmt: (n: number) => Math.round(n).toString() },
    { label: "Open deals", value: data.openDeals, icon: Handshake, href: "/app/deals", fmt: (n: number) => Math.round(n).toString() },
    { label: "Pipeline value", value: data.openValue, icon: TrendingUp, href: "/app/deals", fmt: money },
    { label: "Won revenue", value: data.wonValue, icon: Trophy, href: "/app/deals", fmt: money },
    { label: "Win rate", value: data.winRate, icon: Percent, href: "/app/deals", fmt: (n: number) => `${Math.round(n)}%` },
  ];

  const maxStage = Math.max(1, ...data.stages.map((s) => s.count));

  return (
    <div className="space-y-5">
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} variants={fadeUp}>
              <Link href={k.href}>
                <Card className="group p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                    <CountUp value={k.value} format={k.fmt} />
                  </div>
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {data.stages.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold">Pipeline by stage</h2>
          <div className="space-y-3">
            {data.stages.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground">{s.name}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-secondary/60">
                  <motion.div
                    className={`flex h-full items-center justify-end rounded-md px-2 ${accent(s.kind)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max((s.count / maxStage) * 100, s.count ? 8 : 0)}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
                  >
                    {s.count > 0 && <span className="text-[11px] font-semibold text-white">{s.count}</span>}
                  </motion.div>
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{money(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
