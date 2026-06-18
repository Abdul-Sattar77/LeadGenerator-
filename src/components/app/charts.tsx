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

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

/** Modern multi-series line chart (animated draw-in, dots, grid, legend). */
export function LineChart({
  data,
  series,
  height = 240,
}: {
  data: Record<string, any>[];
  series: LineSeries[];
  height?: number;
}) {
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 14, t: 16, b: 26 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = data.length;

  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  const x = (i: number) => (n <= 1 ? pad.l + innerW / 2 : pad.l + (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {/* gridlines + y labels */}
        {gridVals.map((gv) => (
          <g key={gv}>
            <line x1={pad.l} x2={W - pad.r} y1={y(gv)} y2={y(gv)} className="stroke-border" strokeWidth={1} strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(gv) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>{gv}</text>
          </g>
        ))}
        {/* x labels */}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>{d.label}</text>
        ))}

        {series.map((s) => {
          const pts = data.map((d, i) => `${x(i)},${y(Number(d[s.key]) || 0)}`).join(" ");
          return (
            <g key={s.key}>
              <motion.polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
              />
              {data.map((d, i) => (
                <motion.circle
                  key={i}
                  cx={x(i)}
                  cy={y(Number(d[s.key]) || 0)}
                  r={3}
                  fill="white"
                  stroke={s.color}
                  strokeWidth={2}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
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
