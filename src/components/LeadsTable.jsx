"use client";

import { useEffect, useState } from "react";
import {
  Star,
  Globe,
  MapPin,
  Phone,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { cn, prettyCategory } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { leadKey } from "@/lib/crm";
import { fetchLeads, saveLead, deleteLead } from "@/lib/leadsApi";
import PriorityBadge from "@/components/PriorityBadge";

function Stars({ rating }) {
  if (rating == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
      {initials}
    </span>
  );
}

export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-4 border-b border-border bg-secondary/50 px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto h-4 w-24" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeadsTable({ leads, onSaveChange }) {
  const [savedIds, setSavedIds] = useState(new Set());

  // Load which of these leads are already saved (by key) from the database.
  useEffect(() => {
    let active = true;
    fetchLeads()
      .then((saved) => {
        if (active) setSavedIds(new Set(saved.map((l) => l.key)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [leads]);

  async function handleSave(lead) {
    const key = leadKey(lead);
    const willSave = !savedIds.has(key);

    // Optimistic UI update, then persist to the database.
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(key);
      else next.delete(key);
      return next;
    });

    try {
      if (willSave) await saveLead(lead);
      else await deleteLead(key);
      onSaveChange?.();
    } catch {
      // Revert on failure.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(key);
        else next.add(key);
        return next;
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="scroll-area overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Links</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 text-right font-medium">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead, i) => {
              const saved = savedIds.has(leadKey(lead));
              return (
                <tr
                  key={leadKey(lead) + i}
                  className="group transition-colors hover:bg-accent/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {lead.name || "—"}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          {lead.category && (
                            <Badge variant="default">
                              {prettyCategory(lead.category)}
                            </Badge>
                          )}
                          {lead.reviews != null && (
                            <span className="text-xs text-muted-foreground">
                              {lead.reviews.toLocaleString()} reviews
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PriorityBadge lead={lead} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Stars rating={lead.rating} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          title="Website"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      ) : null}
                      {lead.maps ? (
                        <a
                          href={lead.maps}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Google Maps"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      ) : null}
                      {!lead.website && !lead.maps && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="max-w-[260px] text-xs text-muted-foreground">
                      {lead.address || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleSave(lead)}
                      title={saved ? "Remove from saved" : "Save lead"}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                        saved
                          ? "border-primary bg-accent text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      )}
                    >
                      <Bookmark
                        className={cn("h-4 w-4", saved && "fill-current")}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
