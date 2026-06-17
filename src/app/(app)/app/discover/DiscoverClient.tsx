"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Briefcase, MapPin, Loader2, Star, Phone, Globe, Check, Plus,
  AlertTriangle, Compass, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreLead } from "@/lib/scoring";
import { toast } from "@/stores/toastStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/leads/badges";

const COUNTS = [20, 40, 60];

type Result = {
  name: string;
  category?: string;
  phone?: string;
  rating?: number | null;
  reviews?: number | null;
  website?: string;
  address?: string;
  maps?: string;
};

export default function DiscoverClient() {
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [max, setMax] = useState(20);

  const [results, setResults] = useState<Result[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Map of result key -> "saving" | "saved"
  const [saved, setSaved] = useState<Record<string, "saving" | "saved">>({});
  const [savingAll, setSavingAll] = useState(false);

  const keyOf = (r: Result) => `${r.name}|${r.address ?? ""}`.toLowerCase();

  const runSearch = useCallback(async () => {
    const w = what.trim();
    const loc = where.trim();
    const q = w && loc ? `${w} in ${loc}` : w || loc;
    if (!q) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setQuery(q);
    setSaved({});
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=${max}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results || []);
    } catch (e) {
      setError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [what, where, max]);

  async function saveOne(r: Result) {
    const k = keyOf(r);
    if (saved[k]) return;
    setSaved((s) => ({ ...s, [k]: "saving" }));
    try {
      const res = await fetch("/api/app/discover/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: r.name,
          category: r.category ?? "",
          phone: r.phone ?? "",
          website: r.website ?? "",
          address: r.address ?? "",
          rating: r.rating ?? null,
          reviews: r.reviews ?? null,
          source: "GOOGLE_MAPS",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn’t save this company.");
      setSaved((s) => ({ ...s, [k]: "saved" }));
    } catch (e) {
      setSaved((s) => {
        const next = { ...s };
        delete next[k];
        return next;
      });
      toast.error((e as Error).message); // e.g. plan lead-limit reached
      throw e; // let saveAll stop on limit errors
    }
  }

  async function saveAll() {
    setSavingAll(true);
    try {
      for (const r of results) {
        // eslint-disable-next-line no-await-in-loop
        await saveOne(r); // throws on error (e.g. plan limit) — stop the batch
      }
      toast.success("Saved to CRM.");
    } catch {
      /* saveOne already surfaced the error toast */
    } finally {
      setSavingAll(false);
    }
  }

  const savedCount = Object.values(saved).filter((v) => v === "saved").length;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Discover leads</h1>
        <p className="mt-1 text-muted-foreground">Search Google Maps and save businesses straight into your CRM.</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-indigo-300/20 via-fuchsia-300/20 to-sky-300/20 blur-2xl" />
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          className="flex flex-col gap-2.5 rounded-2xl border border-white/70 bg-white/85 p-2.5 shadow-premium backdrop-blur sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2.5 px-3 sm:border-r sm:border-border">
            <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Business type — e.g. Dentists"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex flex-1 items-center gap-2.5 px-3">
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Location — e.g. Karachi"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={max} onChange={(e) => setMax(Number(e.target.value))}
            className="h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {COUNTS.map((c) => <option key={c} value={c}>{c} leads</option>)}
          </select>
          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Search
          </Button>
        </form>
      </div>

      {/* Results header */}
      {searched && !loading && !error && results.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span> results for “{query}”
            {savedCount > 0 && <span className="ml-2 text-emerald-600">· {savedCount} saved</span>}
          </p>
          <Button variant="outline" onClick={saveAll} disabled={savingAll || savedCount === results.length}>
            {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save all to CRM
          </Button>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="skeleton mt-3 h-4 w-32" />
              <div className="skeleton mt-2 h-3 w-24" />
              <div className="skeleton mt-4 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="p-2">
          <EmptyState icon={AlertTriangle} title="Search failed" description={error} />
        </Card>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <Card className="p-2">
          <EmptyState icon={Search} title="No results" description="Try a broader area — e.g. “Restaurants in Karachi”." />
        </Card>
      )}

      {!searched && (
        <Card className="p-2">
          <EmptyState
            icon={Compass}
            title="Find your next customers"
            description="Enter a business type and a city above to pull verified leads from Google Maps."
          />
        </Card>
      )}

      {/* Results grid */}
      {!loading && !error && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => {
            const k = keyOf(r);
            const state = saved[k];
            const { score } = scoreLead({ website: r.website, rating: r.rating, reviews: r.reviews, industry: r.category });
            return (
              <motion.div
                key={k + i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.25) }}
              >
                <Card className="card-lift flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={r.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold leading-tight">{r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.category || "Business"}</div>
                    </div>
                    <ScoreBadge score={score} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {r.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {r.phone}</div>}
                    {r.website && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> <span className="truncate">{r.website}</span></div>}
                    {r.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-1">{r.address}</span></div>}
                    {r.rating != null && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">{r.rating}</span>
                        {r.reviews != null && <span>({r.reviews})</span>}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <Button
                      variant={state === "saved" ? "outline" : "gradient"}
                      className={cn("w-full", state === "saved" && "border-emerald-200 bg-emerald-50 text-emerald-700")}
                      onClick={() => saveOne(r)}
                      disabled={!!state}
                    >
                      {state === "saving" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : state === "saved" ? (
                        <><Check className="h-4 w-4" /> Saved to CRM</>
                      ) : (
                        <><Plus className="h-4 w-4" /> Save to CRM</>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {savedCount > 0 && (
        <div className="flex justify-center">
          <Link href="/app/companies">
            <Button variant="ghost">View {savedCount} saved in Companies <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}
    </div>
  );
}
