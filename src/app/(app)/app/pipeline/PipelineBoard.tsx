"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Star, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/enums";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/leads/badges";

type Lead = {
  id: number;
  name: string;
  category: string;
  status: string;
  leadScore: number;
  rating: number | null;
  dealValue: number | null;
};
type Stats = {
  total: number; openCount: number; wonCount: number;
  openValue: number; wonValue: number; winRate: number;
  conversionRate: number; avgWonValue: number;
};

function fmtMoney(n: number): string {
  if (!n) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}

export default function PipelineBoard({ initialLeads, initialStats }: { initialLeads: Lead[]; initialStats: Stats }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of LEAD_STATUSES) map[s] = [];
    for (const l of leads) (map[l.status] ??= []).push(l);
    return map;
  }, [leads]);

  // Live stats recomputed from local state so the strip updates as you drag.
  const stats = useMemo<Stats>(() => {
    const won = leads.filter((l) => l.status === "WON");
    const lost = leads.filter((l) => l.status === "LOST");
    const open = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
    const wonValue = won.reduce((s, l) => s + (l.dealValue ?? 0), 0);
    const closed = won.length + lost.length;
    return {
      total: leads.length,
      openCount: open.length,
      wonCount: won.length,
      openValue: open.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      wonValue,
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      conversionRate: leads.length ? Math.round((won.length / leads.length) * 100) : 0,
      avgWonValue: won.length ? Math.round(wonValue / won.length) : 0,
    };
  }, [leads]);

  const activeLead = leads.find((l) => l.id === activeId) || null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = Number(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;

    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === target) return;

    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status: target } : l))); // optimistic

    try {
      const res = await fetch(`/api/app/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setLeads(prev); // revert on failure
    }
  }

  const statCards = [
    { label: "Open leads", value: String(stats.openCount) },
    { label: "Pipeline value", value: fmtMoney(stats.openValue) },
    { label: "Won", value: String(stats.wonCount) },
    { label: "Won revenue", value: fmtMoney(stats.wonValue) },
    { label: "Win rate", value: `${stats.winRate}%` },
    { label: "Avg deal", value: fmtMoney(stats.avgWonValue) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag a lead between stages to update it.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xl font-extrabold tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((status) => (
            <Column key={status} status={status} leads={byStatus[status] ?? []} />
          ))}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, leads }: { status: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = LEAD_STATUS_META[status as keyof typeof LEAD_STATUS_META];
  const value = leads.reduce((s, l) => s + (l.dealValue ?? 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
          {meta.label}
          <span className="text-muted-foreground">{leads.length}</span>
        </span>
        {value > 0 && <span className="text-xs text-muted-foreground">{fmtMoney(value)}</span>}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary bg-accent/40" : "border-border bg-secondary/30"
        )}
      >
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(lead.id) });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, overlay }: { lead: Lead; overlay?: boolean }) {
  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 shadow-soft active:cursor-grabbing",
        overlay && "rotate-2 shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">{lead.name}</span>
        <ScoreBadge score={lead.leadScore} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <GripVertical className="h-3 w-3" />
          {lead.category || "Lead"}
        </span>
        {lead.dealValue ? <span className="font-semibold text-foreground">{fmtMoney(lead.dealValue)}</span> : null}
      </div>
    </div>
  );
}
