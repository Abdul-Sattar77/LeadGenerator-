"use client";

import { useState } from "react";
import { MailWarning, Loader2, X, Check } from "lucide-react";

// Non-blocking banner shown to logged-in users who haven't verified their email.
export function VerifyBanner() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  async function resend() {
    setState("sending");
    await fetch("/api/app/verify-resend", { method: "POST" });
    setState("sent");
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
      <MailWarning className="h-4 w-4 shrink-0 text-amber-600" />
      <span className="flex-1">Please verify your email to secure your account.</span>
      {state === "sent" ? (
        <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><Check className="h-4 w-4" /> Sent — check your inbox</span>
      ) : (
        <button onClick={resend} disabled={state === "sending"} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700 disabled:opacity-60">
          {state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Resend link
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="rounded p-1 text-amber-600 hover:bg-amber-100" aria-label="Dismiss"><X className="h-4 w-4" /></button>
    </div>
  );
}
