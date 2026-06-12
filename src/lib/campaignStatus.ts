import type { CampaignStatus } from "@/lib/enums";

export const CAMPAIGN_STATUS_META: Record<CampaignStatus, { label: string; badge: string; dot: string }> = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  RUNNING: { label: "Running", badge: "bg-indigo-100 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};
