import { prisma } from "@/server/db";
import type { TenantContext } from "@/server/tenant";
import { LEAD_STATUSES } from "@/lib/enums";
import { listLeads } from "@/server/services/leadService";
import { listTasks } from "@/server/services/taskService";

export async function getDashboardData(ctx: TenantContext) {
  const [leads, openTasks, activityRows] = await Promise.all([
    listLeads(ctx),
    listTasks(ctx, { view: "open" }),
    prisma.activity.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { lead: { select: { id: true, name: true } } },
    }),
  ]);

  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const open = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const closed = won.length + lost.length;

  // Counts per stage (for the bar chart).
  const byStage = LEAD_STATUSES.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }));

  // Conversion funnel (cumulative, decreasing).
  const engagedSet = new Set(["CONTACTED", "QUALIFIED", "INTERESTED", "PROPOSAL_SENT", "NEGOTIATION", "WON"]);
  const qualifiedSet = new Set(["QUALIFIED", "INTERESTED", "PROPOSAL_SENT", "NEGOTIATION", "WON"]);
  const funnel = [
    { label: "All leads", count: leads.length },
    { label: "Engaged", count: leads.filter((l) => engagedSet.has(l.status)).length },
    { label: "Qualified", count: leads.filter((l) => qualifiedSet.has(l.status)).length },
    { label: "Won", count: won.length },
  ];

  return {
    kpis: {
      totalLeads: leads.length,
      openCount: open.length,
      wonCount: won.length,
      pipelineValue: open.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      wonRevenue: won.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      tasksDue: openTasks.filter((t) => t.status === "OVERDUE" || (t.dueDate && isToday(t.dueDate))).length,
    },
    byStage,
    funnel,
    upcomingTasks: openTasks.slice(0, 5),
    activities: activityRows.map((a) => ({
      id: a.id,
      type: a.type,
      leadId: a.lead?.id ?? null,
      leadName: a.lead?.name ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
