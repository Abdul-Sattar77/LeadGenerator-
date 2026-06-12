"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Phone, Globe, MapPin, Star, Mail, Building2,
  Loader2, Send, Clock, StickyNote, X, MailCheck, MousePointerClick, Eye, Sparkles,
} from "lucide-react";
import { LEAD_STATUSES } from "@/lib/enums";
import { LEAD_STATUS_META, ACTIVITY_LABEL, statusLabel } from "@/lib/leadStatus";
import { toast } from "@/stores/toastStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LocalTime } from "@/components/ui/local-time";
import { ScoreBadge, StatusBadge } from "@/components/leads/badges";

type Member = { id: string; name: string; role: string };
type EmailMsg = { id: string; toEmail: string; subject: string; status: string; openCount: number; clickCount: number; sentAt: string };
type Detail = {
  lead: any;
  activities: { id: string; type: string; metadata: Record<string, any>; createdAt: string }[];
  notes: { id: string; body: string; createdAt: string }[];
};

export default function LeadDetailClient({ id, initial, members, emails }: { id: number; initial: Detail; members: Member[]; emails: EmailMsg[] }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState<null | "summarize" | "next-step">(null);

  async function runAi(action: "summarize" | "next-step") {
    setAiLoading(action);
    setAiText("");
    try {
      const res = await fetch("/api/app/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, leadId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed.");
      setAiText(data.text || "");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(null);
    }
  }

  const { data } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const res = await fetch(`/api/app/leads/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()) as Detail;
    },
    initialData: initial,
  });

  const lead = data.lead;

  const patch = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/app/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/app/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note }),
      });
      if (!res.ok) throw new Error("Failed to add note");
    },
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["lead", id] });
    },
  });

  // Unified timeline: notes + activities (minus NOTE_ADDED, shown via the note itself).
  const timeline = [
    ...data.notes.map((n) => ({ kind: "note" as const, id: n.id, createdAt: n.createdAt, body: n.body })),
    ...data.activities
      .filter((a) => a.type !== "NOTE_ADDED")
      .map((a) => ({ kind: "activity" as const, id: a.id, createdAt: a.createdAt, type: a.type, metadata: a.metadata })),
  ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/app/leads" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Avatar name={lead.name} size="lg" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight">{lead.name}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[lead.category, lead.industry].filter(Boolean).join(" · ") || "Lead"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <ScoreBadge score={lead.leadScore} />
              <span className="text-xs text-muted-foreground">lead score</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => patch.mutate({ status: e.target.value })}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_META[s].label}</option>
            ))}
          </select>
          <select
            value={lead.assignedUserId ?? ""}
            onChange={(e) => patch.mutate({ assignedUserId: e.target.value || null })}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setShowCall(true)} title="Log a call">
            <Phone className="h-4 w-4" /> Log call
          </Button>
          <Button
            variant="gradient"
            onClick={() => (lead.email ? setShowEmail(true) : toast.error("Add an email to this lead first."))}
            title={lead.email ? "Send an email" : "This lead has no email"}
          >
            <Mail className="h-4 w-4" /> Email
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details + score breakdown */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h2 className="font-semibold">Details</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Detail icon={Phone} value={lead.phone} />
              <Detail icon={Mail} value={lead.email} />
              <Detail icon={Globe} value={lead.website} href={lead.website ? `https://${lead.website.replace(/^https?:\/\//, "")}` : undefined} />
              <Detail icon={MapPin} value={lead.address} />
              <Detail icon={Building2} value={lead.contactPerson} />
              <Detail
                icon={Star}
                value={lead.rating != null ? `${lead.rating} (${lead.reviews ?? 0} reviews)` : ""}
              />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Deal value</h2>
            <p className="mt-1 text-xs text-muted-foreground">Potential or closed value for this opportunity.</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">$</span>
              <input
                type="number"
                min={0}
                defaultValue={lead.dealValue ?? ""}
                placeholder="0"
                onBlur={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  if (v !== (lead.dealValue ?? null)) patch.mutate({ dealValue: v });
                }}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Lead score</h2>
            <div className="mt-3 space-y-2">
              {Object.entries(lead.scoreBreakdown as Record<string, number>).map(([factor, pts]) => (
                <div key={factor} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{factor}</span>
                  <span className="font-semibold">+{pts}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
                <span>Total</span>
                <span>{lead.leadScore}/100</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Notes + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-300/30 to-fuchsia-300/30 blur-2xl" />
            <h2 className="relative flex items-center gap-2 font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white"><Sparkles className="h-3.5 w-3.5" /></span>
              AI assistant
            </h2>
            <div className="relative mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => runAi("summarize")} disabled={!!aiLoading}>
                {aiLoading === "summarize" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Summarize lead
              </Button>
              <Button variant="outline" size="sm" onClick={() => runAi("next-step")} disabled={!!aiLoading}>
                {aiLoading === "next-step" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Suggest next step
              </Button>
            </div>
            {aiText && (
              <div className="relative mt-3 whitespace-pre-wrap rounded-xl bg-secondary/50 p-3 text-sm">{aiText}</div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <StickyNote className="h-4 w-4" /> Add a note
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(); }}
              className="mt-3 flex gap-2"
            >
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Owner interested — call back next week"
                className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" variant="gradient" disabled={addNote.isPending || !note.trim()}>
                {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Mail className="h-4 w-4" /> Emails
              </h2>
              {lead.email && (
                <button onClick={() => setShowEmail(true)} className="text-xs font-semibold text-primary hover:underline">
                  Compose
                </button>
              )}
            </div>
            {emails.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No emails sent yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {emails.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.subject}</span>
                      <span className="block truncate text-xs text-muted-foreground">to {e.toEmail} · <LocalTime iso={e.sentAt} /></span>
                    </span>
                    <EmailStatusPill status={e.status} opens={e.openCount} clicks={e.clickCount} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" /> Activity timeline
            </h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    {item.kind === "note" ? (
                      <p className="text-sm">{item.body}</p>
                    ) : (
                      <p className="text-sm">
                        <span className="font-medium">{ACTIVITY_LABEL[item.type] ?? item.type}</span>
                        {item.type === "STATUS_CHANGED" && item.metadata?.to && (
                          <span className="text-muted-foreground">
                            {" "}— {statusLabel(item.metadata.from)} → {statusLabel(item.metadata.to)}
                          </span>
                        )}
                      </p>
                    )}
                    <LocalTime iso={item.createdAt} className="text-xs text-muted-foreground" />
                  </div>
                </li>
              ))}
              {timeline.length === 0 && (
                <li className="text-sm text-muted-foreground">No activity yet.</li>
              )}
            </ol>
          </Card>
        </div>
      </div>

      {showEmail && (
        <SendEmailDialog
          leadId={id}
          toEmail={lead.email}
          leadName={lead.name}
          onClose={() => setShowEmail(false)}
          onSent={() => { setShowEmail(false); router.refresh(); qc.invalidateQueries({ queryKey: ["lead", id] }); }}
        />
      )}

      {showCall && (
        <LogCallDialog
          leadId={id}
          leadName={lead.name}
          onClose={() => setShowCall(false)}
          onDone={() => { setShowCall(false); router.refresh(); qc.invalidateQueries({ queryKey: ["lead", id] }); }}
        />
      )}
    </div>
  );
}

const CALL_OUTCOMES = ["Connected", "Left voicemail", "No answer", "Interested", "Not interested", "Call back later"];

function LogCallDialog({ leadId, leadName, onClose, onDone }: { leadId: number; leadName: string; onClose: () => void; onDone: () => void }) {
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("Connected");
  const [withReminder, setWithReminder] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!summary.trim()) return;
    if (withReminder && !reminderAt) { toast.error("Pick a reminder date & time."); return; }
    setSaving(true);
    const res = await fetch(`/api/app/leads/${leadId}/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary,
        outcome,
        reminderAt: withReminder ? new Date(reminderAt).toISOString() : null,
        reminderTitle: withReminder ? reminderTitle : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(data.error || "Couldn’t log the call."); return; }
    toast.success(data.reminderCreated ? "Call logged · reminder set." : "Call logged.");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="flex max-h-[85vh] w-full max-w-lg flex-col p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Phone className="h-5 w-5" /> Log call — {leadName}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">What did you discuss? *</span>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} autoFocus
              placeholder="e.g. Owner wants to meet this evening to discuss a new website."
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Outcome</span>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={withReminder} onChange={(e) => setWithReminder(e.target.checked)} className="h-4 w-4 rounded border-input" />
              <Clock className="h-4 w-4 text-muted-foreground" /> Set a follow-up reminder
            </label>
            {withReminder && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Date &amp; time *</span>
                  <input type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Reminder note</span>
                  <input value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder={`Follow up: ${leadName}`}
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </label>
                <p className="col-span-full text-xs text-muted-foreground">We’ll email you at that time and add it to your tasks.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={save} disabled={saving || !summary.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Log call
          </Button>
        </div>
      </Card>
    </div>
  );
}

function EmailStatusPill({ status, opens, clicks }: { status: string; opens: number; clicks: number }) {
  if (status === "CLICKED") return <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700"><MousePointerClick className="h-3 w-3" /> Clicked{clicks > 1 ? ` ${clicks}×` : ""}</span>;
  if (status === "OPENED") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"><Eye className="h-3 w-3" /> Opened{opens > 1 ? ` ${opens}×` : ""}</span>;
  if (status === "FAILED") return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Failed</span>;
  if (status === "SIMULATED") return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700" title="No email provider configured — not actually delivered"><MailCheck className="h-3 w-3" /> Simulated</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700"><MailCheck className="h-3 w-3" /> Sent</span>;
}

function SendEmailDialog({ leadId, toEmail, leadName, onClose, onSent }: { leadId: number; toEmail: string; leadName: string; onClose: () => void; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await (await fetch("/api/app/templates")).json()).templates as { id: string; name: string; subject: string; body: string }[],
  });

  async function draftWithAi() {
    setDrafting(true);
    try {
      const res = await fetch("/api/app/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email", leadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed.");
      setTemplateId(null);
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDrafting(false);
    }
  }

  function applyTemplate(tid: string) {
    const t = templates.find((x) => x.id === tid);
    if (!t) return;
    setTemplateId(t.id);
    setSubject(t.subject);
    setBody(t.body);
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    const res = await fetch("/api/app/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, subject, body, templateId }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) { toast.error(data.error || "Couldn’t send the email."); return; }
    toast.success(data.delivered ? "Email sent." : "Email logged (no provider configured — simulated).");
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="flex max-h-[85vh] w-full max-w-lg flex-col p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Email {leadName}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">To: <span className="font-medium text-foreground">{toEmail}</span></p>
          <button onClick={draftWithAi} disabled={drafting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 transition hover:from-indigo-500/20 hover:to-violet-500/20 disabled:opacity-60">
            {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Draft with AI
          </button>
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Template</span>
            <select
              value={templateId ?? ""}
              onChange={(e) => applyTemplate(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Start from scratch…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Message <span className="text-muted-foreground/70">— {"{{name}}"} and {"{{contact}}"} are filled in automatically</span></span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={send} disabled={sending || !subject.trim() || !body.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send email
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Detail({ icon: Icon, value, href }: { icon: React.ComponentType<{ className?: string }>; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
