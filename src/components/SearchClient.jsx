"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Phone,
  Globe,
  Star,
  SearchX,
  AlertTriangle,
  Bookmark,
} from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import LeadsTable, { TableSkeleton } from "@/components/LeadsTable";
import ExportButton from "@/components/ExportButton";
import { Card } from "@/components/ui/card";
import { addHistory } from "@/lib/storage";
import { PRIORITY_RANK } from "@/lib/crm";
import { usePriority } from "@/components/PriorityProvider";

const DEFAULT_FILTERS = {
  minRating: 0,
  sortBy: "priority",
  hasWebsite: false,
  hasPhone: false,
};

function splitQuery(q) {
  if (!q) return { what: "", where: "" };
  const idx = q.toLowerCase().lastIndexOf(" in ");
  if (idx > 0) return { what: q.slice(0, idx), where: q.slice(idx + 4) };
  return { what: q, where: "" };
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <div>
        <div className="text-xl font-bold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

export default function SearchClient() {
  const params = useSearchParams();
  const { priorityOf } = usePriority();
  const initialQ = params.get("q") || "";
  const initialMax = Number(params.get("max")) || 20;
  const initial = splitQuery(initialQ);

  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const runSearch = useCallback(async (q, max) => {
    setLoading(true);
    setError("");
    setHasSearched(true);
    setQuery(q);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&max=${max}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const found = data.results || [];
      setLeads(found);
      addHistory(q, found.length);
    } catch (e) {
      setError(e.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-run when arriving with a ?q= in the URL (e.g. from the landing hero).
  useEffect(() => {
    if (initialQ) runSearch(initialQ, initialMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let out = leads.filter((l) => {
      if (filters.minRating && (l.rating || 0) < filters.minRating) return false;
      if (filters.hasWebsite && !l.website) return false;
      if (filters.hasPhone && !l.phone) return false;
      return true;
    });
    if (filters.sortBy === "priority") {
      // green (high) first, then orange, then red
      out = [...out].sort(
        (a, b) =>
          PRIORITY_RANK[priorityOf(a).tier] - PRIORITY_RANK[priorityOf(b).tier]
      );
    } else if (filters.sortBy === "rating") {
      out = [...out].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === "reviews") {
      out = [...out].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }
    return out;
  }, [leads, filters, priorityOf]);

  const stats = useMemo(() => {
    const rated = leads.filter((l) => l.rating != null);
    const avg = rated.length
      ? (rated.reduce((s, l) => s + l.rating, 0) / rated.length).toFixed(1)
      : "—";
    return {
      total: leads.length,
      withPhone: leads.filter((l) => l.phone).length,
      withWebsite: leads.filter((l) => l.website).length,
      avg,
    };
  }, [leads]);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Find Leads
        </h1>
        <p className="mt-1 text-muted-foreground">
          Search any business type and location, then filter and export.
        </p>
      </div>

      <SearchBar
        onSubmit={runSearch}
        loading={loading}
        defaultWhat={initial.what}
        defaultWhere={initial.where}
        defaultMax={initialMax}
      />

      {/* Stats */}
      {hasSearched && !error && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Total leads" value={stats.total} />
          <StatCard icon={Phone} label="With phone" value={stats.withPhone} />
          <StatCard icon={Globe} label="With website" value={stats.withWebsite} />
          <StatCard icon={Star} label="Avg rating" value={stats.avg} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className={hasSearched ? "" : "hidden lg:block"}>
          <Filters value={filters} onChange={setFilters} />
        </aside>

        {/* Results */}
        <div className="min-w-0">
          {loading && <TableSkeleton />}

          {!loading && error && (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </span>
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            </Card>
          )}

          {!loading && !error && hasSearched && filtered.length === 0 && (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </span>
              <h3 className="text-lg font-semibold">No matching leads</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                {leads.length
                  ? "Try relaxing your filters."
                  : "Try a broader area, e.g. “Restaurants in Karachi”."}
              </p>
            </Card>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                  of {leads.length} leads for{" "}
                  <span className="font-semibold text-foreground">“{query}”</span>
                </p>
                <ExportButton
                  leads={filtered}
                  filename={`leads-${query.replace(/\s+/g, "-").toLowerCase()}.csv`}
                />
              </div>
              <LeadsTable leads={filtered} />
            </div>
          )}

          {!hasSearched && (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-full">
                <Bookmark className="h-6 w-6 text-white" />
              </span>
              <h3 className="text-lg font-semibold">Start your first search</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Enter a business type and a city above — for example{" "}
                <span className="font-medium text-foreground">“Dentists”</span> in{" "}
                <span className="font-medium text-foreground">“Karachi”</span>.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
