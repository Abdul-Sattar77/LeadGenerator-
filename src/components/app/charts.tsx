"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

function k(n: number): string {
  if (!n) return "0";
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

export interface StageDatum {
  id: string;
  name: string;
  count: number;
  value?: number;
  kind?: string; // OPEN | WON | LOST
}

function barGradient(kind?: string): string {
  if (kind === "WON") return "from-emerald-400 to-emerald-600";
  if (kind === "LOST") return "from-rose-400 to-rose-600";
  return "from-indigo-500 to-violet-500";
}

/** Modern animated horizontal bar funnel (gradient, rounded, count inside). */
export function StageBars({ data, showValue = true, money = false }: { data: StageDatum[]; showValue?: boolean; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.max((d.count / max) * 100, d.count ? 6 : 0);
        return (
          <div key={d.id} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs font-medium text-muted-foreground">{d.name}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-secondary/70">
              <motion.div
                className={`flex h-full items-center justify-end rounded-lg bg-gradient-to-r px-2 shadow-sm ${barGradient(d.kind)}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
              >
                {d.count > 0 && <span className="text-xs font-bold tabular-nums text-white">{d.count}</span>}
              </motion.div>
            </div>
            {showValue && <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">{money ? `$${k(d.value ?? 0)}` : d.count}</span>}
          </div>
        );
      })}
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

/** Modern animated SVG donut with center total + legend. */
export function DonutChart({ data, unit = "", size = 168 }: { data: DonutDatum[]; unit?: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;

  let offset = 0;
  const segs = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const frac = total ? d.value / total : 0;
      const seg = { ...d, frac, dash: frac * c, gap: c - frac * c, rot: (offset / (total || 1)) * 360 };
      offset += d.value;
      return seg;
    });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-secondary/70" />
          {segs.map((s, i) => (
            <motion.circle
              key={s.label}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${s.dash} ${s.gap}`}
              initial={{ strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: -((s.rot / 360) * c) }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {data.filter((d) => d.value > 0).map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
        {!segs.length && <li className="text-sm text-muted-foreground">No data yet.</li>}
      </ul>
    </div>
  );
}
