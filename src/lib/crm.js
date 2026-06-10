// Shared CRM config — safe to import in BOTH client and server (no Prisma here).
// The pipeline stages, their order, and their colour treatments.

export const STAGES = [
  {
    key: "New",
    label: "New",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
    solid: "bg-slate-500",
    column: "border-slate-300",
  },
  {
    key: "Contacted",
    label: "Contacted",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
    solid: "bg-blue-500",
    column: "border-blue-300",
  },
  {
    key: "Interested",
    label: "Interested",
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    solid: "bg-amber-500",
    column: "border-amber-300",
  },
  {
    key: "Closed Won",
    label: "Closed Won",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    solid: "bg-emerald-500",
    column: "border-emerald-300",
  },
  {
    key: "Closed Lost",
    label: "Closed Lost",
    badge: "bg-rose-100 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    solid: "bg-rose-500",
    column: "border-rose-300",
  },
];

export const STAGE_KEYS = STAGES.map((s) => s.key);
export const DEFAULT_STAGE = "New";

export function stageMeta(key) {
  return STAGES.find((s) => s.key === key) || STAGES[0];
}

// Same identity rule the app has always used: lowercased "name|address".
export function leadKey(lead) {
  return `${lead.name || ""}|${lead.address || ""}`.toLowerCase();
}

// ---------------------------------------------------------------------------
// Lead PRIORITY (outreach opportunity), derived from the data we already have.
// Google gives us website (yes/no) + review count, but NOT a branch count, so
// review count is used as the proxy for "how well-known / multi-branch".
// Green = best opportunity (local, no website), Red = least (big brand w/ site).
// ---------------------------------------------------------------------------
export const PRIORITIES = {
  high: {
    key: "high",
    label: "High",
    box: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    border: "border-l-emerald-500",
    bar: "bg-emerald-500",
  },
  medium: {
    key: "medium",
    label: "Medium",
    box: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    border: "border-l-amber-500",
    bar: "bg-amber-500",
  },
  low: {
    key: "low",
    label: "Low",
    box: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    border: "border-l-rose-500",
    bar: "bg-rose-500",
  },
};

// Display order: green (high) on top, orange (medium) middle, red (low) bottom.
export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// Fields a user can build priority rules on, with their allowed operators.
export const PRIORITY_FIELDS = [
  {
    key: "website",
    label: "Website",
    type: "boolean",
    operators: [
      { key: "missing", label: "is missing" },
      { key: "exists", label: "exists" },
    ],
  },
  {
    key: "reviews",
    label: "Reviews",
    type: "number",
    operators: [
      { key: ">=", label: "≥" },
      { key: "<=", label: "≤" },
      { key: ">", label: ">" },
      { key: "<", label: "<" },
    ],
  },
  {
    key: "rating",
    label: "Rating",
    type: "number",
    operators: [
      { key: ">=", label: "≥" },
      { key: "<=", label: "≤" },
      { key: ">", label: ">" },
      { key: "<", label: "<" },
    ],
  },
  {
    key: "category",
    label: "Category",
    type: "text",
    operators: [
      { key: "contains", label: "contains" },
      { key: "equals", label: "is" },
    ],
  },
];

// Out-of-the-box rules (fully editable by the user). First match wins, top-down.
// Defaults reflect "no website = hot lead (green)".
export const DEFAULT_PRIORITY_CONFIG = {
  rules: [
    { field: "website", op: "missing", value: "", tier: "high" },
    { field: "reviews", op: ">=", value: 300, tier: "low" },
  ],
  defaultTier: "medium",
};

function fieldLabel(key) {
  return PRIORITY_FIELDS.find((f) => f.key === key)?.label || key;
}
function opLabel(field, op) {
  const f = PRIORITY_FIELDS.find((x) => x.key === field);
  return f?.operators.find((o) => o.key === op)?.label || op;
}

function describeRule(rule) {
  const f = PRIORITY_FIELDS.find((x) => x.key === rule.field);
  const valuePart = f?.type === "boolean" ? "" : ` ${rule.value}`;
  return `${fieldLabel(rule.field)} ${opLabel(rule.field, rule.op)}${valuePart}`.trim();
}

function ruleMatches(lead, rule) {
  switch (rule.field) {
    case "website": {
      const has = Boolean(lead?.website);
      return rule.op === "missing" ? !has : has;
    }
    case "reviews":
    case "rating": {
      const n = Number(lead?.[rule.field]) || 0;
      const v = Number(rule.value) || 0;
      if (rule.op === ">=") return n >= v;
      if (rule.op === "<=") return n <= v;
      if (rule.op === ">") return n > v;
      if (rule.op === "<") return n < v;
      return false;
    }
    case "category": {
      const c = String(lead?.category || "").toLowerCase();
      const v = String(rule.value || "").toLowerCase();
      if (!v) return false;
      return rule.op === "equals" ? c === v : c.includes(v);
    }
    default:
      return false;
  }
}

// Evaluate a lead against a user-defined config -> a PRIORITIES tier (+ reason).
export function evaluatePriority(lead, config) {
  const cfg =
    config && Array.isArray(config.rules) ? config : DEFAULT_PRIORITY_CONFIG;
  for (const rule of cfg.rules) {
    if (ruleMatches(lead, rule)) {
      return { ...PRIORITIES[rule.tier], tier: rule.tier, reason: describeRule(rule) };
    }
  }
  const dt = cfg.defaultTier || "medium";
  return { ...PRIORITIES[dt], tier: dt, reason: "No rule matched — default priority" };
}
