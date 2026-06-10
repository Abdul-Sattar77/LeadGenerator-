"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, RotateCcw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_FIELDS, PRIORITIES } from "@/lib/crm";
import { usePriority } from "@/components/PriorityProvider";
import PriorityBadge from "@/components/PriorityBadge";

const TIER_ORDER = ["high", "medium", "low"]; // green, orange, red

const SAMPLE_LEADS = [
  { name: "Joe's Corner Cafe", category: "cafe", reviews: 18, website: "" },
  { name: "CityGym (multiple branches)", category: "gym", reviews: 240, website: "" },
  { name: "KFC", category: "fast_food_restaurant", reviews: 1069, website: "https://kfc.com" },
];

const selectCls =
  "h-10 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function operatorsFor(fieldKey) {
  return PRIORITY_FIELDS.find((f) => f.key === fieldKey)?.operators || [];
}
function typeFor(fieldKey) {
  return PRIORITY_FIELDS.find((f) => f.key === fieldKey)?.type || "text";
}

export default function PrioritiesPage() {
  const { config, setConfig, reset } = usePriority();
  const rules = config.rules || [];

  function commit(nextRules, nextDefault = config.defaultTier) {
    setConfig({ rules: nextRules, defaultTier: nextDefault });
  }

  function updateRule(index, patch) {
    const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    commit(next);
  }

  function changeField(index, fieldKey) {
    const ops = operatorsFor(fieldKey);
    updateRule(index, {
      field: fieldKey,
      op: ops[0]?.key,
      value: typeFor(fieldKey) === "number" ? 0 : "",
    });
  }

  function addRule() {
    commit([...rules, { field: "website", op: "missing", value: "", tier: "high" }]);
  }

  function removeRule(index) {
    commit(rules.filter((_, i) => i !== index));
  }

  function move(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[index], next[j]] = [next[j], next[index]];
    commit(next);
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Priority rules</h1>
        <p className="mt-1 text-muted-foreground">
          Decide what makes a lead hot for <em>you</em>. Rules are checked top to
          bottom — the first one that matches sets the lead&apos;s color.
        </p>
      </div>

      {/* Legend */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
          <Info className="h-4 w-4 text-primary" />
          {TIER_ORDER.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className={cn("h-3 w-3 rounded-full", PRIORITIES[t].bar)} />
              <span className="font-medium">{PRIORITIES[t].label}</span>
            </span>
          ))}
          <span className="text-muted-foreground">
            Lists show green on top, then orange, then red.
          </span>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Your rules</CardTitle>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Reset to defaults
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No rules yet. Add one below, or every lead falls to the default.
            </p>
          )}

          {rules.map((rule, i) => {
            const isBool = typeFor(rule.field) === "boolean";
            const isNum = typeFor(rule.field) === "number";
            return (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3"
              >
                <span className="text-sm font-medium text-muted-foreground">If</span>

                <select
                  value={rule.field}
                  onChange={(e) => changeField(i, e.target.value)}
                  className={selectCls}
                >
                  {PRIORITY_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={rule.op}
                  onChange={(e) => updateRule(i, { op: e.target.value })}
                  className={selectCls}
                >
                  {operatorsFor(rule.field).map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>

                {!isBool && (
                  <input
                    type={isNum ? "number" : "text"}
                    value={rule.value}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    placeholder={isNum ? "0" : "e.g. restaurant"}
                    className={cn(selectCls, "w-28")}
                  />
                )}

                <span className="text-sm font-medium text-muted-foreground">→</span>

                {/* Tier picker: green / orange / red */}
                <div className="flex items-center gap-1">
                  {TIER_ORDER.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateRule(i, { tier: t })}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-semibold ring-1 transition-all",
                        PRIORITIES[t].box,
                        rule.tier === t
                          ? "opacity-100 ring-2"
                          : "opacity-40 hover:opacity-80"
                      )}
                    >
                      {PRIORITIES[t].label}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === rules.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeRule(i)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <Button variant="outline" onClick={addRule} className="w-full">
            <Plus className="h-4 w-4" />
            Add rule
          </Button>

          {/* Default tier */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-sm font-medium">Otherwise, set priority to</span>
            <div className="flex items-center gap-1">
              {TIER_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => commit(rules, t)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold ring-1 transition-all",
                    PRIORITIES[t].box,
                    config.defaultTier === t
                      ? "opacity-100 ring-2"
                      : "opacity-40 hover:opacity-80"
                  )}
                >
                  {PRIORITIES[t].label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Live preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...SAMPLE_LEADS]
            .map((l) => l)
            .map((lead, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{lead.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead.reviews} reviews · {lead.website ? "has website" : "no website"}
                  </div>
                </div>
                <PriorityBadge lead={lead} />
              </div>
            ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Changes save automatically and apply across Search and Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
