import Link from "next/link";
import { Search, Users, KanbanSquare, DollarSign, CheckSquare, ArrowRight } from "lucide-react";
import { requireAuth } from "@/server/tenant";
import { prisma } from "@/server/db";
import { countTasksDueToday } from "@/server/services/taskService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const ctx = await requireAuth();

  // Org-scoped data — proves multi-tenancy: this pipeline was created for THIS org at signup.
  const [pipeline, leadCount, wonCount, dueToday] = await Promise.all([
    prisma.pipeline.findFirst({
      where: { organizationId: ctx.organizationId, isDefault: true },
      include: { stages: { orderBy: { order: "asc" } } },
    }),
    prisma.lead.count({ where: { organizationId: ctx.organizationId } }),
    prisma.lead.count({ where: { organizationId: ctx.organizationId, status: "WON" } }),
    countTasksDueToday(ctx),
  ]);

  const firstName = ctx.name.split(" ")[0] || "there";

  const kpis = [
    { label: "Total Leads", value: String(leadCount), icon: Users, note: "Live" },
    { label: "Won Leads", value: String(wonCount), icon: KanbanSquare, note: "Live" },
    { label: "Active Deals", value: "—", icon: DollarSign, note: "Phase 5" },
    { label: "Tasks Due Today", value: String(dueToday), icon: CheckSquare, note: "Live" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Here’s your workspace. Start by discovering leads, then manage them through your pipeline.
        </p>
      </div>

      {/* KPI cards (wired up in later phases) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {k.note}
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold tracking-tight">{k.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick start */}
        <Card className="lg:col-span-1 flex flex-col p-6">
          <h2 className="font-semibold">Quick start</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is ready. Pull your first batch of leads from Google Maps.
          </p>
          <Link href="/search" className="mt-auto pt-6">
            <Button variant="gradient" className="w-full">
              <Search className="h-4 w-4" />
              Discover leads
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        {/* Org's own pipeline — tenancy proof */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{pipeline?.name ?? "Sales Pipeline"}</h2>
            <span className="text-xs text-muted-foreground">
              {pipeline?.stages.length ?? 0} stages · created for your org
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {pipeline?.stages.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Drag-and-drop Kanban over these stages ships in Phase 3.
          </p>
        </Card>
      </div>
    </div>
  );
}
