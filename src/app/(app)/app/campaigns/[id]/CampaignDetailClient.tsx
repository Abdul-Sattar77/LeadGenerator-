"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Users, Trophy, DollarSign, TrendingUp, Plus, X, Loader2, Trash2, Megaphone,
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

type Lead = { id: number; name: string; category: string; status: string; leadScore: number; dealValue: number | null; assignedUser: { id: string; name: string } | null };
type Data = {
  campaign: { id: string; name: string; description: string; status: string; createdAt: string };
  leads: Lead[];
  stats: { total: number; wonCount: number; wonValue: number; pipelineValue: number; byStatus: { status: string; count: number }[] };
};

function fmtMoney(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function CampaignDetailClient({ id, initial, addable }: { id: string; initial: Data; addable: Lead[] }) {
  const router = useRouter();
  const { campaign, leads, stats } = initial;
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    const res = await fetch(`/api/app/campaigns/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(false);
    if (!res.ok) { toast.error("Couldn’t update the campaign."); return; }
    router.refresh();
  }
  async function removeLead(leadId: number) {
    const res = await fetch(`/api/app/campaigns/${id}/leads?leadId=${leadId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Couldn’t remove the lead."); return; }
    router.refresh();
  }
  async function del() {
    if (!confirm("Delete this campaign? Leads stay in your CRM.")) return;
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
          <Button variant="outline" onClick={del} className="text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

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
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-accent/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={l.name} size="sm" />
                          <Link href={`/app/leads/${l.id}`} className="font-semibold hover:text-primary">{l.name}</Link>
                          <ScoreBadge score={l.leadScore} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{l.dealValue ? fmtMoney(l.dealValue) : "—"}</td>
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
          <h2 className="mb-4 font-semibold">By stage</h2>
          <LeadsByStage byStage={stats.byStatus} />
        </Card>
      </div>

      {showAdd && <AddLeadsDialog id={id} addable={addable} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); router.refresh(); }} />}
    </div>
  );
}

function AddLeadsDialog({ id, addable, onClose, onDone }: { id: string; addable: Lead[]; onClose: () => void; onDone: () => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const toggle = (lid: number) => setSelected((s) => { const n = new Set(s); n.has(lid) ? n.delete(lid) : n.add(lid); return n; });

  async function save() {
    if (selected.size === 0) return;
    setSaving(true);
    const res = await fetch(`/api/app/campaigns/${id}/leads`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadIds: [...selected] }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Couldn’t add the leads."); return; }
    toast.success(`Added ${selected.size} lead${selected.size === 1 ? "" : "s"}.`);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="flex max-h-[80vh] w-full max-w-lg flex-col p-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold">Add leads</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {addable.map((l) => (
            <button key={l.id} onClick={() => toggle(l.id)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/30", selected.has(l.id) && "bg-accent/40")}>
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected.has(l.id) ? "border-primary bg-primary text-white" : "border-border")}>
                {selected.has(l.id) && <span className="text-[10px] font-bold">✓</span>}
              </span>
              <Avatar name={l.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{l.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{l.category || "Lead"}</span>
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
