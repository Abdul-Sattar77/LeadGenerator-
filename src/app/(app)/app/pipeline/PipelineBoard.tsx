"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  Star, Search, Users, TrendingUp, DollarSign, Trophy, Percent, Layers, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/enums";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar } from "@/components/ui/avatar";

type Lead = {
  id: number;
  name: string;
  category: string;
  status: string;
  leadScore: number;
  rating: number | null;
  dealValue: number | null;
  assignedUser: { id: string; name: string } | null;
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
  const [q, setQ] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(
    () => (q ? leads.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())) : leads),
    [leads, q]
  );

  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of LEAD_STATUSES) map[s] = [];
    for (const l of filtered) (map[l.status] ??= []).push(l);
    return map;
  }, [filtered]);

  const maxCount = Math.max(1, ...LEAD_STATUSES.map((s) => (byStatus[s] ?? []).length));

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

  function onDragStart(e: DragStartEvent) { setActiveId(Number(e.active.id)); }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = Number(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === target) return;

    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status: target } : l)));
    try {
      const res = await fetch(`/api/app/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setLeads(prev);
    }
  }

  const statCards = [
    { label: "Open leads", value: stats.openCount, icon: <Layers className="h-5 w-5" />, tone: "indigo" as const },
    { label: "Pipeline value", value: fmtMoney(stats.openValue), icon: <TrendingUp className="h-5 w-5" />, tone: "sky" as const },
    { label: "Won", value: stats.wonCount, icon: <Trophy className="h-5 w-5" />, tone: "emerald" as const },
    { label: "Won revenue", value: fmtMoney(stats.wonValue), icon: <DollarSign className="h-5 w-5" />, tone: "emerald" as const },
    { label: "Win rate", value: `${stats.winRate}%`, icon: <Percent className="h-5 w-5" />, tone: "violet" as const },
    { label: "Avg deal", value: fmtMoney(stats.avgWonValue), icon: <Users className="h-5 w-5" />, tone: "amber" as const },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag leads across stages — values &amp; metrics update live.</p>
        </div>
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-white/70 bg-white/80 px-3.5 shadow-soft backdrop-blur focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {/* Stats header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} index={i} />
        ))}
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board-scroll flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((status) => (
            <Column key={status} status={status} leads={byStatus[status] ?? []} maxCount={maxCount} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{activeLead ? <LeadCard lead={activeLead} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, leads, maxCount }: { status: string; leads: Lead[]; maxCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = LEAD_STATUS_META[status as keyof typeof LEAD_STATUS_META];
  const value = leads.reduce((s, l) => s + (l.dealValue ?? 0), 0);
  const share = Math.round((leads.length / maxCount) * 100);

  return (
    <div className="flex w-[290px] shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2.5 px-1">
        <div className="flex items-center justify-between">
          <span className={cn("inline-flex items-center gap-2 text-sm font-bold", meta.head)}>
            <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
            {meta.label}
            <span className="rounded-full bg-white/70 px-1.5 text-xs font-bold text-muted-foreground ring-1 ring-black/5">
              {leads.length}
            </span>
          </span>
          {value > 0 && <span className="text-xs font-semibold text-muted-foreground">{fmtMoney(value)}</span>}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/5">
          <motion.div
            className={cn("h-full rounded-full", meta.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${share}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[160px] flex-1 flex-col gap-2.5 rounded-2xl border p-2.5 transition-all duration-200",
          meta.col,
          isOver ? "border-primary/40 ring-2 ring-primary/20" : "border-black/[0.06]"
        )}
      >
        {leads.map((lead, i) => (
          <DraggableCard key={lead.id} lead={lead} index={i} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/10 py-8 text-center">
            <Inbox className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/70">Drop leads here</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead, index }: { lead: Lead; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(lead.id) });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.35 : 1, zIndex: isDragging ? 50 : undefined }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
      >
        <LeadCard lead={lead} />
      </motion.div>
    </div>
  );
}

function LeadCard({ lead, overlay }: { lead: Lead; overlay?: boolean }) {
  return (
    <div
      className={cn(
        "group cursor-grab rounded-xl border border-black/[0.06] bg-white p-3 shadow-soft active:cursor-grabbing",
        overlay ? "rotate-3 shadow-card ring-2 ring-primary/30" : "card-lift"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={lead.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{lead.name}</div>
          <div className="truncate text-xs text-muted-foreground">{lead.category || "Lead"}</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        {lead.dealValue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            <DollarSign className="h-3 w-3" />
            {fmtMoney(lead.dealValue)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">No value</span>
        )}
        {lead.rating != null && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {lead.rating}
          </span>
        )}
      </div>

      {/* Score progress indicator */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <span>Lead score</span>
          <span>{lead.leadScore}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className={cn(
              "h-full rounded-full",
              lead.leadScore >= 70 ? "bg-emerald-400" : lead.leadScore >= 40 ? "bg-amber-400" : "bg-rose-400"
            )}
            style={{ width: `${lead.leadScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
