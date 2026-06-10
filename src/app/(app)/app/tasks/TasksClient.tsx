"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone, Calendar, Mail, Bell, Plus, Check, Trash2, Loader2, X, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_TYPES, TASK_PRIORITIES } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Member = { id: string; name: string; role: string };
type LeadRef = { id: number; name: string };
type Task = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedUser: { id: string; name: string } | null;
  lead: { id: number; name: string } | null;
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: Phone, MEETING: Calendar, EMAIL: Mail, REMINDER: Bell,
};
const PRIORITY_TONE: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};
const VIEWS = [
  { key: "open", label: "Open" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "No due date";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TasksClient({ members, leads }: { members: Member[]; leads: LeadRef[] }) {
  const qc = useQueryClient();
  const [view, setView] = useState("open");
  const [showNew, setShowNew] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", view],
    queryFn: async () => {
      const res = await fetch(`/api/app/tasks?view=${view}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return (await res.json()).tasks as Task[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/app/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/app/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tasks &amp; Follow-ups</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tasks.length} task{tasks.length === 1 ? "" : "s"}</p>
        </div>
        <Button variant="gradient" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              view === v.key ? "brand-gradient text-white" : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks here"
            description="Create a follow-up to stay on top of your pipeline."
            action={
              <Button variant="gradient" size="sm" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> Add a task
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => {
              const Icon = TYPE_ICON[t.type] ?? Bell;
              const done = t.status === "COMPLETED";
              const overdue = t.status === "OVERDUE";
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20">
                  <button
                    onClick={() => toggle.mutate({ id: t.id, status: done ? "PENDING" : "COMPLETED" })}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-primary"
                    )}
                    title={done ? "Mark as not done" : "Mark complete"}
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>

                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary", done && "opacity-50")}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
                      {t.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {t.lead && (
                        <Link href={`/app/leads/${t.lead.id}`} className="hover:text-primary">{t.lead.name}</Link>
                      )}
                      {t.assignedUser && <span>· {t.assignedUser.name}</span>}
                    </div>
                  </div>

                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", PRIORITY_TONE[t.priority])}>
                    {t.priority}
                  </span>
                  <span className={cn("w-16 text-right text-xs", overdue ? "font-semibold text-rose-600" : "text-muted-foreground")}>
                    {overdue ? "Overdue" : fmtDate(t.dueDate)}
                  </span>
                  <button
                    onClick={() => remove.mutate(t.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-600"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {showNew && <NewTaskDialog members={members} leads={leads} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewTaskDialog({ members, leads, onClose }: { members: Member[]; leads: LeadRef[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", type: "CALL", priority: "MEDIUM", dueDate: "", assignedUserId: "", leadId: "" });
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/app/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          priority: form.priority,
          dueDate: form.dueDate || null,
          assignedUserId: form.assignedUserId || null,
          leadId: form.leadId ? Number(form.leadId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New task</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate(); }} className="mt-4 space-y-3">
          <Input label="Title *" value={form.title} onChange={set("title")} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={set("type")} options={TASK_TYPES.map((t) => [t, t[0] + t.slice(1).toLowerCase()])} />
            <Select label="Priority" value={form.priority} onChange={set("priority")} options={TASK_PRIORITIES.map((p) => [p, p[0] + p.slice(1).toLowerCase()])} />
          </div>
          <Input label="Due date" type="date" value={form.dueDate} onChange={set("dueDate")} />
          <Select label="Assign to" value={form.assignedUserId} onChange={set("assignedUserId")} options={[["", "Me"], ...members.map((m) => [m.id, m.name] as [string, string])]} />
          <Select label="Related lead (optional)" value={form.leadId} onChange={set("leadId")} options={[["", "None"], ...leads.map((l) => [String(l.id), l.name] as [string, string])]} />

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
