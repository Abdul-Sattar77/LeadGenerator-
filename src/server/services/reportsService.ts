import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { listMembers } from "@/server/services/teamService";
import { resolvePipeline } from "@/server/services/pipelineService";

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export async function getReports(ctx: TenantContext, opts: { sinceDays?: number } = {}) {
  const org = ctx.organizationId;
  const sinceDate = opts.sinceDays ? new Date(Date.now() - opts.sinceDays * 86_400_000) : null;
  const rangeWhere = sinceDate ? { createdAt: { gte: sinceDate } } : {};

  // Goal tracking: this calendar month's won revenue vs the org goal.
  const startMonth = new Date();
  startMonth.setDate(1);
  startMonth.setHours(0, 0, 0, 0);

  const [companies, deals, pipeline, team, orgRow, wonThisMonth] = await Promise.all([
    prisma.company.findMany({ where: { organizationId: org, ...rangeWhere }, select: { source: true, createdAt: true } }),
    prisma.deal.findMany({ where: { organizationId: org, ...rangeWhere }, select: { value: true, status: true, stageId: true } }),
    resolvePipeline(ctx, undefined),
    listMembers(ctx),
    prisma.organization.findUnique({ where: { id: org }, select: { monthlyGoal: true } }),
    prisma.deal.findMany({ where: { organizationId: org, status: "WON", wonAt: { gte: startMonth } }, select: { value: true } }),
  ]);

  const won = deals.filter((d) => d.status === "WON");
  const lost = deals.filter((d) => d.status === "LOST");
  const open = deals.filter((d) => d.status === "OPEN");
  const closed = won.length + lost.length;
  const wonRevenue = won.reduce((s, d) => s + num(d.value), 0);

  const last30 = companies.length; // companies within the selected range

  const goalTarget = orgRow?.monthlyGoal ?? null;
  const goalCurrent = wonThisMonth.reduce((s, d) => s + num(d.value), 0);

  const bySource = Object.entries(
    companies.reduce<Record<string, number>>((acc, c) => {
      acc[c.source] = (acc[c.source] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([source, count]) => ({ source, count }));

  // Deals grouped by pipeline stage (replaces lead-status breakdown).
  const byStatus = (pipeline?.stages ?? []).map((s) => ({
    status: s.name,
    count: deals.filter((d) => d.stageId === s.id).length,
  }));

  return {
    lead: { total: companies.length, last30, byStatus, bySource },
    sales: {
      wonCount: won.length,
      lostCount: lost.length,
      wonRevenue,
      pipelineValue: open.reduce((s, d) => s + num(d.value), 0),
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      avgDeal: won.length ? Math.round(wonRevenue / won.length) : 0,
    },
    goal: {
      target: goalTarget,
      current: goalCurrent,
      pct: goalTarget ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0,
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

export async function companiesCsv(ctx: TenantContext): Promise<string> {
  const companies = await prisma.company.findMany({
    where: { organizationId: ctx.organizationId },
    include: { owner: { select: { name: true } }, _count: { select: { contacts: true, deals: true } } },
    orderBy: { createdAt: "desc" },
  });
  return toCsv(
    ["Name", "Industry", "Phone", "Website", "Address", "City", "Country", "Source", "Contacts", "Deals", "Owner", "Created"],
    companies.map((c) => [
      c.name, c.industry ?? "", c.phone ?? "", c.website ?? "", c.address ?? "", c.city ?? "", c.country ?? "",
      c.source, c._count.contacts, c._count.deals, c.owner?.name ?? "", c.createdAt.toISOString().slice(0, 10),
    ])
  );
}

export async function contactsCsv(ctx: TenantContext): Promise<string> {
  const contacts = await prisma.contact.findMany({
    where: { organizationId: ctx.organizationId },
    include: { owner: { select: { name: true } }, company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return toCsv(
    ["First name", "Last name", "Email", "Phone", "Title", "Company", "Stage", "Score", "Owner", "Created"],
    contacts.map((c) => [
      c.firstName, c.lastName, c.email ?? "", c.phone ?? "", c.title ?? "", c.company?.name ?? "",
      c.lifecycleStage, c.leadScore, c.owner?.name ?? "", c.createdAt.toISOString().slice(0, 10),
    ])
  );
}

export async function teamCsv(ctx: TenantContext): Promise<string> {
  const team = await listMembers(ctx);
  return toCsv(
    ["Name", "Email", "Role", "Companies", "Won Deals", "Revenue", "Open Tasks"],
    team.map((m) => [m.name, m.email, m.role, m.assignedLeads, m.wonLeads, m.revenue, m.openTasks])
  );
}
