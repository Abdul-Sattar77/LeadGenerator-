import type { TenantContext } from "@/server/tenant";
import { LEAD_STATUSES } from "@/lib/enums";
import { listLeads } from "@/server/services/leadService";
import { listMembers } from "@/server/services/teamService";

export async function getReports(ctx: TenantContext) {
  const [leads, team] = await Promise.all([listLeads(ctx), listMembers(ctx)]);

  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const open = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const closed = won.length + lost.length;
  const wonRevenue = won.reduce((s, l) => s + (l.dealValue ?? 0), 0);

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = leads.filter((l) => new Date(l.savedAt).getTime() >= since).length;

  // Group helpers.
  const bySource = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([source, count]) => ({ source, count }));

  const byStatus = LEAD_STATUSES.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }));

  return {
    lead: { total: leads.length, last30, byStatus, bySource },
    sales: {
      wonCount: won.length,
      lostCount: lost.length,
      wonRevenue,
      pipelineValue: open.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      avgDeal: won.length ? Math.round(wonRevenue / won.length) : 0,
    },
    team,
  };
}

// ── CSV builders (used by the export route) ──
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export async function leadsCsv(ctx: TenantContext): Promise<string> {
  const leads = await listLeads(ctx);
  return toCsv(
    ["Name", "Category", "Industry", "Phone", "Email", "Website", "Address", "Rating", "Reviews", "Status", "Score", "Deal Value", "Owner", "Saved At"],
    leads.map((l) => [
      l.name, l.category, l.industry, l.phone, l.email, l.website, l.address,
      l.rating ?? "", l.reviews ?? "", l.status, l.leadScore, l.dealValue ?? "",
      l.assignedUser?.name ?? "", l.savedAt.slice(0, 10),
    ])
  );
}

export async function teamCsv(ctx: TenantContext): Promise<string> {
  const team = await listMembers(ctx);
  return toCsv(
    ["Name", "Email", "Role", "Assigned Leads", "Won Leads", "Revenue", "Open Tasks"],
    team.map((m) => [m.name, m.email, m.role, m.assignedLeads, m.wonLeads, m.revenue, m.openTasks])
  );
}
