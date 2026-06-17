"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, User, Loader2, Send, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/app/ActivityTimeline";
import { fadeUp } from "@/lib/motion";
import { useDeal, useUpdateDeal, useAddDealNote } from "@/hooks/useDeals";
import { toast } from "@/stores/toastStore";

function money(v: any) {
  const n = v == null ? 0 : Number(v);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function tone(kind?: string) {
  if (kind === "WON") return "success" as const;
  if (kind === "LOST") return "warning" as const;
  return "default" as const;
}

export default function DealDetail({ id }: { id: string }) {
  const { data: deal, isLoading } = useDeal(id);
  const update = useUpdateDeal(id);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!deal) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Deal not found.</p>
        <Link href="/app/deals" className="mt-3 inline-block text-sm text-primary">← Back to deals</Link>
      </div>
    );
  }

  const stages = deal.pipeline?.stages ?? [];

  async function changeStage(stageId: string) {
    if (stageId === deal.stageId) return;
    try {
      await update.mutateAsync({ stageId });
      toast.success("Stage updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-5xl">
      <Link href="/app/deals" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Deals
      </Link>

      <Card className="mb-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{deal.name}</h1>
              <Badge variant={tone(deal.stage?.kind)}>{deal.stage?.name}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground"><DollarSign className="h-4 w-4 text-emerald-500" />{money(deal.value)}</span>
              {deal.company && <Link href={`/app/companies/${deal.company.id}`} className="flex items-center gap-1.5 hover:text-primary"><Building2 className="h-4 w-4" />{deal.company.name}</Link>}
              {deal.primaryContact && <Link href={`/app/contacts/${deal.primaryContact.id}`} className="flex items-center gap-1.5 hover:text-primary"><User className="h-4 w-4" />{deal.primaryContact.firstName} {deal.primaryContact.lastName}</Link>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Move stage</label>
            <select
              value={deal.stageId}
              onChange={(e) => changeStage(e.target.value)}
              disabled={update.isPending}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {stages.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
        </div>

        {/* Stage progress rail */}
        <div className="mt-5 flex gap-1.5">
          {stages.map((st: any) => {
            const idx = stages.findIndex((x: any) => x.id === deal.stageId);
            const here = stages.findIndex((x: any) => x.id === st.id);
            const done = here <= idx;
            return (
              <div key={st.id} className="flex-1">
                <motion.div
                  className={`h-1.5 rounded-full ${done ? (deal.stage?.kind === "LOST" ? "bg-rose-400" : "bg-primary") : "bg-secondary"}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: here * 0.05 }}
                  style={{ originX: 0 }}
                />
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">{st.name}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({deal.contacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="p-6">
            <NoteComposer id={id} />
            <div className="mt-6"><ActivityTimeline items={deal.timeline} /></div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="p-2">
            {deal.contacts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No contacts linked to this deal.</p>
            ) : (
              <ul className="divide-y divide-border">
                {deal.contacts.map((c: any) => (
                  <li key={c.id}>
                    <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary/50">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase text-muted-foreground">
                        {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.firstName} {c.lastName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.title || c.email || "—"}</span>
                      </span>
                      {c.role && <Badge variant="muted">{c.role}</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function NoteComposer({ id }: { id: string }) {
  const [body, setBody] = useState("");
  const addNote = useAddDealNote(id);

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
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Log a call, meeting, or note…" rows={3} />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={addNote.isPending || !body.trim()}>
          {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add note
        </Button>
      </div>
    </div>
  );
}
