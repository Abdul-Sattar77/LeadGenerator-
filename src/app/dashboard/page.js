"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  History,
  Trash2,
  Search,
  Star,
  Globe,
  Phone,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ExportButton from "@/components/ExportButton";
import StatusSelect from "@/components/StatusSelect";
import PriorityBadge from "@/components/PriorityBadge";
import { prettyCategory, cn } from "@/lib/utils";
import { leadKey, PRIORITY_RANK } from "@/lib/crm";
import { usePriority } from "@/components/PriorityProvider";
import {
  fetchLeads,
  deleteLead,
  updateLead,
  migrateLocalLeadsOnce,
} from "@/lib/leadsApi";
import { getHistory, clearHistory } from "@/lib/storage";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const { priorityOf } = usePriority();

  // Order leads by priority: green (high) on top, orange, then red.
  const orderedSaved = [...saved].sort(
    (a, b) => PRIORITY_RANK[priorityOf(a).tier] - PRIORITY_RANK[priorityOf(b).tier]
  );

  async function refreshLeads() {
    try {
      setSaved(await fetchLeads());
    } catch {
      setSaved([]);
    }
  }

  useEffect(() => {
    // Import any pre-existing localStorage leads once, then load from the DB.
    (async () => {
      await migrateLocalLeadsOnce();
      await refreshLeads();
    })();
    setHistory(getHistory());
  }, []);

  async function handleRemove(lead) {
    const key = lead.key || leadKey(lead);
    setSaved((prev) => prev.filter((l) => (l.key || leadKey(l)) !== key));
    try {
      await deleteLead(key);
    } catch {
      refreshLeads(); // restore on failure
    }
  }

  // #1 Status pipeline: change a lead's stage and persist it.
  async function handleStageChange(lead, stage) {
    const key = lead.key || leadKey(lead);
    setSaved((prev) =>
      prev.map((l) => ((l.key || leadKey(l)) === key ? { ...l, stage } : l))
    );
    try {
      await updateLead(key, { stage });
    } catch {
      refreshLeads();
    }
  }

  function handleClearHistory() {
    clearHistory();
    setHistory(getHistory());
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Your saved leads and recent searches — stored on this device.
          </p>
        </div>
        <ExportButton leads={saved} filename="saved-leads.csv" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Saved leads */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Saved leads</h2>
            <Badge variant="muted">{saved.length}</Badge>
          </div>

          {saved.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Bookmark className="h-6 w-6 text-muted-foreground" />
              </span>
              <h3 className="text-lg font-semibold">No saved leads yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Run a search and tap the bookmark icon on any lead to save it here.
              </p>
              <Link href="/search">
                <Button variant="gradient" className="mt-1">
                  <Search className="h-4 w-4" />
                  Find leads
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {orderedSaved.map((lead, i) => (
                <Card key={i} className={cn("border-l-4 p-4", priorityOf(lead).border)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{lead.name}</h3>
                      {lead.category && (
                        <Badge className="mt-1">{prettyCategory(lead.category)}</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(lead)}
                      title="Remove"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusSelect
                      value={lead.stage}
                      onChange={(stage) => handleStageChange(lead, stage)}
                    />
                    <PriorityBadge lead={lead} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {lead.rating != null && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">
                          {lead.rating.toFixed(1)}
                        </span>
                        {lead.reviews != null && (
                          <span>({lead.reviews.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {lead.phone}
                      </div>
                    )}
                    {lead.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2">{lead.address}</span>
                      </div>
                    )}
                  </div>

                  {(lead.website || lead.maps) && (
                    <div className="mt-3 flex gap-2">
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                      {lead.maps && (
                        <a
                          href={lead.maps}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <MapPin className="h-3.5 w-3.5" /> Maps
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <aside>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" />
                Recent searches
              </CardTitle>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear
                </button>
              )}
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No searches yet.</p>
              ) : (
                <ul className="space-y-1">
                  {history.map((h, i) => (
                    <li key={i}>
                      <Link
                        href={`/search?q=${encodeURIComponent(h.query)}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-secondary"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{h.query}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {h.count} · {formatDate(h.at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
