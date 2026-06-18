"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, Globe, Phone, MapPin, Briefcase, Loader2, Users, Send, Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/app/ActivityTimeline";
import { RecordTasks } from "@/components/app/RecordTasks";
import { LogActivity } from "@/components/app/LogActivity";
import { TagEditor } from "@/components/app/TagEditor";
import { qk } from "@/lib/queryKeys";
import { fadeUp } from "@/lib/motion";
import { useCompany, useAddCompanyNote } from "@/hooks/useCompanies";
import { toast } from "@/stores/toastStore";

function money(v: any) {
  const n = v == null ? 0 : Number(v);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function stageTone(kind: string) {
  if (kind === "WON") return "success" as const;
  if (kind === "LOST") return "warning" as const;
  return "default" as const;
}

export default function CompanyDetail({ id }: { id: string }) {
  const { data: company, isLoading } = useCompany(id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!company) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Company not found.</p>
        <Link href="/app/companies" className="mt-3 inline-block text-sm text-primary">← Back to companies</Link>
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-5xl">
      <Link href="/app/companies" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Companies
      </Link>

      {/* Header */}
      <Card className="mb-5 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold uppercase text-primary">
            {company.name.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {company.industry && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{company.industry}</span>}
              {company.website && <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary"><Globe className="h-4 w-4" />{company.website.replace(/^https?:\/\//, "")}</a>}
              {company.phone && <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-primary"><Phone className="h-4 w-4" />{company.phone}</a>}
              {(company.city || company.country) && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{[company.city, company.country].filter(Boolean).join(", ")}</span>}
            </div>
            <div className="mt-3">
              <TagEditor apiBase={`/api/app/companies/${id}`} tags={(company.tagLinks ?? []).map((tl: any) => tl.tag)} recordQueryKey={qk.company(id)} />
            </div>
          </div>
          {company.owner && <Badge variant="muted">Owner · {company.owner.name}</Badge>}
        </div>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({company.contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({company.deals.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="p-6">
            <LogActivity apiBase={`/api/app/companies/${id}`} recordQueryKey={qk.company(id)} />
            <div className="mt-4"><NoteComposer id={id} /></div>
            <div className="mt-6">
              <ActivityTimeline items={company.timeline} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="p-2">
            {company.contacts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No contacts at this company yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {company.contacts.map((c: any) => (
                  <li key={c.id}>
                    <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary/50">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase text-muted-foreground">
                        {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.firstName} {c.lastName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.title || c.email || "—"}</span>
                      </span>
                      {c.email && <span className="hidden text-sm text-muted-foreground sm:block">{c.email}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="p-2">
            {company.deals.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No deals linked to this company.</p>
            ) : (
              <ul className="divide-y divide-border">
                {company.deals.map((d: any) => (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{money(d.value)}</span>
                    </span>
                    <Badge variant={stageTone(d.stage?.kind)}>{d.stage?.name ?? d.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-6">
            <RecordTasks apiBase={`/api/app/companies/${id}`} recordQueryKey={qk.company(id)} />
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function NoteComposer({ id }: { id: string }) {
  const [body, setBody] = useState("");
  const addNote = useAddCompanyNote(id);

  async function submit() {
    if (!body.trim()) return;
    try {
      await addNote.mutateAsync(body.trim());
      setBody("");
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    }
  }

  return (
    <div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a note — what happened, next steps…"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={addNote.isPending || !body.trim()}>
          {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add note
        </Button>
      </div>
    </div>
  );
}
