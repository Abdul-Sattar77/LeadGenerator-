"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Building2, Mail, Plus, Trash2, ListChecks, Link2, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/stores/toastStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Billing = {
  orgName: string;
  monthlyGoal: number | null;
};

export default function SettingsClient({ billing, gmail, googleConfigured, gmailStatus, formUrl }: {
  billing: Billing;
  gmail: { email: string } | null;
  googleConfigured: boolean;
  gmailStatus: string | null;
  formUrl: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(billing.orgName);
  const [goal, setGoal] = useState(billing.monthlyGoal ? String(billing.monthlyGoal) : "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function disconnectGmail() {
    setDisconnecting(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    setDisconnecting(false);
    toast.success("Gmail disconnected.");
    router.refresh();
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameSaved(false);
    const res = await fetch("/api/app/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, monthlyGoal: goal ? Number(goal) : null }),
    });
    setSavingName(false);
    if (res.ok) { setNameSaved(true); router.refresh(); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your workspace and integrations.</p>
      </div>

      {/* Workspace name */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Workspace</h2>
        </div>
        <form onSubmit={saveName} className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Workspace name</span>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSaved(false); }}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="w-44">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Monthly revenue goal ($)</span>
            <input
              type="number" min={0} value={goal}
              onChange={(e) => { setGoal(e.target.value); setNameSaved(false); }}
              placeholder="e.g. 10000"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Button type="submit" variant="gradient" disabled={savingName || name.trim().length < 2}>
            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : nameSaved ? <Check className="h-4 w-4" /> : null}
            {nameSaved ? "Saved" : "Save"}
          </Button>
        </form>
      </Card>

      {/* Web-to-lead form */}
      <Card className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Web-to-lead form</h2>
        </div>
        <p className="text-sm text-muted-foreground">Share this link (or embed it) — anyone who submits becomes a new contact in your CRM.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm">{formUrl}</code>
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(formUrl); toast.success("Link copied"); }}><Copy className="h-4 w-4" /> Copy</Button>
          <a href={formUrl} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" /> Open</Button></a>
        </div>
      </Card>

      {/* Custom fields */}
      <CustomFieldsSection />

      {/* Email sending */}
      <Card className="p-6">
        <div className="mb-1 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Email sending</h2>
        </div>
        <p className="text-sm text-muted-foreground">Connect your Gmail so outreach emails are sent from your own address.</p>

        {gmailStatus === "connected" && <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Gmail connected.</p>}
        {gmailStatus === "denied" && <p className="mt-3 text-sm font-medium text-amber-600">You declined the Google permission.</p>}
        {gmailStatus === "error" && <p className="mt-3 text-sm font-medium text-destructive">Something went wrong connecting Gmail. Try again.</p>}
        {gmailStatus === "unconfigured" && <p className="mt-3 text-sm font-medium text-amber-600">Gmail connect isn’t set up by the admin yet.</p>}

        <div className="mt-4">
          {!googleConfigured ? (
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              Gmail connect isn’t configured. An admin needs to add <code className="rounded bg-card px-1">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="rounded bg-card px-1">GOOGLE_CLIENT_SECRET</code> to the environment. Until then, emails use the system mailer.
            </div>
          ) : gmail ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm"><Mail className="h-4 w-4" /></span>
                <div>
                  <div className="text-sm font-semibold text-emerald-800">{gmail.email}</div>
                  <div className="text-xs text-emerald-700/80">Outreach sends from this address.</div>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectGmail} disabled={disconnecting}>
                {disconnecting && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
              </Button>
            </div>
          ) : (
            <a href="/api/google/connect" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold shadow-soft transition hover:bg-secondary">
              <Mail className="h-4 w-4" /> Connect Gmail
            </a>
          )}
        </div>
      </Card>

    </div>
  );
}

type FieldDef = { key?: string; label: string };

function CustomFieldsSection() {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/app/custom-fields")
      .then((r) => r.json())
      .then((d) => setFields(d.defs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(i: number, label: string) { setFields((f) => f.map((x, j) => (j === i ? { ...x, label } : x))); setSaved(false); }
  function remove(i: number) { setFields((f) => f.filter((_, j) => j !== i)); setSaved(false); }
  function add() { setFields((f) => [...f, { label: "" }]); setSaved(false); }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/app/custom-fields", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defs: fields.filter((f) => f.label.trim()) }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Couldn’t save custom fields."); return; }
    setSaved(true);
    toast.success("Custom fields saved.");
  }

  return (
    <Card className="p-6">
      <div className="mb-1 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Custom fields</h2>
      </div>
      <p className="text-sm text-muted-foreground">Add your own fields to every lead (e.g. “Cuisine”, “Franchise?”). They appear on each lead’s page.</p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="mt-4 space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={f.label}
                onChange={(e) => update(i, e.target.value)}
                placeholder="Field name"
                className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button onClick={() => remove(i)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-rose-600" title="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <button onClick={add} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <Plus className="h-4 w-4" /> Add field
            </button>
            <Button variant="gradient" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saved ? "Saved" : "Save fields"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
