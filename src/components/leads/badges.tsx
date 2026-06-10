import { cn } from "@/lib/utils";
import { LEAD_STATUS_META } from "@/lib/leadStatus";
import type { LeadStatus } from "@/lib/enums";

export function StatusBadge({ status }: { status: string }) {
  const meta = LEAD_STATUS_META[status as LeadStatus] ?? LEAD_STATUS_META.NEW;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        meta.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : score >= 40
        ? "bg-amber-100 text-amber-700 ring-amber-200"
        : "bg-rose-100 text-rose-700 ring-rose-200";
  return (
    <span
      className={cn(
        "inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-bold ring-1 ring-inset",
        tone
      )}
      title={`Lead score: ${score}/100`}
    >
      {score}
    </span>
  );
}
