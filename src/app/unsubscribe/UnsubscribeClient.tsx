"use client";

import { useState } from "react";
import { Loader2, MailX, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function UnsubscribeClient({ cid, token }: { cid: string; token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function unsubscribe() {
    setState("loading");
    const res = await fetch("/api/track/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, t: token }),
    });
    setState(res.ok ? "done" : "error");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center"><Logo size={32} /></div>
        {state === "done" ? (
          <>
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
            <h1 className="text-lg font-bold">You've been unsubscribed</h1>
            <p className="mt-1 text-sm text-muted-foreground">You won't receive any more emails from us. You can close this page.</p>
          </>
        ) : state === "error" ? (
          <>
            <h1 className="text-lg font-bold">Link invalid or expired</h1>
            <p className="mt-1 text-sm text-muted-foreground">We couldn't process this unsubscribe request. Please use the link from a recent email.</p>
          </>
        ) : (
          <>
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MailX className="h-6 w-6" /></span>
            <h1 className="text-lg font-bold">Unsubscribe from emails?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Click below to stop receiving emails from us.</p>
            <Button onClick={unsubscribe} disabled={state === "loading" || !cid || !token} className="mt-4">
              {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailX className="h-4 w-4" />} Confirm unsubscribe
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
