"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Search, Sparkles, Star, ArrowRight, CheckCircle2, MapPin, Handshake,
  Mailbox, BarChart3, Bot, Globe, Phone, DollarSign, Trophy, Building2, ChevronDown, Quote,
} from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import { LogoMark } from "@/components/Logo";
import { CountUp } from "@/components/app/CountUp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// three.js globe — client only.
const HeroGlobe = dynamic(() => import("@/components/HeroGlobe"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const reveal = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" }, variants: fadeUp };

const CLIENTS = ["Nexa Media", "GrowthLab", "Scoutbird", "Rocket Digital", "Big Leap", "Mobiosoft", "Level Up", "Shopido"];
const TESTIMONIALS = [
  { name: "Ayesha Khan", role: "Sales Lead, Nexa Media", quote: "We built a 300‑business outreach list in an afternoon. What took days is now a coffee break." },
  { name: "Daniel Reyes", role: "Founder, GrowthLab", quote: "Discover → enrich → pipeline in one tool. We cancelled two other subscriptions." },
  { name: "Sara Malik", role: "Agency Owner", quote: "My team finds local prospects in any city instantly. It genuinely feels premium." },
  { name: "Bilal Ahmed", role: "BDR, Rocket Digital", quote: "Sequences run our follow‑ups on autopilot. Reply rates doubled." },
  { name: "Hina Raza", role: "Co‑founder, Level Up", quote: "The weighted forecast finally tells me which deals will actually close." },
];
const FAQS = [
  { q: "Where do the leads come from?", a: "We pull verified businesses from Google Maps — name, category, phone, website, rating and address — then let you save them as companies & contacts." },
  { q: "Is there a free plan?", a: "Yes. Anyone gets 1 free search with no signup, and the free account includes up to 100 companies and 20 leads per search." },
  { q: "Can it replace my CRM?", a: "That's the idea — companies, contacts, deals, a drag‑and‑drop pipeline, tasks, notes, email and reports are all built in." },
  { q: "Do you send emails for me?", a: "Yes — connect your Gmail and send tracked emails, or run automated multi‑step sequences. Every email includes an unsubscribe link." },
  { q: "How much does it cost?", a: "Free to start, Pro at $29/mo, Agency at $99/mo. Local pricing is shown at checkout." },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ───────── HERO (light + 3D globe) ───────── */}
      <section className="relative overflow-hidden mesh-bg">
        <div className="grid-fade pointer-events-none absolute inset-0 -z-0" />
        {/* three.js globe, softly faded into the page */}
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-60">
          <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"><HeroGlobe /></div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,hsl(var(--background))_80%)]" />
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />

        <div className="container relative z-10 py-20 sm:py-28">
          <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
            <motion.span variants={fadeUp} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Find leads on Google Maps · close them in your CRM
            </motion.span>

            <motion.h1 variants={fadeUp} className="mt-6 text-balance text-5xl font-extrabold leading-[1.03] tracking-tight text-foreground sm:text-7xl">
              Turn the map into{" "}
              <span className="relative whitespace-nowrap text-gradient">
                paying customers
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 300 10" fill="none" preserveAspectRatio="none">
                  <motion.path d="M2 7 Q 150 -2 298 6" stroke="url(#u)" strokeWidth="3.5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.9, ease: EASE }} />
                  <defs><linearGradient id="u" x1="0" y1="0" x2="300" y2="0"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#d946ef" /></linearGradient></defs>
                </svg>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-7 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
              Search any business type in any city, pull verified companies &amp; contacts, then work
              them through deals, sequences and tasks — all in one all‑in‑one CRM.
            </motion.p>

            <motion.div variants={fadeUp} className="mx-auto mt-10 max-w-3xl">
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-r from-indigo-400/30 via-fuchsia-400/30 to-sky-400/30 blur-2xl" />
                <HeroSearch />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Try:</span>
                {["Dentists in Karachi", "Gyms in Dubai", "Cafés in Lahore"].map((t) => (
                  <span key={t} className="rounded-full border border-border bg-card/70 px-2.5 py-1">{t}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["1 free search, no signup", "20 leads / search", "Free plan: 100 companies"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────── TRUSTED BY marquee (light) ───────── */}
      <section className="border-y border-border bg-card py-8">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/70">Trusted by sales teams &amp; agencies</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div className="flex w-max gap-12 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={i} className="text-lg font-bold tracking-tight text-muted-foreground/45">{c}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── STATS ───────── */}
      <section className="border-b border-border bg-card">
        <div className="container grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[
            { v: 8, suffix: "M+", label: "Businesses reachable" },
            { v: 60, suffix: "", label: "Leads per search" },
            { v: 9, suffix: "", label: "Modules in one app" },
            { v: 100, suffix: "%", label: "Built for closing" },
          ].map((s, i) => (
            <motion.div key={s.label} {...reveal} transition={{ delay: i * 0.08 }} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl"><CountUp value={s.v} format={(n) => `${Math.round(n)}${s.suffix}`} /></div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── BENTO FEATURES ───────── */}
      <section className="container py-20 sm:py-24">
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything from <span className="text-gradient">first search</span> to closed deal</h2>
          <p className="mt-4 text-muted-foreground">Most teams stitch together a scraper, a spreadsheet and an expensive CRM. This is all three — in one.</p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ───────── PRODUCT SHOWCASE ───────── */}
      <section className="border-y border-border bg-card">
        <div className="container py-20 sm:py-24">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"><Handshake className="h-3.5 w-3.5" /> Your sales pipeline</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">See every deal at a glance</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} className="relative mx-auto mt-12 max-w-5xl">
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
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${col.color}`} /> {col.stage}</div>
                    <div className="space-y-2">
                      {col.deals.map((d, di) => (
                        <motion.div key={d[0]} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + ci * 0.1 + di * 0.08 }} className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
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
        <motion.div {...reveal} className="mx-auto max-w-2xl text-center"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From zero to pipeline in 3 steps</h2></motion.div>
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

      {/* ───────── TESTIMONIALS CAROUSEL ───────── */}
      <section className="border-y border-border bg-card py-20 sm:py-24">
        <motion.div {...reveal} className="container mx-auto max-w-2xl text-center"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by sales teams</h2></motion.div>
        <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <motion.div className="flex w-max gap-5" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 36, repeat: Infinity, ease: "linear" }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <Card key={i} className="flex w-[340px] shrink-0 flex-col p-6">
                <Quote className="h-7 w-7 text-accent-foreground/30" />
                <p className="mt-3 flex-1 text-sm text-foreground">“{t.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                  <div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section className="container py-20 sm:py-24">
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
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">{p.feats.map((f) => <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>)}</ul>
                <Link href="/register" className="mt-6"><Button variant={p.highlight ? "gradient" : "outline"} className="w-full">{p.cta}</Button></Link>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="border-t border-border bg-card py-20 sm:py-24">
        <div className="container mx-auto max-w-3xl">
          <motion.div {...reveal} className="text-center"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h2></motion.div>
          <div className="mt-10 space-y-3">{FAQS.map((f, i) => <Faq key={i} {...f} />)}</div>
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
            <Link href="/register" className="relative mt-8 inline-block"><Button size="lg" className="bg-white text-primary hover:bg-white/90">Start finding leads <ArrowRight className="h-4 w-4" /></Button></Link>
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

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-background">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
        <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>
      </motion.div>
    </div>
  );
}
