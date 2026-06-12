"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Star, Loader2, Users, X, Upload, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/enums";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/leads/badges";
import { toast } from "@/stores/toastStore";

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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const clearSel = () => setSelected(new Set());

  const setStatus = (v: string) => { setStatusRaw(v); setPage(1); clearSel(); };
  const setQ = (v: string) => { setQRaw(v); setPage(1); clearSel(); };
  const goPage = (p: number) => { setPage(p); clearSel(); };

  const { data, isLoading } = useQuery({
    queryKey: ["leads", status, q, page],
    queryFn: () => fetchLeads(status, q, page),
  });
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Campaigns for the bulk "add to campaign" action (empty/403 for non-managers).
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns-mini"],
    queryFn: async () => {
      const res = await fetch("/api/app/campaigns");
      if (!res.ok) return [];
      return (await res.json()).campaigns as { id: string; name: string }[];
    },
  });

  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = leads.length > 0 && leads.every((l) => selected.has(l.id));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allOnPage) leads.forEach((l) => n.delete(l.id));
    else leads.forEach((l) => n.add(l.id));
    return n;
  });

  const bulk = useMutation({
    mutationFn: async (action: Record<string, unknown>) => {
      const res = await fetch("/api/app/leads/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Bulk action failed.");
      return d.count as number;
    },
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: ["leads"] }); clearSel(); toast.success(`Updated ${count} lead${count === 1 ? "" : "s"}.`); },
    onError: (e: Error) => toast.error(e.message),
  });

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
    onError: () => toast.error("Couldn’t update the lead status."),
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button variant="gradient" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> New lead
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-white/90 px-3 py-2 shadow-card backdrop-blur">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <span className="mx-1 h-5 w-px bg-border" />
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { bulk.mutate({ type: "status", value: e.target.value }); e.target.value = ""; } }}
            className="h-9 rounded-lg border border-input bg-card px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Set status…</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>)}
          </select>
          <select
            defaultValue=""
            onChange={(e) => { bulk.mutate({ type: "assign", value: e.target.value || null }); e.target.value = ""; }}
            className="h-9 rounded-lg border border-input bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Assign to…</option>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {campaigns.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) { bulk.mutate({ type: "campaign", value: e.target.value }); e.target.value = ""; } }}
              className="h-9 rounded-lg border border-input bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Add to campaign…</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button
            onClick={() => { if (confirm(`Delete ${selected.size} lead(s)? This can’t be undone.`)) bulk.mutate({ type: "delete" }); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          {bulk.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button onClick={clearSel} className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

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
                  <th className="px-4 py-3">
                    <button onClick={toggleAll} className={cn("flex h-4 w-4 items-center justify-center rounded border", allOnPage ? "border-primary bg-primary text-white" : "border-input")} title="Select all on page">
                      {allOnPage && <Check className="h-3 w-3" strokeWidth={3} />}
                    </button>
                  </th>
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
                  <tr key={lead.id} className={cn("transition-colors hover:bg-accent/30", selected.has(lead.id) && "bg-accent/40")}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(lead.id)} className={cn("flex h-4 w-4 items-center justify-center rounded border", selected.has(lead.id) ? "border-primary bg-primary text-white" : "border-input")}>
                        {selected.has(lead.id) && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                    </td>
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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(Math.max(1, page - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(Math.min(totalPages, page + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showNew && <NewLeadDialog onClose={() => setShowNew(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); qc.invalidateQueries({ queryKey: ["leads"] }); }} />}
    </div>
  );
}

// Minimal CSV parser (handles quoted fields with commas).
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const FIELD_ALIASES: Record<string, string> = {
  name: "name", business: "name", "business name": "name", company: "name",
  email: "email", phone: "phone", "phone number": "phone", website: "website", url: "website",
  address: "address", location: "address", category: "category", industry: "industry",
  contact: "contactPerson", "contact person": "contactPerson", rating: "rating", reviews: "reviews",
};

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = parseCsv(String(reader.result || ""));
      // map header aliases -> our fields
      const mapped = raw.map((r) => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(r)) {
          const key = FIELD_ALIASES[k];
          if (key) out[key] = v;
        }
        return out;
      }).filter((r) => r.name);
      setRows(mapped);
    };
    reader.readAsText(file);
  }

  async function doImport() {
    if (rows.length === 0) return;
    setImporting(true);
    const res = await fetch("/api/app/leads/import", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }),
    });
    const data = await res.json().catch(() => ({}));
    setImporting(false);
    if (!res.ok) { toast.error(data.error || "Import failed."); return; }
    toast.success(`Imported ${data.created} lead${data.created === 1 ? "" : "s"}${data.skipped ? ` · ${data.skipped} skipped` : ""}${data.limitReached ? " (plan limit reached)" : ""}.`);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Import leads from CSV</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          First row = column headers. We recognise: <span className="font-medium text-foreground">name</span> (required), email, phone, website, address, category, industry, contact, rating, reviews.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-center hover:bg-secondary/40">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName || "Choose a .csv file"}</span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>

        {rows.length > 0 && (
          <p className="mt-3 text-sm text-emerald-600"><Check className="mr-1 inline h-4 w-4" />{rows.length} lead{rows.length === 1 ? "" : "s"} ready to import.</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={doImport} disabled={importing || rows.length === 0}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import {rows.length || ""}
          </Button>
        </div>
      </Card>
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
