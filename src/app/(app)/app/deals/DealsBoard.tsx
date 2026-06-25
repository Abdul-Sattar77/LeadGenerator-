"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  Search, Plus, Loader2, Inbox, Building2, TrendingUp, Trophy, DollarSign, Percent, Layers, AlertTriangle, Clock, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/PageHeader";
import { EASE } from "@/lib/motion";
import { useBoard, useMoveDeal, useCreateDeal, type DealCard as TDeal, type Stage } from "@/hooks/useDeals";
import { toast } from "@/stores/toastStore";

function fmtMoney(n: number): string {
  if (!n) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}

function stageAccent(kind: string): string {
  if (kind === "WON") return "bg-emerald-500";
  if (kind === "LOST") return "bg-rose-500";
  return "bg-indigo-500";
}

export default function DealsBoard() {
  const { data: board, isLoading } = useBoard();
  const move = useMoveDeal();
  const [deals, setDeals] = useState<TDeal[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);

  // Keep local board in sync with the server (and after optimistic moves settle).
  useEffect(() => {
    if (board?.deals) setDeals(board.deals);
  }, [board?.deals]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const stages = board?.pipeline.stages ?? [];

  const filtered = useMemo(
    () => (q ? deals.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())) : deals),
    [deals, q]
  );
  const byStage = useMemo(() => {
    const map: Record<string, TDeal[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of filtered) (map[d.stageId] ??= []).push(d);
    return map;
  }, [filtered, stages]);

  const maxCount = Math.max(1, ...stages.map((s) => (byStage[s.id] ?? []).length));
  const activeDeal = deals.find((d) => d.id === activeId) || null;

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stageId === target) return;

    const prev = deals;
    setDeals((cur) => cur.map((d) => (d.id === id ? { ...d, stageId: target } : d)));
    move.mutate(
      { id, stageId: target },
      {
        onError: () => { setDeals(prev); toast.error("Couldn't move deal"); },
      }
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!board) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        No pipeline configured yet.
      </div>
    );
  }

  const s = board.stats;
  const statCards = [
    { label: "Open deals", value: s.openCount, icon: <Layers className="h-5 w-5" />, tone: "indigo" as const },
    { label: "Pipeline value", value: fmtMoney(s.openValue), icon: <TrendingUp className="h-5 w-5" />, tone: "sky" as const },
    { label: "Weighted forecast", value: fmtMoney(s.weightedPipeline), icon: <Percent className="h-5 w-5" />, tone: "violet" as const },
    { label: "Won revenue", value: fmtMoney(s.wonValue), icon: <DollarSign className="h-5 w-5" />, tone: "emerald" as const },
    { label: "Win rate", value: `${s.winRate}%`, icon: <Trophy className="h-5 w-5" />, tone: "emerald" as const },
    { label: "Rotting", value: s.rottingCount, icon: <AlertTriangle className="h-5 w-5" />, tone: "amber" as const },
  ];

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${board.pipeline.name} — drag deals across stages; values update live.`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} placeholder="Search deals…" className="h-9 w-44 pl-9" />
            </div>
            <Link href="/app/pipelines"><Button variant="outline"><Settings2 className="h-4 w-4" /> Stages</Button></Link>
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New deal</Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((c, i) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} index={i} />
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board-scroll flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <Column key={stage.id} stage={stage} deals={byStage[stage.id] ?? []} maxCount={maxCount} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{activeDeal ? <DealCardView deal={activeDeal} overlay /> : null}</DragOverlay>
      </DndContext>

      <NewDealDialog open={showNew} onOpenChange={setShowNew} pipelineId={board.pipeline.id} stages={stages} />
    </div>
  );
}

function Column({ stage, deals, maxCount }: { stage: Stage; deals: TDeal[]; maxCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const value = deals.reduce((sum, d) => sum + d.value, 0);
  const weighted = Math.round(value * (stage.probability / 100));
  const share = Math.round((deals.length / maxCount) * 100);

  return (
    <div className="flex w-[290px] shrink-0 flex-col">
      <div className="mb-2.5 px-1">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", stageAccent(stage.kind))} />
            {stage.name}
            <span className="rounded-full bg-secondary px-1.5 text-xs font-semibold text-muted-foreground">{deals.length}</span>
          </span>
          {value > 0 && (
            <span className="text-right text-xs font-semibold text-muted-foreground">
              {fmtMoney(value)}
              {stage.kind === "OPEN" && weighted > 0 && <span className="ml-1 font-normal text-muted-foreground/70">· ~{fmtMoney(weighted)}</span>}
            </span>
          )}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/5">
          <motion.div
            className={cn("h-full rounded-full", stageAccent(stage.kind))}
            initial={{ width: 0 }}
            animate={{ width: `${share}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[180px] flex-1 flex-col gap-2.5 rounded-2xl border p-2.5 transition-all duration-200",
          isOver ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20" : "border-border bg-secondary/30"
        )}
      >
        {deals.map((deal, i) => (
          <DraggableCard key={deal.id} deal={deal} index={i} />
        ))}
        {deals.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-8 text-center">
            <Inbox className="h-5 w-5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground/70">Drop deals here</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ deal, index }: { deal: TDeal; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.35 : 1, zIndex: isDragging ? 50 : undefined }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: Math.min(index * 0.03, 0.2) }}>
        <DealCardView deal={deal} />
      </motion.div>
    </div>
  );
}

function DealCardView({ deal, overlay }: { deal: TDeal; overlay?: boolean }) {
  return (
    <Link
      href={overlay ? "#" : `/app/deals/${deal.id}`}
      onClick={(e) => overlay && e.preventDefault()}
      className={cn(
        "block cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
        overlay ? "rotate-2 border-primary/30 shadow-xl ring-2 ring-primary/20" : "border-border hover:shadow-md",
        deal.rotting && !overlay && "border-l-2 border-l-amber-400"
      )}
      title={deal.rotting ? `No activity for ${deal.idleDays} days` : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="truncate text-sm font-semibold leading-tight text-foreground">{deal.name}</div>
        {deal.rotting && (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            <Clock className="h-3 w-3" />{deal.idleDays}d
          </span>
        )}
      </div>
      {deal.company && (
        <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" /> {deal.company.name}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between">
        {deal.value ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <DollarSign className="h-3 w-3" />{fmtMoney(deal.value)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">No value</span>
        )}
        {deal.owner && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold uppercase text-muted-foreground">
            {deal.owner.name.slice(0, 2)}
          </span>
        )}
      </div>
    </Link>
  );
}

function NewDealDialog({ open, onOpenChange, pipelineId, stages }: { open: boolean; onOpenChange: (v: boolean) => void; pipelineId: string; stages: Stage[] }) {
  const create = useCreateDeal();
  const [form, setForm] = useState({ name: "", value: "", stageId: "" });

  useEffect(() => { if (open && stages[0]) setForm((f) => ({ ...f, stageId: f.stageId || stages[0].id })); }, [open, stages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        name: form.name,
        pipelineId,
        stageId: form.stageId || undefined,
        value: form.value ? Number(form.value) : undefined,
      });
      toast.success("Deal created");
      setForm({ name: "", value: "", stageId: stages[0]?.id ?? "" });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create deal");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="d-name">Deal name *</Label>
            <Input id="d-name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus placeholder="Acme — annual contract" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="d-value">Value (USD)</Label>
              <Input id="d-value" type="number" min="0" value={form.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="5000" />
            </div>
            <div>
              <Label htmlFor="d-stage">Stage</Label>
              <select
                id="d-stage"
                value={form.stageId}
                onChange={(e) => setForm((f) => ({ ...f, stageId: e.target.value }))}
                className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {stages.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={create.isPending || !form.name.trim()}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
