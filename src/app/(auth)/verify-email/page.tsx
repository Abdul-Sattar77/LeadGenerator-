"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Check, MailWarning } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const email = p.get("email") || "";
    const token = p.get("token") || "";
    if (!email || !token) { setState("error"); setMessage("This verification link is missing or malformed."); return; }
    fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setState("ok");
        else { setState("error"); setMessage(data.error || "Verification failed."); }
      })
      .catch(() => { setState("error"); setMessage("Something went wrong."); });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <Card className="p-8 text-center shadow-premium">
        {state === "loading" ? (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <h1 className="text-xl font-bold">Verifying your email…</h1>
          </>
        ) : state === "ok" ? (
          <>
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your email is confirmed. You're all set.</p>
            <Link href="/app" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Go to dashboard</Link>
          </>
        ) : (
          <>
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><MailWarning className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Couldn't verify</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Link href="/app" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Go to app</Link>
          </>
        )}
      </Card>
    </motion.div>
  );
}
