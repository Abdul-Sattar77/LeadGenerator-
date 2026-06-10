"use client";

import { Flame, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePriority } from "@/components/PriorityProvider";

const ICONS = { high: Flame, medium: TrendingUp, low: Building2 };

// A colored "box" showing a lead's outreach priority, based on the user's rules.
export default function PriorityBadge({ lead, showLabel = true, className }) {
  const { priorityOf } = usePriority();
  const p = priorityOf(lead);
  const Icon = ICONS[p.tier];
  return (
    <span
      title={p.reason}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
        p.box,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {showLabel && `${p.label} priority`}
    </span>
  );
}
