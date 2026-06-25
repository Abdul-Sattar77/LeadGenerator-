"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CopyCheck, Loader2, GitMerge, Building2, Contact2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/app/PageHeader";
import { api } from "@/lib/api";
import { toast } from "@/stores/toastStore";

interface Group { key: string; records: { id: string; label: string }[] }
interface Dupes { companies: Group[]; contacts: Group[] }

export default function DuplicatesClient() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["duplicates"], queryFn: () => api<Dupes>("/api/app/duplicates") });

  const merge = useMutation({
    mutationFn: (body: { type: "contact" | "company"; survivorId: string; dupId: string }) =>
      api("/api/app/duplicates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duplicates"] });
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Merged");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Merge failed"),
  });

  async function mergeGroup(type: "contact" | "company", g: Group) {
    const survivorId = g.records[0].id;
    // Merge each later record into the first (kept) one.
    for (const r of g.records.slice(1)) {
      // eslint-disable-next-line no-await-in-loop
      await merge.mutateAsync({ type, survivorId, dupId: r.id });
    }
  }

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const companies = data?.companies ?? [];
  const contacts = data?.contacts ?? [];
  const none = companies.length === 0 && contacts.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Duplicates" subtitle="Companies with the same name, or contacts with the same email. Merge keeps the first record and moves everything else onto it." icon={CopyCheck} />

      {none ? (
        <Card className="p-2"><EmptyState icon={Check} title="No duplicates found" description="Your companies and contacts look clean." /></Card>
      ) : (
        <div className="space-y-6">
          {contacts.length > 0 && (
            <Section title="Duplicate contacts" icon={Contact2} groups={contacts} onMerge={(g) => mergeGroup("contact", g)} busy={merge.isPending} kept="email" />
          )}
          {companies.length > 0 && (
            <Section title="Duplicate companies" icon={Building2} groups={companies} onMerge={(g) => mergeGroup("company", g)} busy={merge.isPending} kept="name" />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, groups, onMerge, busy, kept }: {
  title: string; icon: React.ComponentType<{ className?: string }>; groups: Group[]; onMerge: (g: Group) => void; busy: boolean; kept: string;
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><h2 className="font-semibold">{title} ({groups.length})</h2></div>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.key} className="rounded-xl border border-border p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.key} · {g.records.length} records</div>
            <ul className="space-y-1 text-sm">
              {g.records.map((r, i) => (
                <li key={r.id} className="flex items-center gap-2">
                  <span className={i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>{r.label}</span>
                  {i === 0 && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">keep</span>}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => onMerge(g)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />} Merge {g.records.length - 1} into first
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
