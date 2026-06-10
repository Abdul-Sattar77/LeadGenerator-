"use client";

import { SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const RATINGS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3.0+" },
  { value: 4, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

const SORTS = [
  { value: "priority", label: "Priority (hot first)" },
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Top rated" },
  { value: "reviews", label: "Most reviewed" },
];

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm"
    >
      <span className="text-foreground">{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export default function Filters({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Filters</h3>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Minimum rating
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => set({ minRating: r.value })}
                className={cn(
                  "flex items-center justify-center gap-0.5 rounded-lg border py-1.5 text-xs font-medium transition-colors",
                  value.minRating === r.value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {r.value > 0 && <Star className="h-3 w-3 fill-current" />}
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sort by
          </p>
          <div className="space-y-1.5">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set({ sortBy: s.value })}
                className={cn(
                  "w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                  value.sortBy === s.value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <Toggle
            checked={value.hasWebsite}
            onChange={(v) => set({ hasWebsite: v })}
            label="Has website"
          />
          <Toggle
            checked={value.hasPhone}
            onChange={(v) => set({ hasPhone: v })}
            label="Has phone number"
          />
        </div>
      </div>
    </Card>
  );
}
