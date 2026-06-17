"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Users, Trophy, DollarSign, TrendingUp, Plus, X, Loader2, Trash2, Megaphone, Mail, Eye, MousePointerClick, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STATUSES } from "@/lib/enums";
import { CAMPAIGN_STATUS_META } from "@/lib/campaignStatus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, ScoreBadge } from "@/components/leads/badges";
import { LeadsByStage } from "../../DashboardCharts";
import { toast } from "@/stores/toastStore";

type Lead = { id: string; name: string; email: string | null; company: { id: string; name: string } | null; status: string; leadScore: number; assignedUser: { id: string; name: string } | null };
type EmailStats = { sent: number; opened: number; clicked: number; openRate: number; clickRate: number };
type Data = {
  campaign: { id: string; name: string; description: string; status: string; createdAt: string };
  leads: Lead[];
  stats: { total: number; withEmail: number; wonCount: number; wonValue: number; pipelineValue: number; byStatus: { status: string; count: number }[]; email: EmailStats };
};

function fmtMoney(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function CampaignDetailClient({ id, initial, addable }: { id: string; initial: Data; addable: Lead[] }) {
  const router = useRouter();
  const { campaign, leads, stats } = initial;
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    const res = await fetch(`/api/app/campaigns/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(false);
    if (!res.ok) { toast.error("Couldn’t update the campaign."); return; }
    router.refresh();
  }
  async function removeLead(contactId: string) {
    const res = await fetch(`/api/app/campaigns/${id}/leads?contactId=${contactId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Couldn’t remove the contact."); return; }
    router.refresh();
  }
  async function del() {
    if (!confirm("Delete this campaign? Contacts stay in your CRM.")) return;
    await fetch(`/api/app/campaigns/${id}`, { method: "DELETE" });
    router.push("/app/campaigns");
  }

  const tiles = [
    { label: "Leads", value: stats.total, icon: Users, tone: "from-indigo-500 to-violet-500" },
    { label: "Won", value: stats.wonCount, icon: Trophy, tone: "from-emerald-500 to-teal-500" },
    { label: "Won revenue", value: fmtMoney(stats.wonValue), icon: DollarSign, tone: "from-emerald-500 to-green-500" },
    { label: "Pipeline value", value: fmtMoney(stats.pipelineValue), icon: TrendingUp, tone: "from-sky-500 to-blue-500" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/app/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{campaign.name}</h1>
            {campaign.description && <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{campaign.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={campaign.status}
            disabled={busy}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{CAMPAIGN_STATUS_META[s].label}</option>)}
          </select>
          <Button variant="gradient" onClick={() => setShowEmail(true)} disabled={stats.withEmail === 0} title={stats.withEmail ? "Email this campaign" : "No leads with an email address"}>
            <Mail className="h-4 w-4" /> Email campaign
          </Button>
          <Button variant="outline" onClick={del} className="text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Email engagement */}
      {stats.email.sent > 0 && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4" /> Email engagement</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Sent" value={stats.email.sent} />
            <Stat label="Opened" value={stats.email.opened} icon={<Eye className="h-3.5 w-3.5" />} />
            <Stat label="Open rate" value={`${stats.email.openRate}%`} tone="text-emerald-600" />
            <Stat label="Click rate" value={`${stats.email.clickRate}%`} tone="text-violet-600" icon={<MousePointerClick className="h-3.5 w-3.5" />} />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white", t.tone)}>
              <t.icon className="h-4.5 w-4.5" />
            </span>
            <div className="mt-3 text-2xl font-extrabold tracking-tight">{t.value}</div>
            <div className="text-xs text-muted-foreground">{t.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Leads */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-semibold">Leads in campaign</h2>
            <Button variant="gradient" size="sm" onClick={() => setShowAdd(true)} disabled={addable.length === 0}>
              <Plus className="h-4 w-4" /> Add leads
            </Button>
          </div>
          {leads.length === 0 ? (
            <EmptyState icon={Users} title="No leads yet" description="Add leads from your CRM to this campaign." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Lifecycle</th>
                    <th className="px-4 py-3 text-right font-medium">Company</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-accent/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={l.name} size="sm" />
                          <Link href={`/app/contacts/${l.id}`} className="font-semibold hover:text-primary">{l.name}</Link>
                          <ScoreBadge score={l.leadScore} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">{l.status}</span></td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{l.company?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeLead(l.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-600" title="Remove from campaign">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Breakdown */}
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-semibold">By lifecycle</h2>
          <div className="space-y-2.5">
            {stats.byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs font-medium text-muted-foreground">{s.status}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-md bg-secondary/50">
                  <div className="h-full rounded-md bg-gradient-to-r from-indigo-400 to-violet-400" style={{ width: `${stats.total ? (s.count / stats.total) * 100 : 0}%` }} />
                </div>
                <span className="w-6 text-right text-xs font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showAdd && <AddLeadsDialog id={id} addable={addable} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); router.refresh(); }} />}
      {showEmail && (
        <CampaignEmailDialog
          id={id}
          recipients={stats.withEmail}
          onClose={() => setShowEmail(false)}
          onSent={() => { setShowEmail(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string | number; tone?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className={cn("flex items-center gap-1 text-2xl font-extrabold tracking-tight", tone)}>{icon}{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CampaignEmailDialog({ id, recipients, onClose, onSent }: { id: string; recipients: number; onClose: () => void; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string; body: string }[]>([]);
  const [sending, setSending] = useState(false);

  // Load templates once.
  useEffect(() => {
    fetch("/api/app/templates").then((r) => r.json()).then((d) => setTemplates(d.templates || [])).catch(() => {});
  }, []);

  function applyTemplate(tid: string) {
    const t = templates.find((x) => x.id === tid);
    if (!t) return;
    setTemplateId(t.id); setSubject(t.subject); setBody(t.body);
  }

  async function send() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/app/campaigns/${id}/email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, templateId }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) { toast.error(data.error || "Couldn’t send."); return; }
    toast.success(`Sent to ${data.sent} lead${data.sent === 1 ? "" : "s"}${data.skipped ? ` · ${data.skipped} skipped` : ""}.`);
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="flex max-h-[85vh] w-full max-w-lg flex-col p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Email campaign</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Sends to <span className="font-semibold text-foreground">{recipients}</span> lead{recipients === 1 ? "" : "s"} with an email. <span className="text-muted-foreground/70">{"{{name}}"} / {"{{contact}}"} are personalised per lead.</span></p>

        <div className="mt-4 space-y-3 overflow-y-auto">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Template</span>
            <select value={templateId ?? ""} onChange={(e) => applyTemplate(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Start from scratch…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={send} disabled={sending || !subject.trim() || !body.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send to {recipients}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AddLeadsDialog({ id, addable, onClose, onDone }: { id: string; addable: Lead[]; onClose: () => void; onDone: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const toggle = (lid: string) => setSelected((s) => { const n = new Set(s); n.has(lid) ? n.delete(lid) : n.add(lid); return n; });

  async function save() {
    if (selected.size === 0) return;
    setSaving(true);
    const res = await fetch(`/api/app/campaigns/${id}/leads`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactIds: [...selected] }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Couldn’t add the contacts."); return; }
    toast.success(`Added ${selected.size} contact${selected.size === 1 ? "" : "s"}.`);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="flex max-h-[80vh] w-full max-w-lg flex-col p-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold">Add contacts</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {addable.map((l) => (
            <button key={l.id} onClick={() => toggle(l.id)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/30", selected.has(l.id) && "bg-accent/40")}>
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected.has(l.id) ? "border-primary bg-primary text-white" : "border-border")}>
                {selected.has(l.id) && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <Avatar name={l.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{l.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{l.company?.name || l.email || "Contact"}</span>
              </span>
              <ScoreBadge score={l.leadScore} />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button variant="gradient" onClick={save} disabled={saving || selected.size === 0}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add to campaign
          </Button>
        </div>
      </Card>
    </div>
  );
}
