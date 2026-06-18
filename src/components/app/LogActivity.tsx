"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, CalendarClock, Mail, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "@/stores/toastStore";

const TYPES = [
  { key: "CALL", label: "Call", icon: Phone },
  { key: "MEETING", label: "Meeting", icon: CalendarClock },
  { key: "EMAIL", label: "Email", icon: Mail },
] as const;

const OUTCOMES: Record<string, string[]> = {
  CALL: ["Connected", "Left voicemail", "No answer", "Wrong number"],
  MEETING: ["Held", "Rescheduled", "No-show"],
  EMAIL: ["Sent", "Replied", "Bounced"],
};

/** Log a typed call/meeting/email with outcome + optional follow-up task. */
export function LogActivity({ apiBase, recordQueryKey }: { apiBase: string; recordQueryKey: readonly unknown[] }) {
  const qc = useQueryClient();
  const [type, setType] = useState<string>("CALL");
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [days, setDays] = useState("3");

  const log = useMutation({
    mutationFn: () =>
      api(`${apiBase}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type,
          outcome: outcome || undefined,
          note: note.trim() || undefined,
          followUpInDays: followUp ? Number(days) : undefined,
          followUpTitle: followUp ? `Follow up: ${type.toLowerCase()}` : undefined,
        }),
      }),
    onSuccess: () => {
      setOutcome(""); setNote(""); setFollowUp(false);
      qc.invalidateQueries({ queryKey: recordQueryKey });
      qc.invalidateQueries({ queryKey: ["record-tasks", apiBase] });
      toast.success("Activity logged");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to log activity"),
  });

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = type === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setType(t.key); setOutcome(""); }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                active ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="ml-auto h-8 rounded-lg border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Outcome…</option>
          {(OUTCOMES[type] ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? (optional)" rows={2} className="mt-2" />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="h-3.5 w-3.5 rounded border-border" />
          Schedule follow-up in
          <input
            type="number" min="0" max="365" value={days} onChange={(e) => setDays(e.target.value)} disabled={!followUp}
            className="h-7 w-14 rounded-md border border-input bg-card px-2 text-xs disabled:opacity-50"
          />
          days
        </label>
        <Button size="sm" onClick={() => log.mutate()} disabled={log.isPending}>
          {log.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log activity
        </Button>
      </div>
    </div>
  );
}
