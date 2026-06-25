"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false);
    setSent(true);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <Card className="p-8 shadow-premium">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">If an account exists for <b>{email}</b>, we've sent a password reset link. It expires in 1 hour.</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Email</span>
                <span className="flex items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </span>
              </label>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading || !email}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
}
