"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/PageHeader";
import { api } from "@/lib/api";
import { toast } from "@/stores/toastStore";

interface Stage { id?: string; name: string; probability: number; kind: string; dealCount?: number }
interface Pipeline { id: string; name: string; isDefault: boolean; stages: Stage[] }

export default function PipelinesClient() {
  const qc = useQueryClient();
  const { data: pipelines = [], isLoading } = useQuery({ queryKey: ["pipelines"], queryFn: () => api<Pipeline[]>("/api/app/pipelines") });
  const pipeline = pipelines[0];
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => { if (pipeline) setStages(pipeline.stages.map((s) => ({ ...s }))); }, [pipeline]);

  const save = useMutation({
    mutationFn: () => api(`/api/app/pipelines/${pipeline!.id}/stages`, { method: "PUT", body: JSON.stringify({ stages }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pipelines"] }); qc.invalidateQueries({ queryKey: ["deals"] }); toast.success("Pipeline saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!pipeline) return <div className="py-20 text-center text-muted-foreground">No pipeline found.</div>;

  const set = (i: number, k: keyof Stage, v: any) => setStages((s) => s.map((st, idx) => idx === i ? { ...st, [k]: v } : st));
  const move = (i: number, dir: -1 | 1) => setStages((s) => {
    const j = i + dir; if (j < 0 || j >= s.length) return s;
    const next = [...s]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  const add = () => setStages((s) => [...s, { name: "", probability: 50, kind: "OPEN" }]);
  const remove = (i: number) => setStages((s) => s.filter((_, idx) => idx !== i));

  const valid = stages.length > 0 && stages.every((s) => s.name.trim());

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/deals" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Deals</Link>
      <PageHeader
        title="Pipeline stages"
        subtitle={`Customize the stages of "${pipeline.name}". Drag order with the arrows; set win probability per stage.`}
        icon={KanbanSquare}
        actions={<Button onClick={() => save.mutate()} disabled={save.isPending || !valid}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>}
      />

      <Card className="p-4">
        <div className="mb-2 hidden grid-cols-[auto_1fr_120px_130px_auto] gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
          <span className="w-12">Order</span><span>Stage name</span><span>Win %</span><span>Type</span><span></span>
        </div>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.id ?? `new-${i}`} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-border p-2 sm:grid-cols-[auto_1fr_120px_130px_auto]">
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <Input value={s.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(i, "name", e.target.value)} placeholder="Stage name" className="h-9" />
              <Input type="number" min="0" max="100" value={s.probability} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(i, "probability", Number(e.target.value))} className="h-9" />
              <select value={s.kind} onChange={(e) => set(i, "kind", e.target.value)} className="h-9 rounded-lg border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="OPEN">Open</option><option value="WON">Won</option><option value="LOST">Lost</option>
              </select>
              <button
                onClick={() => remove(i)}
                disabled={!!s.dealCount}
                title={s.dealCount ? `${s.dealCount} deal(s) here — move them before deleting` : "Remove stage"}
                className={cn("justify-self-end rounded p-1.5", s.dealCount ? "cursor-not-allowed text-muted-foreground/40" : "text-muted-foreground hover:bg-secondary hover:text-rose-600")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={add} className="mt-3"><Plus className="h-4 w-4" /> Add stage</Button>
        <p className="mt-3 text-xs text-muted-foreground">"Type" marks terminal stages: Won counts as revenue, Lost closes the deal. Win % powers the weighted forecast. A stage with deals can't be deleted until you move them.</p>
      </Card>
    </div>
  );
}
