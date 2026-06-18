"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Search, Plus, Loader2, Users, Briefcase, Globe, MapPin } from "lucide-react";
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
import { fadeUp, stagger } from "@/lib/motion";
import { useCompanies, useCreateCompany, type CompanyRow } from "@/hooks/useCompanies";
import { toast } from "@/stores/toastStore";

const PAGE_SIZE = 20;

function money(n: number) {
  if (!n) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function CompaniesClient() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);
  const { data, isLoading } = useCompanies({ q, page });
  const companies = data?.companies ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Accounts you're selling into — each can hold many contacts and deals."
        icon={Building2}
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> New company
          </Button>
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
                <motion.tr key={c.id} variants={fadeUp} className="group transition-colors hover:bg-secondary/50">
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
    </div>
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
