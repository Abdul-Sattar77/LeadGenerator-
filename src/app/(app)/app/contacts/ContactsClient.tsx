"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Contact2, Search, Plus, Loader2, Mail, Phone } from "lucide-react";
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
import { useContacts, useCreateContact, type ContactRow } from "@/hooks/useContacts";
import { toast } from "@/stores/toastStore";

const PAGE_SIZE = 20;

const LIFECYCLE_META: Record<string, { label: string; variant: "default" | "success" | "warning" | "muted" }> = {
  LEAD: { label: "Lead", variant: "muted" },
  QUALIFIED: { label: "Qualified", variant: "default" },
  CUSTOMER: { label: "Customer", variant: "success" },
  EVANGELIST: { label: "Evangelist", variant: "warning" },
};

export default function ContactsClient() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);
  const { data, isLoading } = useContacts({ q, page });
  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Every person you talk to — linked to their company and deals."
        icon={Contact2}
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> New contact
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Contact2}
            title={q ? "No contacts match your search" : "No contacts yet"}
            description={q ? "Try a different term." : "Add the people behind your accounts."}
            action={!q && <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New contact</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                  <motion.tr key={c.id} variants={fadeUp} className="group transition-colors hover:bg-secondary/50">
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
    </div>
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
