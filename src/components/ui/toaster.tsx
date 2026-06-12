"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type Toast } from "@/stores/toastStore";

const STYLE = {
  success: { icon: CheckCircle2, ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", iconColor: "text-emerald-600" },
  error: { icon: AlertTriangle, ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-800", iconColor: "text-rose-600" },
  info: { icon: Info, ring: "ring-sky-200", bg: "bg-sky-50", text: "text-sky-800", iconColor: "text-sky-600" },
};

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const s = STYLE[t.type];
  const Icon = s.icon;
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), 4500);
    return () => clearTimeout(timer);
  }, [t.id, dismiss]);

  return (
    <div className={cn("pointer-events-auto flex w-80 items-start gap-3 rounded-xl px-4 py-3 shadow-card ring-1 ring-inset backdrop-blur", s.bg, s.ring)}>
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.iconColor)} />
      <p className={cn("flex-1 text-sm font-medium", s.text)}>{t.message}</p>
      <button onClick={() => dismiss(t.id)} className={cn("shrink-0 rounded p-0.5 opacity-60 hover:opacity-100", s.text)} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
