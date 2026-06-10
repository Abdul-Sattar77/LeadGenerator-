"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, stageMeta } from "@/lib/crm";

// Colored pipeline-stage dropdown. One click opens the menu; picking a
// stage calls onChange(newStage) and closes.
export default function StatusSelect({ value, onChange, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = stageMeta(value);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors",
          meta.badge
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-card">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setOpen(false);
                if (s.key !== value) onChange(s.key);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
                s.key === value && "bg-secondary"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", s.dot)} />
              <span className="flex-1">{s.label}</span>
              {s.key === value && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
