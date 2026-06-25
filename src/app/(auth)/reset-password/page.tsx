"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setEmail(p.get("email") || "");
    setToken(p.get("token") || "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || "Couldn't reset password."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <Card className="p-8 shadow-premium">
        {done ? (
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in…</p>
          </div>
        ) : !token || !email ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">This link is missing or malformed. Request a new one.</p>
            <Link href="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">Request a reset link</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">For <b>{email}</b></p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {[["New password", password, setPassword], ["Confirm password", confirm, setConfirm]].map(([label, val, set]: any) => (
                <label key={label} className="block">
                  <span className="mb-1.5 block text-sm font-medium">{label}</span>
                  <span className="flex items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input type="password" value={val} onChange={(e) => set(e.target.value)} required placeholder="••••••••" className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </span>
                </label>
              ))}
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Reset password
              </Button>
            </form>
          </>
        )}
      </Card>
    </motion.div>
  );
}
