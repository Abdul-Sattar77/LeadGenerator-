import type { LeadStatus } from "@/lib/enums";

// Display metadata for each CRM lead status (label + Tailwind badge classes).
export const LEAD_STATUS_META: Record<LeadStatus, { label: string; badge: string; dot: string }> = {
  NEW: { label: "New", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
  CONTACTED: { label: "Contacted", badge: "bg-blue-100 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  QUALIFIED: { label: "Qualified", badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  INTERESTED: { label: "Interested", badge: "bg-amber-100 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  PROPOSAL_SENT: { label: "Proposal Sent", badge: "bg-violet-100 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  NEGOTIATION: { label: "Negotiation", badge: "bg-pink-100 text-pink-700 ring-pink-200", dot: "bg-pink-500" },
  WON: { label: "Won", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  LOST: { label: "Lost", badge: "bg-rose-100 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
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
};
