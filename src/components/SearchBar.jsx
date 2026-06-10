"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const COUNTS = [20, 40, 60];

/**
 * "What / Where" search bar.
 * - If `onSubmit(query, max)` is provided, it calls that (used on /search).
 * - Otherwise it routes to /search?q=...&max=... (used on the landing hero).
 */
export default function SearchBar({
  onSubmit,
  loading = false,
  defaultWhat = "",
  defaultWhere = "",
  defaultMax = 20,
}) {
  const router = useRouter();
  const [what, setWhat] = useState(defaultWhat);
  const [where, setWhere] = useState(defaultWhere);
  const [max, setMax] = useState(defaultMax);

  function buildQuery() {
    const w = what.trim();
    const loc = where.trim();
    if (!w && !loc) return "";
    if (w && loc) return `${w} in ${loc}`;
    return w || loc;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const query = buildQuery();
    if (!query) return;
    if (onSubmit) {
      onSubmit(query, max);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}&max=${max}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-2.5 shadow-card sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3 sm:border-r sm:border-border">
        <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="Business type — e.g. Restaurants"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-1 items-center gap-2.5 rounded-xl px-3">
        <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Location — e.g. Karachi"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <select
        value={max}
        onChange={(e) => setMax(Number(e.target.value))}
        className="h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Number of results"
      >
        {COUNTS.map((c) => (
          <option key={c} value={c}>
            {c} leads
          </option>
        ))}
      </select>

      <Button type="submit" variant="gradient" size="lg" disabled={loading} className="sm:w-auto">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
        Search
      </Button>
    </form>
  );
}
