"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";

export default function LeadFormClient({ orgId, orgName, found }: { orgId: string; orgName: string; found: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading"); setError("");
    const res = await fetch(`/api/public/lead/${orgId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else { setState("error"); setError(data.error || "Something went wrong."); }
  }

  if (!found) {
    return <div className="flex min-h-screen items-center justify-center p-6"><p className="text-muted-foreground">This form isn't available.</p></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
        <div className="mb-4 flex justify-center"><Logo size={32} /></div>
        <Card className="p-8 shadow-premium">
          {state === "done" ? (
            <div className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
              <h1 className="text-xl font-bold">Thanks — we got it!</h1>
              <p className="mt-1 text-sm text-muted-foreground">{orgName} will be in touch with you soon.</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight">Get in touch with {orgName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Leave your details and we'll reach out.</p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div><Label htmlFor="lf-name">Name</Label><Input id="lf-name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="Your name" /></div>
                <div><Label htmlFor="lf-email">Email</Label><Input id="lf-email" type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)} placeholder="you@email.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="lf-phone">Phone</Label><Input id="lf-phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)} placeholder="+92…" /></div>
                  <div><Label htmlFor="lf-company">Company</Label><Input id="lf-company" value={form.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("company", e.target.value)} placeholder="Company" /></div>
                </div>
                <div><Label htmlFor="lf-message">Message</Label><Textarea id="lf-message" rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" /></div>
                {/* Honeypot — hidden from humans */}
                <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} className="hidden" aria-hidden />
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button type="submit" variant="gradient" className="w-full" disabled={state === "loading" || (!form.name && !form.email)}>
                  {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
                </Button>
              </form>
            </>
          )}
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">Powered by LeadFinder</p>
      </motion.div>
    </div>
  );
}
