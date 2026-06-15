import Link from "next/link";
import {
  Search, CheckSquare, Trophy, Plus, Clock,
  Activity as ActivityIcon, Phone, Calendar, Mail, Bell,
} from "lucide-react";
import { requireAuth } from "@/server/tenant";
import { getDashboardData } from "@/server/services/dashboardService";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ACTIVITY_LABEL } from "@/lib/leadStatus";
import { ConversionFunnel, LeadsByStage, KpiRow } from "./DashboardCharts";

export const dynamic = "force-dynamic";

function fmtMoney(n: number): string {
  if (!n) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TASK_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: Phone, MEETING: Calendar, EMAIL: Mail, REMINDER: Bell,
};

export default async function OverviewPage() {
  const ctx = await requireAuth();
  const { kpis, funnel, byStage, upcomingTasks, activities } = await getDashboardData(ctx);
  const firstName = ctx.name.split(" ")[0] || "there";

  const kpiCards = [
    { label: "Total leads", value: kpis.totalLeads, icon: "users" as const, tone: "indigo" as const },
    { label: "Pipeline value", value: fmtMoney(kpis.pipelineValue), icon: "trending" as const, tone: "sky" as const },
    { label: "Won revenue", value: fmtMoney(kpis.wonRevenue), icon: "dollar" as const, tone: "emerald" as const },
    { label: "Win rate", value: `${kpis.winRate}%`, icon: "percent" as const, tone: "violet" as const },
    { label: "Tasks due", value: kpis.tasksDue, icon: "check" as const, tone: "amber" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header + quick actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">Here’s how your workspace is performing today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 hover:shadow-glow">
            <Search className="h-4 w-4" /> Discover leads
          </Link>
          <Link href="/app/leads" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <Plus className="h-4 w-4" /> Add lead
          </Link>
          <Link href="/app/tasks" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <CheckSquare className="h-4 w-4" /> New task
          </Link>
        </div>
      </div>

      {kpis.totalLeads === 0 ? (
        <Card className="relative overflow-hidden p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="relative max-w-xl">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
              <Search className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">Let’s find your first leads</h2>
            <p className="mt-2 text-muted-foreground">
              Your workspace is ready. Search Google Maps for any business type and city, then
              save the results into your CRM — they’ll show up here with scores, pipeline and tasks.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/app/discover" className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 hover:shadow-glow">
                <Search className="h-4 w-4" /> Discover leads
              </Link>
              <Link href="/app/leads" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold transition hover:bg-secondary">
                <Plus className="h-4 w-4" /> Add a lead manually
              </Link>
            </div>
            <ol className="mt-6 space-y-1.5 text-sm text-muted-foreground">
              <li>1 · Discover &amp; save leads from Google Maps</li>
              <li>2 · Drag them through your sales pipeline</li>
              <li>3 · Track follow-ups with tasks &amp; reminders</li>
            </ol>
          </div>
        </Card>
      ) : (
        <>
      {/* KPI cards */}
      <KpiRow items={kpiCards} />

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Trophy className="h-4 w-4" />
            </span>
            <h2 className="font-semibold">Conversion funnel</h2>
          </div>
          <ConversionFunnel funnel={funnel} />
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 text-white">
              <ActivityIcon className="h-4 w-4" />
            </span>
            <h2 className="font-semibold">Leads by stage</h2>
          </div>
          <LeadsByStage byStage={byStage} />
        </Card>
      </div>

      {/* Activity + tasks row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent activity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          {activities.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity yet" description="Actions on your leads will show up here." />
          ) : (
            <ol className="space-y-3.5">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                    {a.leadName && a.leadId && (
                      <>
                        {" · "}
                        <Link href={`/app/leads/${a.leadId}`} className="text-primary hover:underline">{a.leadName}</Link>
                      </>
                    )}
                    <div className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Upcoming tasks */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Upcoming tasks</h2>
            </div>
            <Link href="/app/tasks" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="You’re all caught up" description="No open tasks right now." />
          ) : (
            <ul className="space-y-2.5">
              {upcomingTasks.map((t) => {
                const Icon = TASK_ICON[t.type] ?? Bell;
                const overdue = t.status === "OVERDUE";
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl border border-black/[0.05] bg-white/60 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      {t.lead && <div className="truncate text-xs text-muted-foreground">{t.lead.name}</div>}
                    </div>
                    <span className={overdue ? "text-xs font-semibold text-rose-600" : "text-xs text-muted-foreground"}>
                      {overdue ? "Overdue" : t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
