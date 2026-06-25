"use client";

import { motion } from "framer-motion";
import { MapPin, Utensils, Coffee, ShoppingBag, Building2, Phone, Mail, Globe, ShieldCheck, Plus } from "lucide-react";
import { CountUp } from "@/components/app/CountUp";

const EASE = [0.16, 1, 0.3, 1];

// Category pins placed around the map (percent coords).
const PINS = [
  { x: 58, y: 12, icon: Building2, color: "#5E8BFF", delay: 0.5 },
  { x: 34, y: 22, icon: Utensils, color: "#9E5CFF", delay: 0.7 },
  { x: 78, y: 30, icon: ShoppingBag, color: "#22c55e", delay: 0.9 },
  { x: 24, y: 50, icon: Coffee, color: "#f59e0b", delay: 1.1 },
];

function Pin({ x, y, icon: Icon, color, delay }) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, y: -16, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: EASE }}
    >
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white/20"
          style={{ background: color, boxShadow: `0 6px 24px ${color}66` }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mx-auto h-3 w-px" style={{ background: `linear-gradient(${color}, transparent)` }} />
      </motion.div>
    </motion.div>
  );
}

export default function HeroMap() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]" style={{ perspective: 1200 }}>
      {/* glow base */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C4CFF]/30 blur-[80px]" />

      {/* tilted grid plane */}
      <motion.div
        className="absolute inset-x-0 top-1/2 mx-auto h-[78%] w-[88%] -translate-y-1/2 rounded-3xl"
        style={{
          transform: "rotateX(58deg) rotateZ(0deg)",
          transformStyle: "preserve-3d",
          backgroundImage:
            "linear-gradient(rgba(124,108,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(124,108,255,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 72%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* routes (animated flowing lines from center to pins) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#6C4CFF" /><stop offset="1" stopColor="#5E8BFF" />
          </linearGradient>
        </defs>
        {[[58, 12], [34, 22], [78, 30], [24, 50]].map(([x, y], i) => (
          <motion.path
            key={i}
            d={`M 50 56 C ${(50 + x) / 2} ${(56 + y) / 2 + 6}, ${x} ${y + 10}, ${x} ${y}`}
            stroke="url(#route)" strokeWidth="0.5" strokeLinecap="round" fill="none"
            strokeDasharray="2 3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7, strokeDashoffset: [0, -10] }}
            transition={{ pathLength: { delay: 0.4 + i * 0.15, duration: 0.8, ease: EASE }, opacity: { delay: 0.4 + i * 0.15, duration: 0.5 }, strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" } }}
          />
        ))}
      </svg>

      {/* central pin + pulsing rings */}
      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-full">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute left-1/2 top-full h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#9E5CFF]/40"
            animate={{ scale: [0.5, 2.2], opacity: [0.6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i }} />
        ))}
        <motion.div initial={{ opacity: 0, y: -20, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3, duration: 0.7, ease: EASE }}>
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6C4CFF] to-[#9E5CFF]">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {PINS.map((p, i) => <Pin key={i} {...p} />)}

      {/* floating "Verified Lead" business card */}
      <motion.div
        className="absolute -right-2 top-[44%] w-60 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, x: 24, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.2, duration: 0.7, ease: EASE }}
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /> Verified Lead</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4CFF] to-[#9E5CFF] text-white"><Utensils className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">Al Rafay Restaurant</div>
              <div className="text-xs text-white/50">Restaurant · Karachi</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {[Phone, Mail, Globe].map((Icon, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70"><Icon className="h-3.5 w-3.5" /></span>
            ))}
            <button className="ml-auto inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#6C4CFF] to-[#9E5CFF] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* floating metric chips */}
      <Metric className="-left-2 top-[20%]" value={2543} label="Leads" color="#9E5CFF" delay={1.4} />
      <Metric className="bottom-[12%] left-[10%]" value={1873} label="Emails" color="#5E8BFF" delay={1.6} />
      <Metric className="bottom-[20%] right-[6%]" value={1254} label="Businesses" color="#6C4CFF" delay={1.8} />
    </div>
  );
}

function Metric({ className, value, label, color, delay }) {
  return (
    <motion.div
      className={`absolute ${className} rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 shadow-xl backdrop-blur-xl`}
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.6, ease: EASE }}
    >
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}>
        <div className="text-lg font-bold tabular-nums text-white">+<CountUp value={value} /></div>
        <div className="text-[11px] font-medium" style={{ color }}>{label}</div>
      </motion.div>
    </motion.div>
  );
}
