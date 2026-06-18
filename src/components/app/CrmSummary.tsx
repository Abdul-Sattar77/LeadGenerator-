"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Building2, Contact2, Handshake, TrendingUp, Trophy, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { CountUp } from "@/components/app/CountUp";
import { DonutChart, LineChart } from "@/components/app/charts";
import { fadeUp, stagger } from "@/lib/motion";

interface Summary {
  companies: number;
  contacts: number;
  openDeals: number;
  openValue: number;
  wonValue: number;
  winRate: number;
  stages: { id: string; name: string; kind: string; count: number; value: number }[];
  timeseries: { label: string; companies: number; contacts: number; deals: number }[];
}

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(n)}`;

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

  const totalDeals = data.stages.reduce((s, st) => s + st.count, 0);

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

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Records breakdown — donut */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Records</h2>
          <DonutChart
            unit="records"
            data={[
              { label: "Companies", value: data.companies, color: "#6366f1" },
              { label: "Contacts", value: data.contacts, color: "#0ea5e9" },
              { label: "Deals", value: totalDeals, color: "#10b981" },
            ]}
          />
        </Card>

        {/* Pipeline by stage — interactive line across stages */}
        <Card className="p-6 lg:col-span-3">
          <h2 className="mb-1 text-sm font-semibold">Pipeline by stage</h2>
          <p className="mb-3 text-xs text-muted-foreground">Deals at each stage — drag along the line to read values</p>
          {data.stages.length > 0 ? (
            <LineChart
              data={data.stages.map((s) => ({ label: s.name, deals: s.count }))}
              series={[{ key: "deals", name: "Deals", color: "#6366f1" }]}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No pipeline data yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
