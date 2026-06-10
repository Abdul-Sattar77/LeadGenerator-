"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2, Trash2, X, Copy, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

type Member = {
  id: string; name: string; email: string; role: string; isSelf: boolean;
  assignedLeads: number; wonLeads: number; revenue: number; openTasks: number;
};

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", MANAGER: "Manager", SALES_REP: "Sales Rep", VIEWER: "Viewer" };
const ROLE_TONE: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 ring-violet-200",
  MANAGER: "bg-sky-100 text-sky-700 ring-sky-200",
  SALES_REP: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  VIEWER: "bg-slate-100 text-slate-600 ring-slate-200",
};
function fmtMoney(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function TeamClient({ initial, isAdmin }: { initial: Member[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: members = initial } = useQuery({
    queryKey: ["team"],
    queryFn: async () => (await (await fetch("/api/app/team")).json()).members as Member[],
    initialData: initial,
  });

  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/app/team/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/app/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"} in your workspace</p>
        </div>
        {isAdmin && (
          <Button variant="gradient" onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" /> Add member
          </Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Leads</th>
                <th className="px-4 py-3 font-medium text-right">Won</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-right">Open tasks</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-accent/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold">{m.name} {m.isSelf && <span className="text-xs font-normal text-muted-foreground">(you)</span>}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !m.isSelf ? (
                      <select
                        value={m.role}
                        onChange={(e) => setRole.mutate({ id: m.id, role: e.target.value })}
                        className="rounded-md border border-input bg-card px-2 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    ) : (
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", ROLE_TONE[m.role])}>
                        {m.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.assignedLeads}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.wonLeads}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(m.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.openTasks}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {!m.isSelf && (
                        <button onClick={() => remove.mutate(m.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-600" title="Remove member">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddMemberDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddMemberDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", role: "SALES_REP" });
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/app/team", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      return data as { tempPassword: string };
    },
    onSuccess: (data) => { setCreated(data); qc.invalidateQueries({ queryKey: ["team"] }); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{created ? "Member added" : "Add team member"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        {created ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Share this temporary password with <span className="font-semibold text-foreground">{form.name}</span>. They can sign in with their email and change it later.</p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
              <code className="text-sm font-bold">{created.tempPassword}</code>
              <button
                onClick={() => { navigator.clipboard?.writeText(created.tempPassword); setCopied(true); }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-white"
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
            <Button variant="gradient" className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setError(""); add.mutate(); }} className="mt-4 space-y-3">
            <Field label="Full name" value={form.name} onChange={set("name")} required />
            <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Role</span>
              <select value={form.role} onChange={(e) => set("role")(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={add.isPending}>
                {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add member
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </label>
  );
}
