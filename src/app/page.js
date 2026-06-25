"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Sparkles, Star, ArrowRight, CheckCircle2, MapPin, Handshake,
  Mailbox, Building2, BarChart3, Bot, Zap, Globe, Phone, DollarSign, Trophy,
  Play, ShieldCheck, Target,
} from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import HeroMap from "@/components/HeroMap";
import { LogoMark } from "@/components/Logo";
import { CountUp } from "@/components/app/CountUp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const EASE = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" }, variants: fadeUp };

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ───────── HERO (dark, premium) ───────── */}
      <section className="relative -mt-16 overflow-hidden bg-[#09090f] pt-16 text-white">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(60%_50%_at_50%_0%,#1B1238_0%,#09090F_70%)]" />
        <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#6C4CFF]/25 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-[#5E8BFF]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[#9E5CFF]/15 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 -z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.045) 1px,transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at 50% 25%, black 25%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 25%, black 25%, transparent 80%)" }} />

        <div className="container relative z-10 pb-32 pt-12 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* LEFT */}
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#6C4CFF] to-[#9E5CFF]"><Zap className="h-3 w-3 text-white" /></span>
                Smart Leads. Real Results.
              </motion.span>
              <motion.h1 variants={fadeUp} className="mt-6 text-6xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl xl:text-[5.25rem]">
                Find Leads.<br />
                <span className="bg-gradient-to-r from-[#5E8BFF] via-[#6C4CFF] to-[#9E5CFF] bg-clip-text text-transparent">Close Deals.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-md text-lg text-white/60">
                All‑in‑one CRM to find verified businesses, connect instantly &amp; grow faster.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#search" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6C4CFF] to-[#9E5CFF] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(108,76,255,0.5)] transition-transform hover:-translate-y-0.5">
                  Start Free Search <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20"><Play className="h-3 w-3 fill-white" /></span> See How It Works
                </a>
              </motion.div>
            </motion.div>

            {/* RIGHT — futuristic map */}
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: EASE }}>
              <HeroMap />
            </motion.div>
          </div>

          {/* Floating glass search card */}
          <motion.div id="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: EASE }} className="mt-14 scroll-mt-24">
            <HeroSearch />
          </motion.div>

          {/* Feature strip */}
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "100% Verified", sub: "Accurate & reliable data", color: "#9E5CFF" },
              { icon: Zap, title: "Save Time", sub: "Automate outreach", color: "#5E8BFF" },
              { icon: Target, title: "Close More Deals", sub: "Better leads, better results", color: "#ec4899" },
              { icon: BarChart3, title: "All‑in‑One CRM", sub: "Everything in one place", color: "#22c55e" },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${f.color}22`, color: f.color }}><f.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{f.title}</div><div className="truncate text-xs text-white/45">{f.sub}</div></div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* curved transition into the light sections */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0">
          <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="h-[70px] w-full sm:h-[110px]">
            <path d="M0 70 C 360 130 1080 10 1440 70 L1440 120 L0 120 Z" fill="hsl(var(--card))" />
          </svg>
        </div>
      </section>

      {/* ───────── STATS ───────── */}
      <section className="border-y border-border bg-card">
        <div className="container grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[
            { v: 8, suffix: "M+", label: "Businesses reachable" },
            { v: 60, suffix: "", label: "Leads per search" },
            { v: 9, suffix: "", label: "Modules in one app" },
            { v: 100, suffix: "%", label: "Built for closing" },
          ].map((s, i) => (
            <motion.div key={s.label} {...reveal} transition={{ delay: i * 0.08 }} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
                <CountUp value={s.v} format={(n) => `${Math.round(n)}${s.suffix}`} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── BENTO FEATURES ───────── */}
      <section id="features" className="container scroll-mt-20 py-20 sm:py-24">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything from <span className="text-gradient">first search</span> to closed deal</h2>
          <p className="mt-4 text-muted-foreground">Most teams stitch together a scraper, a spreadsheet and an expensive CRM. This is all three — in one.</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* big tile */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="group relative h-full overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-300/30 blur-2xl transition-opacity group-hover:opacity-80" />
              <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft"><MapPin className="h-6 w-6 text-white" /></span>
              <h3 className="mt-4 text-xl font-bold">Discover leads from Google Maps</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Type a business type and a city — get verified companies with phone, website, rating and address, deduped against your CRM, ready to save in one click.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[["Verified phone", Phone], ["Website", Globe], ["Rating", Star]].map(([t, Icon]) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {t}</span>
                ))}
              </div>
            </Card>
          </motion.div>

          {[
            { icon: Handshake, title: "Drag‑and‑drop pipeline", desc: "Move deals across stages with a weighted forecast and stale‑deal alerts." },
            { icon: Mailbox, title: "Email sequences", desc: "Automated multi‑step follow‑ups that send on schedule and track opens." },
            { icon: Sparkles, title: "1‑click enrichment", desc: "Pull emails, phones & socials straight from a company's website." },
            { icon: BarChart3, title: "Reports & forecast", desc: "Pipeline, win‑rate, sources and a monthly goal tracker — export anytime." },
            { icon: Bot, title: "AI assistant", desc: "Summarize a contact or draft an outreach email with Claude." },
          ].map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"><f.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────── PRODUCT SHOWCASE (pipeline) ───────── */}
      <section className="border-y border-border bg-card">
        <div className="container py-20 sm:py-24">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"><Handshake className="h-3.5 w-3.5" /> Your sales pipeline</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">See every deal at a glance</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}
            className="relative mx-auto mt-12 max-w-5xl">
            <div className="absolute -inset-x-8 -bottom-6 top-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-300/40 via-fuchsia-300/30 to-sky-300/40 blur-3xl" />
            <Card className="overflow-hidden p-0 ring-1 ring-white/60">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-muted-foreground">app · Deals</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {[
                  { stage: "New", color: "bg-indigo-500", deals: [["Acme Dental", "$5k"], ["FitZone Gym", "$3k"]] },
                  { stage: "Qualified", color: "bg-indigo-500", deals: [["One 10 Pizza", "$4.4k"]] },
                  { stage: "Won", color: "bg-emerald-500", deals: [["City Law", "$4.2k"]] },
                  { stage: "Lost", color: "bg-rose-500", deals: [["Bright Smile", "$0"]] },
                ].map((col, ci) => (
                  <div key={col.stage}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} /> {col.stage}
                    </div>
                    <div className="space-y-2">
                      {col.deals.map((d, di) => (
                        <motion.div key={d[0]} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + ci * 0.1 + di * 0.08 }}
                          className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
                          <div className="truncate text-xs font-semibold">{d[0]}</div>
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"><DollarSign className="h-2.5 w-2.5" />{d[1]}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="container py-20 sm:py-24">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From zero to pipeline in 3 steps</h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative mt-14 grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {[
            { n: "01", icon: Search, title: "Discover", desc: "Search Google Maps for your ideal customers in any city." },
            { n: "02", icon: Building2, title: "Organize", desc: "Save them as companies & contacts, enrich, tag and assign." },
            { n: "03", icon: Trophy, title: "Close", desc: "Work deals through the pipeline with tasks, email & sequences." },
          ].map((s) => (
            <motion.div key={s.n} variants={fadeUp} className="relative text-center">
              <span className="brand-gradient relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft"><s.icon className="h-6 w-6" /></span>
              <div className="mt-4 text-xs font-bold tracking-widest text-muted-foreground">STEP {s.n}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section className="border-t border-border bg-card">
        <div className="container py-20 sm:py-24">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, honest pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're ready to scale.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { name: "Free", price: "$0", blurb: "For trying it out.", feats: ["100 companies", "20 leads / search", "Pipeline & tasks", "CSV export"], cta: "Start free", highlight: false },
              { name: "Pro", price: "$29", blurb: "For small sales teams.", feats: ["Unlimited companies", "3 seats", "Sequences & campaigns", "Reports & analytics"], cta: "Start free trial", highlight: true },
              { name: "Agency", price: "$99", blurb: "For agencies at scale.", feats: ["Unlimited companies", "25 seats", "Team performance", "CSV export & API"], cta: "Start free trial", highlight: false },
            ].map((p) => (
              <motion.div key={p.name} variants={fadeUp} whileHover={{ y: -6 }}>
                <Card className={`relative flex h-full flex-col p-7 ${p.highlight ? "ring-2 ring-primary shadow-glow" : ""}`}>
                  {p.highlight && <span className="brand-gradient absolute -top-3 left-7 rounded-full px-3 py-0.5 text-xs font-semibold text-white shadow-soft">Most popular</span>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                  <div className="mt-4 flex items-end gap-1"><span className="text-4xl font-extrabold tracking-tight">{p.price}</span><span className="mb-1 text-sm text-muted-foreground">/ mo</span></div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {p.feats.map((f) => <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>)}
                  </ul>
                  <Link href="/register" className="mt-6"><Button variant={p.highlight ? "gradient" : "outline"} className="w-full">{p.cta}</Button></Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Prices shown in USD · local pricing available at checkout</p>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="container py-20 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}>
          <Card className="brand-gradient relative overflow-hidden p-10 text-center text-white sm:p-16">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <Sparkles className="relative mx-auto h-8 w-8" />
            <h2 className="relative mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Find your next customer in the next 5 minutes</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/85">Free to start — no credit card. Run a search right now and see real leads.</p>
            <Link href="/register" className="relative mt-8 inline-block">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">Start finding leads <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </Card>
        </motion.div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2"><LogoMark size={22} /> © 2026 LeadFinder. From the map to the close.</span>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
