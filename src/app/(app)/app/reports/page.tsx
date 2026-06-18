import { Download, Users as UsersIcon } from "lucide-react";
import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getReports } from "@/server/services/reportsService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { KpiRow } from "../DashboardCharts";
import { StageBars, DonutChart } from "@/components/app/charts";

const SOURCE_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#a855f7"];

export const dynamic = "force-dynamic";

function fmtMoney(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

const SOURCE_LABEL: Record<string, string> = {
  GOOGLE_MAPS: "Google Maps", MANUAL: "Manual", IMPORT: "Import", REFERRAL: "Referral", WEBSITE: "Website",
};

export default async function ReportsPage() {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "MANAGER")) return <Forbidden need="Manager" />;

  const { lead, sales, team } = await getReports(ctx);

  const kpis = [
    { label: "Companies", value: lead.total, icon: "users" as const, tone: "indigo" as const },
    { label: "New (30d)", value: lead.last30, icon: "check" as const, tone: "sky" as const },
    { label: "Won revenue", value: fmtMoney(sales.wonRevenue), icon: "dollar" as const, tone: "emerald" as const },
    { label: "Win rate", value: `${sales.winRate}%`, icon: "percent" as const, tone: "violet" as const },
    { label: "Avg deal", value: fmtMoney(sales.avgDeal), icon: "trending" as const, tone: "amber" as const },
  ];


  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-muted-foreground">Lead, sales &amp; team performance — export anytime.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/app/reports?type=companies" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <Download className="h-4 w-4" /> Companies CSV
          </a>
          <a href="/api/app/reports?type=team" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <Download className="h-4 w-4" /> Team CSV
          </a>
        </div>
      </div>

      <KpiRow items={kpis} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Deals by stage */}
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Deals by stage</h2>
          {lead.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals yet.</p>
          ) : (
            <StageBars
              showValue={false}
              data={lead.byStatus.map((s) => ({
                id: s.status,
                name: s.status,
                count: s.count,
                kind: /won/i.test(s.status) ? "WON" : /lost/i.test(s.status) ? "LOST" : "OPEN",
              }))}
            />
          )}
        </Card>

        {/* Sources */}
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Company sources</h2>
          {lead.bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No companies yet.</p>
          ) : (
            <DonutChart
              unit="companies"
              data={lead.bySource.map((s, i) => ({
                label: SOURCE_LABEL[s.source] ?? s.source,
                value: s.count,
                color: SOURCE_COLORS[i % SOURCE_COLORS.length],
              }))}
            />
          )}
        </Card>
      </div>

      {/* Team performance */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Team performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-4 py-3 text-right font-medium">Assigned</th>
                <th className="px-4 py-3 text-right font-medium">Won</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-6 py-3 text-right font-medium">Open tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-accent/20">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.name} size="sm" />
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.assignedLeads}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.wonLeads}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(m.revenue)}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{m.openTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
