"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mailbox, Plus, Loader2, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/PageHeader";
import { fadeUp, stagger } from "@/lib/motion";
import { useSequences, useCreateSequence, type SequenceRow } from "@/hooks/useSequences";
import { toast } from "@/stores/toastStore";

export default function SequencesClient() {
  const { data: sequences = [], isLoading } = useSequences();
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <PageHeader
        title="Sequences"
        subtitle="Automated multi-step email cadences — enroll contacts and follow up on autopilot."
        icon={Mailbox}
        actions={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New sequence</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : sequences.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={Mailbox}
            title="No sequences yet"
            description="Create a cadence like “Cold outreach” with steps on Day 0, 3 and 7."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New sequence</Button>}
          />
        </Card>
      ) : (
        <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sequences.map((s: SequenceRow) => (
            <motion.div key={s.id} variants={fadeUp}>
              <Link href={`/app/sequences/${s.id}`}>
                <Card className="group h-full p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mailbox className="h-5 w-5" /></span>
                    <Badge variant={s.status === "ACTIVE" ? "success" : "muted"}>{s.status === "ACTIVE" ? "Active" : "Paused"}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold leading-tight group-hover:text-primary">{s.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{s.stepCount} step{s.stepCount === 1 ? "" : "s"}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{s.activeCount} active</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <NewSequenceDialog open={showNew} onOpenChange={setShowNew} />
    </div>
  );
}

function NewSequenceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateSequence();
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(name.trim());
      toast.success("Sequence created");
      setName("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create sequence");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New sequence</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="seq-name">Sequence name *</Label>
            <Input id="seq-name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required autoFocus placeholder="Cold outreach" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
