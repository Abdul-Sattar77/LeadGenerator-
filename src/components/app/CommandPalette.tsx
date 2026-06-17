"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import {
  Search, Building2, Contact2, Handshake, Plus, ArrowRight, CornerDownLeft, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, qs } from "@/lib/api";
import type { SearchResults } from "@/server/services/searchService";
import { EASE } from "@/lib/motion";

interface Item {
  key: string;
  label: string;
  sublabel?: string | null;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

const EMPTY: SearchResults = { companies: [], contacts: [], deals: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K toggles the palette anywhere in the app.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpenEvent() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  // Reset when opening.
  useEffect(() => {
    if (open) { setQ(""); setResults(EMPTY); setActive(0); }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults(EMPTY); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api<SearchResults>(`/api/app/search${qs({ q: term })}`);
        setResults(r);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const go = (href: string) => { setOpen(false); router.push(href); };

  const items = useMemo<Item[]>(() => {
    if (!q.trim()) {
      return [
        { key: "go-companies", label: "Go to Companies", group: "Navigate", icon: Building2, run: () => go("/app/companies") },
        { key: "go-contacts", label: "Go to Contacts", group: "Navigate", icon: Contact2, run: () => go("/app/contacts") },
        { key: "go-deals", label: "Go to Deals", group: "Navigate", icon: Handshake, run: () => go("/app/deals") },
        { key: "new-company", label: "New company", group: "Create", icon: Plus, run: () => go("/app/companies?new=1") },
        { key: "new-contact", label: "New contact", group: "Create", icon: Plus, run: () => go("/app/contacts?new=1") },
        { key: "new-deal", label: "New deal", group: "Create", icon: Plus, run: () => go("/app/deals?new=1") },
      ];
    }
    return [
      ...results.companies.map((c) => ({ key: `co-${c.id}`, label: c.name, sublabel: c.subtitle, group: "Companies", icon: Building2, run: () => go(`/app/companies/${c.id}`) })),
      ...results.contacts.map((c) => ({ key: `ct-${c.id}`, label: c.name, sublabel: c.subtitle, group: "Contacts", icon: Contact2, run: () => go(`/app/contacts/${c.id}`) })),
      ...results.deals.map((d) => ({ key: `dl-${d.id}`, label: d.name, sublabel: d.subtitle, group: "Deals", icon: Handshake, run: () => go(`/app/deals/${d.id}`) })),
    ];
  }, [q, results]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setActive(0); }, [items.length]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); items[active]?.run(); }
  }

  // Group items for display while keeping a flat index for keyboard nav.
  let runningIndex = -1;
  const groups = items.reduce<Record<string, Item[]>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
          className="fixed left-1/2 top-[18%] z-50 w-full max-w-xl -translate-x-1/2 px-4 focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search companies, contacts, deals…"
                className="h-13 w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  {q.trim() ? "No matches found." : "Type to search."}
                </div>
              ) : (
                Object.entries(groups).map(([group, groupItems]) => (
                  <div key={group} className="mb-1">
                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</div>
                    {groupItems.map((it) => {
                      runningIndex += 1;
                      const idx = runningIndex;
                      const Icon = it.icon;
                      return (
                        <button
                          key={it.key}
                          onClick={it.run}
                          onMouseEnter={() => setActive(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            idx === active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", idx === active ? "text-primary" : "text-muted-foreground")} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">{it.label}</span>
                            {it.sublabel && <span className="block truncate text-xs text-muted-foreground">{it.sublabel}</span>}
                          </span>
                          {idx === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Navigate & jump to records</span>
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono">↑↓</kbd>
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono">↵</kbd>
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono">esc</kbd>
              </span>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
