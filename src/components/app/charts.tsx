"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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

/** Modern interactive multi-series line chart — drag/hover a crosshair to read values. */
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

  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  const x = (i: number) => (n <= 1 ? pad.l + innerW / 2 : pad.l + (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  // Map a pointer position to the nearest data index (works with viewBox scaling).
  function track(clientX: number) {
    const el = wrapRef.current;
    if (!el || n === 0) return;
    const rect = el.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x(i) - vx);
      if (d < bestD) { bestD = d; best = i; }
    }
    setActive(best);
  }

  return (
    <div className="relative w-full select-none" ref={wrapRef}>
      {/* Tooltip */}
      {active != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(active) / W) * 100}%`, top: 0 }}
        >
          <div className="mb-1 font-semibold text-foreground">{data[active]?.label}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="ml-auto font-semibold tabular-nums">{Number(data[active]?.[s.key]) || 0}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        style={{ height }}
        preserveAspectRatio="none"
        onPointerMove={(e) => track(e.clientX)}
        onPointerDown={(e) => track(e.clientX)}
        onPointerLeave={() => setActive(null)}
      >
        {gridVals.map((gv) => (
          <g key={gv}>
            <line x1={pad.l} x2={W - pad.r} y1={y(gv)} y2={y(gv)} className="stroke-border" strokeWidth={1} strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(gv) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9 }}>{gv}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>{d.label}</text>
        ))}

        {/* Crosshair */}
        {active != null && (
          <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + innerH} className="stroke-primary/40" strokeWidth={1.5} strokeDasharray="4 3" />
        )}

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
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(Number(d[s.key]) || 0)}
                  r={active === i ? 5 : 3}
                  fill="white"
                  stroke={s.color}
                  strokeWidth={2}
                  className="transition-all"
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

/** Interactive animated SVG donut — hover/drag a slice to highlight it. */
export function DonutChart({ data, unit = "", size = 168 }: { data: DonutDatum[]; unit?: string; size?: number }) {
  const [active, setActive] = useState<number | null>(null);
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

  const focus = active != null ? segs[active] : null;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }} onPointerLeave={() => setActive(null)}>
        <svg width={size} height={size} className="-rotate-90 overflow-visible">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-secondary/70" />
          {segs.map((s, i) => {
            const dim = active != null && active !== i;
            return (
              <g key={s.label}>
                <motion.circle
                  cx={cx} cy={cx} r={r} fill="none" stroke={s.color}
                  strokeLinecap="round"
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  initial={{ strokeDashoffset: c }}
                  whileInView={{ strokeDashoffset: -((s.rot / 360) * c) }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
                  animate={{ strokeWidth: active === i ? stroke + 6 : stroke, opacity: dim ? 0.4 : 1 }}
                />
                {/* wide invisible hit-area for easy hovering */}
                <circle
                  cx={cx} cy={cx} r={r} fill="none" stroke="transparent" strokeWidth={stroke + 14}
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-((s.rot / 360) * c)}
                  className="cursor-pointer"
                  onPointerEnter={() => setActive(i)}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {focus ? (
            <>
              <span className="text-2xl font-bold tabular-nums" style={{ color: focus.color }}>{focus.value}</span>
              <span className="max-w-[80%] truncate text-xs text-muted-foreground">{focus.label} · {total ? Math.round((focus.value / total) * 100) : 0}%</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold tabular-nums">{total}</span>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </>
          )}
        </div>
      </div>
      <ul className="flex-1 space-y-1">
        {segs.map((d, i) => (
          <li
            key={d.label}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors", active === i ? "bg-secondary" : "")}
          >
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
