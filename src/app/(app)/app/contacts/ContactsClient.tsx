"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact2, Search, Plus, Loader2, Upload, Download, Trash2, X, Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/PageHeader";
import { TagChips } from "@/components/app/TagEditor";
import { api } from "@/lib/api";
import { fadeUp, stagger } from "@/lib/motion";
import { useContacts, useCreateContact, type ContactRow } from "@/hooks/useContacts";
import { toast } from "@/stores/toastStore";

const PAGE_SIZE = 20;
const LIFECYCLES = ["LEAD", "QUALIFIED", "CUSTOMER", "EVANGELIST"];
const LIFECYCLE_META: Record<string, { label: string; variant: "default" | "success" | "warning" | "muted" }> = {
  LEAD: { label: "Lead", variant: "muted" },
  QUALIFIED: { label: "Qualified", variant: "default" },
  CUSTOMER: { label: "Customer", variant: "success" },
  EVANGELIST: { label: "Evangelist", variant: "warning" },
};

interface Tag { id: string; name: string; color: string }
interface View { id: string; name: string; filters: { q?: string; tagId?: string; lifecycleStage?: string } }

export default function ContactsClient() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [tagId, setTagId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);

  const { data, isLoading } = useContacts({ q, page, lifecycleStage: lifecycle, tagId });
  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { data: tags = [] } = useQuery({ queryKey: ["tags"], queryFn: () => api<Tag[]>("/api/app/tags") });
  const { data: sequences = [] } = useQuery({ queryKey: ["sequences"], queryFn: () => api<{ id: string; name: string }[]>("/api/app/sequences") });
  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => fetch("/api/app/team").then((r) => (r.ok ? r.json() : { members: [] })).then((d) => (d.members ?? []) as { id: string; name: string }[]),
  });
  const { data: views = [] } = useQuery({
    queryKey: ["views", "contacts"],
    queryFn: async () => (await fetch("/api/app/views?entity=contacts").then((r) => r.json())).views as View[],
  });

  const resetFilters = (f: { q?: string; lifecycle?: string; tagId?: string }) => {
    setQ(f.q ?? ""); setLifecycle(f.lifecycle ?? ""); setTagId(f.tagId ?? ""); setPage(1); setSelected(new Set());
  };
  const clearSel = () => setSelected(new Set());
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = contacts.length > 0 && contacts.every((c) => selected.has(c.id));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allOnPage) contacts.forEach((c) => n.delete(c.id)); else contacts.forEach((c) => n.add(c.id));
    return n;
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["contacts"] });

  const bulk = useMutation({
    mutationFn: (body: { ids: string[]; action: string; value?: string }) =>
      api("/api/app/contacts/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (r: any) => { clearSel(); invalidate(); toast.success(`Updated ${r.affected} contact(s)`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk action failed"),
  });

  const enroll = useMutation({
    mutationFn: (seqId: string) => api(`/api/app/sequences/${seqId}/enroll`, { method: "POST", body: JSON.stringify({ contactIds: [...selected] }) }),
    onSuccess: (r: any) => { clearSel(); toast.success(`Enrolled ${r.enrolled} contact(s) into the sequence`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't enroll"),
  });

  async function saveView() {
    const name = prompt("Name this view (segment):");
    if (!name?.trim()) return;
    await fetch("/api/app/views", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), filters: { entity: "contacts", q, tagId, lifecycleStage: lifecycle } }),
    });
    qc.invalidateQueries({ queryKey: ["views", "contacts"] });
    toast.success("View saved");
  }
  async function deleteView(id: string) {
    await fetch(`/api/app/views/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["views", "contacts"] });
  }

  const filtersActive = q || lifecycle || tagId;

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Every person you talk to — linked to their company and deals."
        icon={Contact2}
        actions={
          <div className="flex items-center gap-2">
            <a href="/api/app/contacts/export"><Button variant="outline"><Download className="h-4 w-4" /> Export</Button></a>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New contact</Button>
          </div>
        }
      />

      {/* Filter toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, phone…" className="pl-9" />
        </div>
        <select value={lifecycle} onChange={(e) => { setLifecycle(e.target.value); setPage(1); }} className="h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">All stages</option>
          {LIFECYCLES.map((s) => <option key={s} value={s}>{LIFECYCLE_META[s].label}</option>)}
        </select>
        <select value={tagId} onChange={(e) => { setTagId(e.target.value); setPage(1); }} className="h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">All tags</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {filtersActive && <Button variant="ghost" size="sm" onClick={() => resetFilters({})}>Clear</Button>}
        {filtersActive && <Button variant="outline" size="sm" onClick={saveView}><Bookmark className="h-4 w-4" /> Save view</Button>}
        <span className="ml-auto text-sm text-muted-foreground">{total} total</span>
      </div>

      {/* Saved views */}
      {views.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {views.map((v) => (
            <span key={v.id} className="group inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
              <button onClick={() => resetFilters({ q: v.filters.q, lifecycle: v.filters.lifecycleStage, tagId: v.filters.tagId })} className="font-medium hover:text-primary">{v.name}</button>
              <button onClick={() => deleteView(v.id)} className="opacity-0 transition group-hover:opacity-60 hover:!opacity-100" aria-label="Delete view"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-semibold text-primary">{selected.size} selected</span>
          <select onChange={(e) => { if (e.target.value) { bulk.mutate({ ids: [...selected], action: "addTag", value: e.target.value }); e.target.value = ""; } }} defaultValue="" className="h-8 rounded-lg border border-input bg-card px-2 text-sm">
            <option value="" disabled>Add tag…</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select onChange={(e) => { if (e.target.value) { bulk.mutate({ ids: [...selected], action: "setLifecycle", value: e.target.value }); e.target.value = ""; } }} defaultValue="" className="h-8 rounded-lg border border-input bg-card px-2 text-sm">
            <option value="" disabled>Set stage…</option>
            {LIFECYCLES.map((s) => <option key={s} value={s}>{LIFECYCLE_META[s].label}</option>)}
          </select>
          {members.length > 0 && (
            <select onChange={(e) => { bulk.mutate({ ids: [...selected], action: "assignOwner", value: e.target.value || undefined }); e.target.value = "__"; }} defaultValue="__" className="h-8 rounded-lg border border-input bg-card px-2 text-sm">
              <option value="__" disabled>Assign owner…</option>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          {sequences.length > 0 && (
            <select onChange={(e) => { if (e.target.value) { enroll.mutate(e.target.value); e.target.value = ""; } }} defaultValue="" className="h-8 rounded-lg border border-input bg-card px-2 text-sm">
              <option value="" disabled>Add to sequence…</option>
              {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" className="text-rose-600" onClick={() => { if (confirm(`Delete ${selected.size} contact(s)?`)) bulk.mutate({ ids: [...selected], action: "delete" }); }}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSel}>Clear</Button>
        </motion.div>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : contacts.length === 0 ? (
          <EmptyState icon={Contact2} title={filtersActive ? "No contacts match" : "No contacts yet"} description={filtersActive ? "Try different filters." : "Add the people behind your accounts."} action={!filtersActive && <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New contact</Button>} />
        ) : (
          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" checked={allOnPage} onChange={toggleAll} className="h-4 w-4" aria-label="Select all" /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody variants={stagger(0.03)} initial="hidden" animate="show" className="divide-y divide-border">
              {contacts.map((c: ContactRow) => {
                const lc = LIFECYCLE_META[c.lifecycleStage] ?? LIFECYCLE_META.LEAD;
                return (
                  <motion.tr key={c.id} variants={fadeUp} className={`group transition-colors hover:bg-secondary/50 ${selected.has(c.id) ? "bg-primary/5" : ""}`}>
                    <TableCell><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4" aria-label={`Select ${c.firstName}`} /></TableCell>
                    <TableCell>
                      <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase text-muted-foreground">
                          {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground group-hover:text-primary">{c.firstName} {c.lastName}</span>
                          {c.title && <span className="block truncate text-xs text-muted-foreground">{c.title}</span>}
                          {c.tags?.length > 0 && <span className="mt-1 block"><TagChips tags={c.tags} /></span>}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.company ? <Link href={`/app/companies/${c.company.id}`} className="text-muted-foreground hover:text-primary">{c.company.name}</Link> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell><Badge variant={lc.variant}>{lc.label}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{c.dealCount}</TableCell>
                    <TableCell>{c.owner ? <Badge variant="muted">{c.owner.name}</Badge> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </Table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <NewContactDialog open={showNew} onOpenChange={setShowNew} />
      <ImportDialog open={showImport} onOpenChange={setShowImport} onDone={invalidate} />
    </div>
  );
}

// ── CSV import ──────────────────────────────────────────────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const split = (line: string) => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

const HEADER_MAP: Record<string, string> = {
  "first name": "firstName", firstname: "firstName", first: "firstName", "given name": "firstName",
  "last name": "lastName", lastname: "lastName", last: "lastName", surname: "lastName",
  email: "email", "email address": "email", "e-mail": "email",
  phone: "phone", mobile: "phone", "phone number": "phone", tel: "phone",
  title: "title", "job title": "title", role: "title", position: "title",
  company: "companyName", "company name": "companyName", organization: "companyName", organisation: "companyName", account: "companyName",
};

function ImportDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const mapped = useMemo(() => rows.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) { const field = HEADER_MAP[k]; if (field) out[field] = v; }
    return out;
  }).filter((r) => r.firstName || r.email), [rows]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(String(reader.result || "")));
    reader.readAsText(file);
  }

  async function doImport() {
    if (!mapped.length) return;
    setSaving(true);
    try {
      const r = await api<{ created: number; skipped: number }>("/api/app/contacts/import", { method: "POST", body: JSON.stringify({ rows: mapped }) });
      toast.success(`Imported ${r.created} contact(s)${r.skipped ? ` · ${r.skipped} skipped` : ""}.`);
      setRows([]); setFileName(""); onDone(); onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Import contacts from CSV</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a .csv with columns like <span className="font-mono text-xs">first name, last name, email, phone, title, company</span>. We auto-match the headers.
          </p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <Button variant="outline" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> {fileName || "Choose CSV file"}</Button>
          {rows.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <span className="font-semibold text-foreground">{mapped.length}</span> contacts ready to import
              {rows.length - mapped.length > 0 && <span className="text-muted-foreground"> · {rows.length - mapped.length} rows missing name/email</span>}
              <div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                {mapped.slice(0, 5).map((r, i) => <div key={i} className="truncate">{[r.firstName, r.lastName].filter(Boolean).join(" ") || r.email} {r.companyName ? `· ${r.companyName}` : ""}</div>)}
                {mapped.length > 5 && <div>…and {mapped.length - 5} more</div>}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={doImport} disabled={saving || !mapped.length}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Import {mapped.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateContact();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", title: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success("Contact created");
      setForm({ firstName: "", lastName: "", email: "", phone: "", title: "" });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ct-first">First name *</Label>
              <Input id="ct-first" value={form.firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("firstName", e.target.value)} required autoFocus placeholder="Ayesha" />
            </div>
            <div>
              <Label htmlFor="ct-last">Last name</Label>
              <Input id="ct-last" value={form.lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("lastName", e.target.value)} placeholder="Khan" />
            </div>
          </div>
          <div>
            <Label htmlFor="ct-email">Email</Label>
            <Input id="ct-email" type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)} placeholder="ayesha@acme.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ct-phone">Phone</Label>
              <Input id="ct-phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)} placeholder="+92…" />
            </div>
            <div>
              <Label htmlFor="ct-title">Job title</Label>
              <Input id="ct-title" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("title", e.target.value)} placeholder="Head of Sales" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={create.isPending || !form.firstName.trim()}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
