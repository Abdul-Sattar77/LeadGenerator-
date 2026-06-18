"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Building2, Loader2, Send, Briefcase } from "lucide-react";
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
import { useContact, useAddContactNote } from "@/hooks/useContacts";
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

const LIFECYCLE_LABEL: Record<string, string> = { LEAD: "Lead", QUALIFIED: "Qualified", CUSTOMER: "Customer", EVANGELIST: "Evangelist" };

export default function ContactDetail({ id }: { id: string }) {
  const { data: contact, isLoading } = useContact(id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!contact) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Contact not found.</p>
        <Link href="/app/contacts" className="mt-3 inline-block text-sm text-primary">← Back to contacts</Link>
      </div>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-5xl">
      <Link href="/app/contacts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>

      <Card className="mb-5 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary">
            {(contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
              <Badge variant="muted">{LIFECYCLE_LABEL[contact.lifecycleStage] ?? contact.lifecycleStage}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {contact.title && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{contact.title}</span>}
              {contact.company && <Link href={`/app/companies/${contact.company.id}`} className="flex items-center gap-1.5 hover:text-primary"><Building2 className="h-4 w-4" />{contact.company.name}</Link>}
              {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-primary"><Mail className="h-4 w-4" />{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-primary"><Phone className="h-4 w-4" />{contact.phone}</a>}
            </div>
            <div className="mt-3">
              <TagEditor apiBase={`/api/app/contacts/${id}`} tags={(contact.tagLinks ?? []).map((tl: any) => tl.tag)} recordQueryKey={qk.contact(id)} />
            </div>
          </div>
          {contact.owner && <Badge variant="muted">Owner · {contact.owner.name}</Badge>}
        </div>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="deals">Deals ({contact.deals.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="p-6">
            <LogActivity apiBase={`/api/app/contacts/${id}`} recordQueryKey={qk.contact(id)} />
            <div className="mt-4"><NoteComposer id={id} /></div>
            <div className="mt-6">
              <ActivityTimeline items={contact.timeline} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="p-2">
            {contact.deals.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No deals linked to this contact.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contact.deals.map((d: any) => (
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
            <RecordTasks apiBase={`/api/app/contacts/${id}`} recordQueryKey={qk.contact(id)} />
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function NoteComposer({ id }: { id: string }) {
  const [body, setBody] = useState("");
  const addNote = useAddContactNote(id);

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
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note — what happened, next steps…" rows={3} />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={addNote.isPending || !body.trim()}>
          {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add note
        </Button>
      </div>
    </div>
  );
}
