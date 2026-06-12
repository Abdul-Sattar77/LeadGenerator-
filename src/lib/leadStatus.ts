import type { LeadStatus } from "@/lib/enums";

// Premium per-stage palette. Each stage gets a distinct soft pastel identity:
//  badge  – pill used in tables
//  dot    – small status dot
//  col    – Kanban column tint (very soft)
//  head   – column header accent text
//  bar    – progress-bar fill
//  ring   – card hover ring
//  grad   – avatar/accent gradient
export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; badge: string; dot: string; col: string; head: string; bar: string; ring: string; grad: string }
> = {
  NEW: {
    label: "New",
    badge: "bg-sky-100 text-sky-700 ring-sky-200",
    dot: "bg-sky-400", col: "bg-sky-50/70", head: "text-sky-700", bar: "bg-sky-400",
    ring: "hover:ring-sky-200", grad: "from-sky-400 to-blue-400",
  },
  CONTACTED: {
    label: "Contacted",
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    dot: "bg-violet-400", col: "bg-violet-50/70", head: "text-violet-700", bar: "bg-violet-400",
    ring: "hover:ring-violet-200", grad: "from-violet-400 to-purple-400",
  },
  QUALIFIED: {
    label: "Qualified",
    badge: "bg-cyan-100 text-cyan-700 ring-cyan-200",
    dot: "bg-cyan-400", col: "bg-cyan-50/70", head: "text-cyan-700", bar: "bg-cyan-400",
    ring: "hover:ring-cyan-200", grad: "from-cyan-400 to-teal-400",
  },
  INTERESTED: {
    label: "Interested",
    badge: "bg-green-100 text-green-700 ring-green-200",
    dot: "bg-green-400", col: "bg-green-50/70", head: "text-green-700", bar: "bg-green-400",
    ring: "hover:ring-green-200", grad: "from-green-400 to-emerald-400",
  },
  PROPOSAL_SENT: {
    label: "Proposal Sent",
    badge: "bg-orange-100 text-orange-700 ring-orange-200",
    dot: "bg-orange-400", col: "bg-orange-50/70", head: "text-orange-700", bar: "bg-orange-400",
    ring: "hover:ring-orange-200", grad: "from-orange-400 to-amber-400",
  },
  NEGOTIATION: {
    label: "Negotiation",
    badge: "bg-pink-100 text-pink-700 ring-pink-200",
    dot: "bg-pink-400", col: "bg-pink-50/70", head: "text-pink-700", bar: "bg-pink-400",
    ring: "hover:ring-pink-200", grad: "from-pink-400 to-rose-400",
  },
  WON: {
    label: "Won",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500", col: "bg-emerald-50/70", head: "text-emerald-700", bar: "bg-emerald-500",
    ring: "hover:ring-emerald-200", grad: "from-emerald-400 to-green-500",
  },
  LOST: {
    label: "Lost",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400", col: "bg-slate-50/80", head: "text-slate-600", bar: "bg-slate-400",
    ring: "hover:ring-slate-200", grad: "from-slate-400 to-slate-500",
  },
};

export function statusLabel(status: string): string {
  return LEAD_STATUS_META[status as LeadStatus]?.label ?? status;
}

// Human label for activity timeline entries.
export const ACTIVITY_LABEL: Record<string, string> = {
  LEAD_CREATED: "Lead created",
  STATUS_CHANGED: "Status changed",
  NOTE_ADDED: "Note added",
  LEAD_ASSIGNED: "Lead assigned",
  LEAD_UPDATED: "Lead updated",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
  EMAIL_SENT: "Email sent",
};
