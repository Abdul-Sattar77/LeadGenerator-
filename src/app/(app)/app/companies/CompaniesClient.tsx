"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Search, Plus, Loader2, Globe, MapPin, Upload, Download, Trash2 } from "lucide-react";
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
import { parseCsv, mapRows } from "@/lib/csv";
import { fadeUp, stagger } from "@/lib/motion";
import { useCompanies, useCreateCompany, type CompanyRow } from "@/hooks/useCompanies";
import { toast } from "@/stores/toastStore";

const PAGE_SIZE = 20;

function money(n: number) {
  if (!n) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function CompaniesClient() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);
  const { data, isLoading } = useCompanies({ q, page });
  const companies = data?.companies ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearSel = () => setSelected(new Set());
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = companies.length > 0 && companies.every((c) => selected.has(c.id));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allOnPage) companies.forEach((c) => n.delete(c.id)); else companies.forEach((c) => n.add(c.id));
    return n;
  });

  const bulk = useMutation({
    mutationFn: (body: { ids: string[]; action: string; value?: string }) =>
      api("/api/app/companies/bulk", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (r: any) => { clearSel(); qc.invalidateQueries({ queryKey: ["companies"] }); toast.success(`Updated ${r.affected} compan${r.affected === 1 ? "y" : "ies"}`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk action failed"),
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Accounts you're selling into — each can hold many contacts and deals."
        icon={Building2}
        actions={
          <div className="flex items-center gap-2">
            <a href="/api/app/companies/export"><Button variant="outline"><Download className="h-4 w-4" /> Export</Button></a>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New company</Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search companies, industry, city…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-semibold text-primary">{selected.size} selected</span>
          <Button
            variant="outline" size="sm" className="text-rose-600"
            onClick={() => { if (confirm(`Delete ${selected.size} compan${selected.size === 1 ? "y" : "ies"}? This also removes their deals & contacts links.`)) bulk.mutate({ ids: [...selected], action: "delete" }); }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSel}>Clear</Button>
        </div>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={q ? "No companies match your search" : "No companies yet"}
            description={q ? "Try a different term." : "Add your first account to start building the relationship graph."}
            action={!q && <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New company</Button>}
          />
        ) : (
          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" checked={allOnPage} onChange={toggleAll} className="h-4 w-4" aria-label="Select all" /></TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Open value</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody variants={stagger(0.03)} initial="hidden" animate="show" className="divide-y divide-border">
              {companies.map((c: CompanyRow) => (
                <motion.tr key={c.id} variants={fadeUp} className={`group transition-colors hover:bg-secondary/50 ${selected.has(c.id) ? "bg-primary/5" : ""}`}>
                  <TableCell><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4" aria-label={`Select ${c.name}`} /></TableCell>
                  <TableCell>
                    <Link href={`/app/companies/${c.id}`} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold uppercase text-primary">
                        {c.name.slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground group-hover:text-primary">{c.name}</span>
                        {c.website && (
                          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" /> {c.website.replace(/^https?:\/\//, "")}
                          </span>
                        )}
                        {c.tags?.length > 0 && <span className="mt-1 block"><TagChips tags={c.tags} /></span>}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.industry || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.city || c.country ? (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[c.city, c.country].filter(Boolean).join(", ")}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.contactCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.dealCount}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{money(c.openValue)}</TableCell>
                  <TableCell>{c.owner ? <Badge variant="muted">{c.owner.name}</Badge> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
                </motion.tr>
              ))}
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

      <NewCompanyDialog open={showNew} onOpenChange={setShowNew} />
      <CompanyImportDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}

const HEADER_MAP: Record<string, string> = {
  name: "name", company: "name", "company name": "name", "business name": "name",
  industry: "industry", category: "industry",
  website: "website", url: "website", site: "website",
  phone: "phone", "phone number": "phone", tel: "phone",
  address: "address", street: "address",
  city: "city", town: "city",
  country: "country",
};

function CompanyImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const mapped = useMemo(() => mapRows(rows, HEADER_MAP).filter((r) => r.name), [rows]);

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
      const r = await api<{ created: number; skipped: number; atCap: boolean }>("/api/app/companies/import", { method: "POST", body: JSON.stringify({ rows: mapped }) });
      toast.success(`Imported ${r.created} compan${r.created === 1 ? "y" : "ies"}${r.skipped ? ` · ${r.skipped} skipped` : ""}${r.atCap ? " (plan limit reached)" : ""}.`);
      setRows([]); setFileName("");
      qc.invalidateQueries({ queryKey: ["companies"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Import companies from CSV</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a .csv with columns like <span className="font-mono text-xs">name, industry, website, phone, city, country</span>. Headers are auto‑matched.
          </p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <Button variant="outline" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> {fileName || "Choose CSV file"}</Button>
          {rows.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <span className="font-semibold text-foreground">{mapped.length}</span> companies ready
              {rows.length - mapped.length > 0 && <span className="text-muted-foreground"> · {rows.length - mapped.length} rows missing a name</span>}
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

function NewCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateCompany();
  const [form, setForm] = useState({ name: "", industry: "", website: "", city: "", phone: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success("Company created");
      setForm({ name: "", industry: "", website: "", city: "", phone: "" });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="c-name">Company name *</Label>
            <Input id="c-name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} required autoFocus placeholder="Acme Inc." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-industry">Industry</Label>
              <Input id="c-industry" value={form.industry} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("industry", e.target.value)} placeholder="SaaS" />
            </div>
            <div>
              <Label htmlFor="c-city">City</Label>
              <Input id="c-city" value={form.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("city", e.target.value)} placeholder="Karachi" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-website">Website</Label>
              <Input id="c-website" value={form.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("website", e.target.value)} placeholder="acme.com" />
            </div>
            <div>
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)} placeholder="+92…" />
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
