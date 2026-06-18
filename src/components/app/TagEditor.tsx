"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag as TagIcon, X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Tag { id: string; name: string; color: string; count?: number }

/** Inline tag chips + add/create popover for a company or contact. */
export function TagEditor({
  apiBase,
  tags,
  recordQueryKey,
}: {
  apiBase: string;
  tags: Tag[];
  recordQueryKey: readonly unknown[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data: all = [] } = useQuery({ queryKey: ["tags"], queryFn: () => api<Tag[]>("/api/app/tags"), enabled: open });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: recordQueryKey });
    qc.invalidateQueries({ queryKey: ["tags"] });
  };

  const attach = useMutation({
    mutationFn: (body: { tagId?: string; name?: string }) =>
      api(`${apiBase}/tags`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { setQ(""); invalidate(); },
  });
  const detach = useMutation({
    mutationFn: (tagId: string) => api(`${apiBase}/tags?tagId=${tagId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const have = new Set(tags.map((t) => t.id));
  const candidates = all.filter((t) => !have.has(t.id) && t.name.toLowerCase().includes(q.toLowerCase()));
  const exact = all.some((t) => t.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${t.color}1a`, color: t.color }}>
          {t.name}
          <button onClick={() => detach.mutate(t.id)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${t.name}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
      >
        <TagIcon className="h-3 w-3" /> Tag
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1.5 w-60 rounded-xl border border-border bg-card p-2 shadow-xl">
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Find or create a tag…"
              className="mb-1.5 h-8 w-full rounded-lg border border-input bg-card px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="max-h-48 overflow-y-auto">
              {candidates.map((t) => (
                <button key={t.id} onClick={() => attach.mutate({ tagId: t.id })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="flex-1 truncate">{t.name}</span>
                  {t.count != null && <span className="text-xs text-muted-foreground">{t.count}</span>}
                </button>
              ))}
              {q.trim() && !exact && (
                <button onClick={() => attach.mutate({ name: q.trim() })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-primary/10">
                  <Plus className="h-3.5 w-3.5" /> Create “{q.trim()}”
                </button>
              )}
              {!candidates.length && !q.trim() && <p className="px-2 py-2 text-xs text-muted-foreground">Type to find or create a tag.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Read-only tag chips for list rows. */
export function TagChips({ tags }: { tags: { id: string; name: string; color: string }[] }) {
  if (!tags.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((t) => (
        <span key={t.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${t.color}1a`, color: t.color }}>
          {t.name}
        </span>
      ))}
      {tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>}
    </span>
  );
}
