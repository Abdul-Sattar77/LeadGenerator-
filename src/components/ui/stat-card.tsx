"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "indigo" | "emerald" | "amber" | "sky" | "violet" | "rose";

const TONE: Record<Tone, { chip: string; glow: string }> = {
  indigo: { chip: "from-indigo-500 to-violet-500", glow: "bg-indigo-300/30" },
  emerald: { chip: "from-emerald-500 to-teal-500", glow: "bg-emerald-300/30" },
  amber: { chip: "from-amber-500 to-orange-500", glow: "bg-amber-300/30" },
  sky: { chip: "from-sky-500 to-blue-500", glow: "bg-sky-300/30" },
  violet: { chip: "from-violet-500 to-fuchsia-500", glow: "bg-violet-300/30" },
  rose: { chip: "from-rose-500 to-pink-500", glow: "bg-rose-300/30" },
};

export function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
  hint,
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode; // pass a rendered icon, e.g. <Users className="h-5 w-5" />
  tone?: Tone;
  hint?: string;
  index?: number;
}) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="card-lift relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-5 shadow-premium backdrop-blur"
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl", t.glow)} />
      <div className="relative flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", t.chip)}>
          {icon}
        </span>
        {hint && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{hint}</span>}
      </div>
      <div className="relative mt-4 text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="relative mt-0.5 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
