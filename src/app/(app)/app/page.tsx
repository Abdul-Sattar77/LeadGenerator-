import Link from "next/link";
import { Search, Plus, CheckSquare, Clock, Activity as ActivityIcon, Building2 } from "lucide-react";
import { requireAuth } from "@/server/tenant";
import { prisma } from "@/server/db";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalTime } from "@/components/ui/local-time";
import { CrmSummary } from "@/components/app/CrmSummary";

export const dynamic = "force-dynamic";

const ACTIVITY_LABEL: Record<string, string> = {
  COMPANY_CREATED: "Company added",
  DEAL_CREATED: "Deal created",
  STAGE_CHANGED: "Deal stage changed",
  NOTE_ADDED: "Note added",
  EMAIL_SENT: "Email sent",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
};

export default async function OverviewPage() {
  const ctx = await requireAuth();
  const firstName = ctx.name.split(" ")[0] || "there";

  const [activities, tasks] = await Promise.all([
    prisma.activity.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, createdAt: true, companyId: true, contactId: true, dealId: true },
    }),
    prisma.task.findMany({
      where: { organizationId: ctx.organizationId, status: { not: "COMPLETED" } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: { id: true, title: true, dueDate: true, priority: true },
    }),
  ]);

  const linkFor = (a: { dealId: string | null; contactId: string | null; companyId: string | null }) =>
    a.dealId ? `/app/deals/${a.dealId}` : a.contactId ? `/app/contacts/${a.contactId}` : a.companyId ? `/app/companies/${a.companyId}` : null;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">Here’s how your CRM is performing today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <Search className="h-4 w-4" /> Discover
          </Link>
          <Link href="/app/companies?new=1" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-secondary">
            <Plus className="h-4 w-4" /> New company
          </Link>
          <Link href="/app/deals?new=1" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-secondary">
            <Plus className="h-4 w-4" /> New deal
          </Link>
        </div>
      </div>

      {/* Relational CRM snapshot */}
      <CrmSummary />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent activity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          {activities.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity yet" description="Actions on your records will show up here." />
          ) : (
            <ol className="max-h-80 space-y-3.5 overflow-y-auto pr-1">
              {activities.map((a) => {
                const href = linkFor(a);
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                      {href && <> · <Link href={href} className="text-primary hover:underline">view</Link></>}
                      <div className="text-xs text-muted-foreground"><LocalTime iso={a.createdAt.toISOString()} /></div>
                    </div>
                  </li>
                );
              })}
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
          {tasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="You’re all caught up" description="No open tasks right now." />
          ) : (
            <ul className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.dueDate ? <LocalTime iso={t.dueDate.toISOString()} dateOnly /> : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
