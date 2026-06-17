"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Trash2, Plus, Loader2, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import { api } from "@/lib/api";
import { toast } from "@/stores/toastStore";

interface RecordTask {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedUser: { id: string; name: string } | null;
}

const PRIORITY_TONE: Record<string, "default" | "warning" | "muted"> = {
  URGENT: "warning",
  HIGH: "warning",
  MEDIUM: "default",
  LOW: "muted",
};

/**
 * Tasks attached to a v2 record. `apiBase` is the record endpoint
 * (e.g. /api/app/contacts/<id>); tasks live at `${apiBase}/tasks`.
 * `recordQueryKey` is invalidated so the record's activity timeline refreshes.
 */
export function RecordTasks({ apiBase, recordQueryKey }: { apiBase: string; recordQueryKey: readonly unknown[] }) {
  const qc = useQueryClient();
  const listKey = ["record-tasks", apiBase] as const;
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => api<RecordTask[]>(`${apiBase}/tasks`),
  });

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: listKey });
    qc.invalidateQueries({ queryKey: recordQueryKey });
  };

  const create = useMutation({
    mutationFn: () =>
      api(`${apiBase}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), priority, dueDate: dueDate || null }),
      }),
    onSuccess: () => { setTitle(""); setDueDate(""); setPriority("MEDIUM"); invalidate(); toast.success("Task added"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add task"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      fetch(`/api/app/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: done ? "COMPLETED" : "PENDING" }),
      }).then((r) => { if (!r.ok) throw new Error("Failed"); }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/app/tasks/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error("Failed"); }),
    onSuccess: invalidate,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim()) create.mutate();
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Add a task — e.g. Follow up call" className="h-10 min-w-[200px] flex-1" />
        <Input type="date" value={dueDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)} className="h-10 w-40" />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-10 rounded-lg border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <Button type="submit" size="sm" disabled={create.isPending || !title.trim()}>
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </Button>
      </form>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet. Add one above to plan your next step.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => {
              const done = t.status === "COMPLETED";
              const overdue = t.status === "OVERDUE";
              return (
                <li key={t.id} className="group flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => toggle.mutate({ id: t.id, done: !done })}
                    className={cn("shrink-0 transition-colors", done ? "text-emerald-500" : "text-muted-foreground hover:text-primary")}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <span className={cn("min-w-0 flex-1 text-sm", done && "text-muted-foreground line-through")}>{t.title}</span>
                  {t.dueDate && (
                    <span className={cn("flex items-center gap-1 text-xs", overdue ? "font-semibold text-rose-600" : "text-muted-foreground")}>
                      <CalendarClock className="h-3 w-3" />
                      {overdue ? "Overdue · " : ""}
                      <LocalTime iso={t.dueDate} dateOnly />
                    </span>
                  )}
                  <Badge variant={PRIORITY_TONE[t.priority] ?? "default"}>{t.priority}</Badge>
                  <button
                    onClick={() => remove.mutate(t.id)}
                    className="shrink-0 text-muted-foreground opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
