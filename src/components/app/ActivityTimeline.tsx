"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  CalendarClock,
  StickyNote,
  ArrowRightLeft,
  CheckCircle2,
  Activity as ActivityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalTime } from "@/components/ui/local-time";
import { EASE } from "@/lib/motion";

export interface TimelineItem {
  id: string;
  kind: "activity" | "note";
  type: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

const META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  CALL: { icon: Phone, label: "Call logged", tone: "text-sky-600 bg-sky-50" },
  EMAIL: { icon: Mail, label: "Email sent", tone: "text-violet-600 bg-violet-50" },
  MEETING: { icon: CalendarClock, label: "Meeting", tone: "text-amber-600 bg-amber-50" },
  NOTE_ADDED: { icon: StickyNote, label: "Note", tone: "text-indigo-600 bg-indigo-50" },
  STAGE_CHANGED: { icon: ArrowRightLeft, label: "Stage changed", tone: "text-fuchsia-600 bg-fuchsia-50" },
  TASK_COMPLETED: { icon: CheckCircle2, label: "Task completed", tone: "text-emerald-600 bg-emerald-50" },
};

function metaFor(type: string) {
  return META[type] ?? { icon: ActivityIcon, label: type.replace(/_/g, " ").toLowerCase(), tone: "text-slate-600 bg-slate-100" };
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ActivityIcon className="mb-2 h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No activity yet. Log a call or add a note to get started.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-1">
      {/* vertical rail */}
      <span className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {items.map((item, i) => {
        const m = metaFor(item.type);
        const Icon = m.icon;
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: Math.min(i * 0.04, 0.4) }}
            className="relative flex gap-3 rounded-lg px-1 py-2"
          >
            <span className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-card", m.tone)}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                {item.userName && <span className="text-xs text-muted-foreground">by {item.userName}</span>}
                <LocalTime iso={item.createdAt} className="ml-auto text-xs text-muted-foreground" />
              </div>
              {item.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>}
              {Boolean(item.metadata?.from && item.metadata?.to) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {String(item.metadata?.from)} → <span className="font-medium text-foreground">{String(item.metadata?.to)}</span>
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
