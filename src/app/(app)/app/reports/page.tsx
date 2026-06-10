import { Download, Users as UsersIcon } from "lucide-react";
import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getReports } from "@/server/services/reportsService";
import Forbidden from "@/app/(app)/_components/Forbidden";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { KpiRow, LeadsByStage } from "../DashboardCharts";

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
    { label: "Total leads", value: lead.total, icon: "users" as const, tone: "indigo" as const },
    { label: "New (30d)", value: lead.last30, icon: "check" as const, tone: "sky" as const },
    { label: "Won revenue", value: fmtMoney(sales.wonRevenue), icon: "dollar" as const, tone: "emerald" as const },
    { label: "Win rate", value: `${sales.winRate}%`, icon: "percent" as const, tone: "violet" as const },
    { label: "Avg deal", value: fmtMoney(sales.avgDeal), icon: "trending" as const, tone: "amber" as const },
  ];

  const maxSource = Math.max(1, ...lead.bySource.map((s) => s.count));

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-muted-foreground">Lead, sales &amp; team performance — export anytime.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/app/reports?type=leads" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <Download className="h-4 w-4" /> Leads CSV
          </a>
          <a href="/api/app/reports?type=team" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-semibold shadow-soft backdrop-blur transition hover:bg-white">
            <Download className="h-4 w-4" /> Team CSV
          </a>
        </div>
      </div>

      <KpiRow items={kpis} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Leads by stage */}
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Leads by stage</h2>
          <LeadsByStage byStage={lead.byStatus} />
        </Card>

        {/* Lead sources */}
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Lead sources</h2>
          <div className="space-y-2.5">
            {lead.bySource.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{SOURCE_LABEL[s.source] ?? s.source}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-secondary/50">
                  <div className="h-full rounded-md bg-gradient-to-r from-indigo-400 to-violet-400" style={{ width: `${(s.count / maxSource) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-xs font-bold">{s.count}</span>
              </div>
            ))}
            {lead.bySource.length === 0 && <p className="text-sm text-muted-foreground">No leads yet.</p>}
          </div>
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
