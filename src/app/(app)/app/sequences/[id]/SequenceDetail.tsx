"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2, Play, Pause, Mail, Clock, CheckCircle2, XCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LocalTime } from "@/components/ui/local-time";
import { fadeUp } from "@/lib/motion";
import { api } from "@/lib/api";
import { useSequence } from "@/hooks/useSequences";
import { toast } from "@/stores/toastStore";

interface Step { dayOffset: number; subject: string; body: string }

export default function SequenceDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: seq, isLoading } = useSequence(id);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (seq?.steps) setSteps(seq.steps.map((s: any) => ({ dayOffset: s.dayOffset, subject: s.subject, body: s.body })));
  }, [seq?.steps]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sequence", id] });

  const saveSteps = useMutation({
    mutationFn: () => api(`/api/app/sequences/${id}/steps`, { method: "PUT", body: JSON.stringify({ steps }) }),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ["sequences"] }); toast.success("Steps saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save steps"),
  });
  const setStatus = useMutation({
    mutationFn: (status: string) => api(`/api/app/sequences/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ["sequences"] }); },
  });
  const stop = useMutation({
    mutationFn: (eid: string) => api(`/api/app/sequences/${id}/enroll?enrollmentId=${eid}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: () => api(`/api/app/sequences/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sequences"] }); router.push("/app/sequences"); },
  });

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!seq) return <div className="py-20 text-center"><p className="text-muted-foreground">Sequence not found.</p><Link href="/app/sequences" className="mt-3 inline-block text-sm text-primary">← Back</Link></div>;

  const addStep = () => setSteps((s) => [...s, { dayOffset: s.length ? s[s.length - 1].dayOffset + 3 : 0, subject: "", body: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const setStep = (i: number, k: keyof Step, v: string | number) => setSteps((s) => s.map((st, idx) => idx === i ? { ...st, [k]: v } : st));

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto max-w-4xl">
      <Link href="/app/sequences" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Sequences</Link>

      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{seq.name}</h1>
          <Badge variant={seq.status === "ACTIVE" ? "success" : "muted"}>{seq.status === "ACTIVE" ? "Active" : "Paused"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {seq.status === "ACTIVE" ? (
            <Button variant="outline" size="sm" onClick={() => setStatus.mutate("PAUSED")}><Pause className="h-4 w-4" /> Pause</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setStatus.mutate("ACTIVE")}><Play className="h-4 w-4" /> Activate</Button>
          )}
          <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => { if (confirm("Delete this sequence and its enrollments?")) del.mutate(); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </Card>

      {/* Steps editor */}
      <Card className="mb-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Steps</h2>
          <Button size="sm" onClick={() => saveSteps.mutate()} disabled={saveSteps.isPending || steps.some((s) => !s.subject.trim() || !s.body.trim())}>
            {saveSteps.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save steps
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((st, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="text-muted-foreground">Send on day</span>
                  <Input type="number" min="0" value={st.dayOffset} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStep(i, "dayOffset", Number(e.target.value))} className="h-8 w-20" />
                </div>
                <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-rose-600" aria-label="Remove step"><Trash2 className="h-4 w-4" /></button>
              </div>
              <Input value={st.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStep(i, "subject", e.target.value)} placeholder="Subject — e.g. Quick idea for {{name}}" className="mb-2 h-9" />
              <Textarea value={st.body} onChange={(e) => setStep(i, "body", e.target.value)} placeholder="Email body… use {{name}} and {{contact}} for personalisation" rows={3} />
            </div>
          ))}
          {steps.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No steps yet. Add the first email below.</p>}
          <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-4 w-4" /> Add step</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Steps send automatically on their day (relative to enrollment) while the sequence is Active. Enroll contacts from the Contacts page (select rows → Add to sequence).</p>
      </Card>

      {/* Enrollments */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Enrolled contacts ({seq.enrollments.length})</h2>
        {seq.enrollments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No one enrolled yet. Go to Contacts, select people, and choose “Add to sequence”.</p>
        ) : (
          <ul className="divide-y divide-border">
            {seq.enrollments.map((e: any) => {
              const tone = e.status === "ACTIVE" ? "text-sky-600" : e.status === "COMPLETED" ? "text-emerald-600" : "text-rose-600";
              const Icon = e.status === "ACTIVE" ? Clock : e.status === "COMPLETED" ? CheckCircle2 : XCircle;
              return (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Link href={`/app/contacts/${e.contact.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium hover:text-primary">{e.contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{e.contact.email || "no email"}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">Step {Math.min(e.currentStep + 1, seq.steps.length)}/{seq.steps.length}</span>
                  {e.nextRunAt && e.status === "ACTIVE" && <span className="hidden text-xs text-muted-foreground sm:inline">next <LocalTime iso={e.nextRunAt} dateOnly /></span>}
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone)}><Icon className="h-3.5 w-3.5" />{e.status[0] + e.status.slice(1).toLowerCase()}</span>
                  {e.status === "ACTIVE" && <button onClick={() => stop.mutate(e.id)} className="text-xs text-muted-foreground hover:text-rose-600">Stop</button>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}
