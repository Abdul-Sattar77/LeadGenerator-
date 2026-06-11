"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Star, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/enums";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/leads/badges";

type Member = { id: string; name: string; role: string };
type Lead = {
  id: number;
  name: string;
  category: string;
  industry: string;
  phone: string;
  website: string;
  rating: number | null;
  reviews: number | null;
  status: string;
  leadScore: number;
  assignedUser: { id: string; name: string } | null;
};

const PAGE_SIZE = 10;

type LeadPage = { leads: Lead[]; total: number };

async function fetchLeads(status: string, q: string, page: number): Promise<LeadPage> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  const res = await fetch(`/api/app/leads?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load leads");
  const data = await res.json();
  return { leads: data.leads, total: data.total };
}

export default function LeadsClient({ members }: { members: Member[] }) {
  const qc = useQueryClient();
  const [status, setStatusRaw] = useState("");
  const [q, setQRaw] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);

  // Changing a filter resets to page 1.
  const setStatus = (v: string) => { setStatusRaw(v); setPage(1); };
  const setQ = (v: string) => { setQRaw(v); setPage(1); };

  const { data, isLoading } = useQuery({
    queryKey: ["leads", status, q, page],
    queryFn: () => fetchLeads(status, q, page),
  });
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/app/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} lead{total === 1 ? "" : "s"} in your workspace
          </p>
        </div>
        <Button variant="gradient" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 rounded-lg border border-input bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, category, address…"
            className="h-9 w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </span>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={status === ""} onClick={() => setStatus("")}>All</FilterChip>
          {LEAD_STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {LEAD_STATUS_META[s].label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads match your filters"
            description="Add a lead manually or pull a batch from Google Maps."
            action={
              <Button variant="gradient" size="sm" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> Add your first lead
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-accent/30">
                    <td className="px-4 py-3"><ScoreBadge score={lead.leadScore} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={lead.name} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/app/leads/${lead.id}`} className="font-semibold hover:text-primary">
                            {lead.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {[lead.category, lead.industry].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {lead.rating != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {lead.rating}
                          {lead.reviews != null && (
                            <span className="text-xs text-muted-foreground">({lead.reviews})</span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                        className="rounded-md border border-input bg-card px-2 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.assignedUser?.name ?? "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showNew && <NewLeadDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "brand-gradient text-white" : "border border-border bg-card text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

function NewLeadDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", website: "", category: "", industry: "", address: "", rating: "", reviews: "" });
  const [error, setError] = useState("");
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/app/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rating: form.rating ? Number(form.rating) : null,
          reviews: form.reviews ? Number(form.reviews) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New lead</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate(); }}
          className="mt-4 grid grid-cols-2 gap-3"
        >
          <DialogField label="Business name *" value={form.name} onChange={set("name")} className="col-span-2" required />
          <DialogField label="Phone" value={form.phone} onChange={set("phone")} />
          <DialogField label="Website" value={form.website} onChange={set("website")} />
          <DialogField label="Category" value={form.category} onChange={set("category")} />
          <DialogField label="Industry" value={form.industry} onChange={set("industry")} />
          <DialogField label="Address" value={form.address} onChange={set("address")} className="col-span-2" />
          <DialogField label="Rating (0–5)" value={form.rating} onChange={set("rating")} type="number" />
          <DialogField label="Reviews" value={form.reviews} onChange={set("reviews")} type="number" />

          {error && <p className="col-span-2 text-sm font-medium text-destructive">{error}</p>}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create lead
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function DialogField({ label, value, onChange, type = "text", className, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
