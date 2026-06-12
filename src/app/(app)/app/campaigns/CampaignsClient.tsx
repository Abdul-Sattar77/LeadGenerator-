"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Loader2, X, Users, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STATUS_META } from "@/lib/campaignStatus";
import type { CampaignStatus } from "@/lib/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Campaign = {
  id: string; name: string; description: string; status: string;
  leadCount: number; wonCount: number; wonValue: number; createdAt: string;
};

function fmtMoney(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function CampaignsClient({ initial }: { initial: Campaign[] }) {
  const [showNew, setShowNew] = useState(false);
  const { data: campaigns = initial } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await (await fetch("/api/app/campaigns")).json()).campaigns as Campaign[],
    initialData: initial,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">Group leads into outreach campaigns and track results.</p>
        </div>
        <Button variant="gradient" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create a campaign like “Karachi Dentists” and add leads to it."
            action={<Button variant="gradient" size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New campaign</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c, i) => {
            const meta = CAMPAIGN_STATUS_META[c.status as CampaignStatus] ?? CAMPAIGN_STATUS_META.DRAFT;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <Link href={`/app/campaigns/${c.id}`}>
                  <Card className="card-lift flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                        <Megaphone className="h-5 w-5" />
                      </span>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", meta.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />{meta.label}
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold leading-tight">{c.name}</h3>
                    {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{c.leadCount}</span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Trophy className="h-4 w-4" />{c.wonCount}</span>
                      {c.wonValue > 0 && <span className="ml-auto font-semibold text-emerald-600">{fmtMoney(c.wonValue)}</span>}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {showNew && <NewCampaignDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewCampaignDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/app/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campaign");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New campaign</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate(); }} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              placeholder="e.g. Karachi Dentists"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</span>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
