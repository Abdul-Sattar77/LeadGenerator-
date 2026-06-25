"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Star,
  Download,
  ShieldCheck,
  Zap,
  Database,
  ArrowRight,
  CheckCircle2,
  Quote,
} from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  { icon: Database, title: "Real business data", desc: "Powered by Google Maps — names, categories, phone numbers, ratings, reviews, websites and full addresses." },
  { icon: Zap, title: "Results in seconds", desc: "Type a business type and a city. We fetch and paginate up to 60 verified leads instantly." },
  { icon: Download, title: "One-click export", desc: "Download a clean, Excel-ready CSV of every lead so your sales team can start outreach right away." },
  { icon: ShieldCheck, title: "Your key stays safe", desc: "All API calls run on the server. Your Google key is never exposed to the browser." },
];

const steps = [
  { n: "01", title: "Describe your target", desc: "e.g. “Dentists in Karachi” or “Gyms in Dubai”." },
  { n: "02", title: "We pull the leads", desc: "Verified businesses with contact details and ratings." },
  { n: "03", title: "Filter & export", desc: "Refine by rating, save favourites, download CSV." },
];

const testimonials = [
  { name: "Ayesha Khan", role: "Sales Lead, Nexa Media", img: "https://i.pravatar.cc/120?img=47", quote: "We built a 300-business outreach list in an afternoon. What used to take days is now a coffee break." },
  { name: "Daniel Reyes", role: "Founder, GrowthLab", img: "https://i.pravatar.cc/120?img=12", quote: "The CSV export drops straight into our CRM. Clean data, real phone numbers, zero copy-paste." },
  { name: "Sara Malik", role: "Agency Owner", img: "https://i.pravatar.cc/120?img=32", quote: "My team finds local prospects in any city instantly. It genuinely looks and feels premium." },
];

const columns = ["Name", "Category", "Phone", "Rating", "Website"];

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden mesh-bg">
        {/* dotted grid texture + animated colour blobs */}
        <div className="grid-fade pointer-events-none absolute inset-0 -z-0" />
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="blob left-[8%] top-[12%] h-72 w-72 bg-indigo-300" />
          <div className="blob right-[6%] top-[22%] h-80 w-80 bg-fuchsia-300" style={{ animationDelay: "1.5s" }} />
          <div className="blob left-1/2 bottom-[2%] h-72 w-72 bg-sky-300" style={{ animationDelay: "3s" }} />
        </div>

        <div className="container relative z-10 py-20 sm:py-28">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.span
              variants={fadeUp}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              From Google Maps to closed deals — one CRM
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-7xl"
            >
              Find your next customers{" "}
              <span className="text-gradient">in seconds</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl"
            >
              Search any business type in any location to pull verified
              companies and contacts — then work them through deals, a drag-and-drop
              pipeline, tasks and email, all in one relational CRM.
            </motion.p>

            <motion.div variants={fadeUp} className="mx-auto mt-10 max-w-3xl">
              {/* glow halo behind the search bar */}
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-r from-indigo-400/30 via-fuchsia-400/30 to-sky-400/30 blur-2xl" />
                <HeroSearch />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1 free search, no signup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 20 leads / search
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free plan: 100 companies
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Preview mockup — floating glass panel with live badges */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1200 }}
            className="relative mx-auto mt-16 max-w-4xl"
          >
            {/* glow base */}
            <div className="absolute -inset-x-10 -bottom-8 top-10 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-300/40 via-fuchsia-300/30 to-sky-300/40 blur-3xl" />

            {/* floating badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="bob glass absolute -left-4 top-16 z-20 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-card sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              60 verified leads
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              style={{ animationDelay: "1.5s" }}
              className="bob glass absolute -right-4 bottom-12 z-20 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-card sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              </span>
              Sorted by rating
            </motion.div>

            <Card className="overflow-hidden p-0 ring-1 ring-white/60">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  Restaurants in Mirpurkhas — 20 leads
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-2.5 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Pizza Max", "Fast Food", "(022) 111 629 111", "4.8", "pizzamax.com.pk"],
                    ["KFC Mirpur Khas", "Fast Food", "(051) 111 532 532", "4.3", "kfcpakistan.com"],
                    ["Spice N Grill", "Restaurant", "0311 1555760", "4.0", "webild.io"],
                    ["Mirchi 360°", "Restaurant", "0336 3300360", "3.9", "—"],
                  ].map((r, idx) => (
                    <motion.tr
                      key={r[0]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + idx * 0.12 }}
                      className="transition-colors hover:bg-accent/40"
                    >
                      <td className="px-4 py-3 font-semibold">{r[0]}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{r[1]}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r[2]}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {r[3]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary">{r[4]}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border bg-card">
        <div className="container grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[
            ["8M+", "Businesses reachable"],
            ["60", "Leads per search"],
            ["7", "Data points each"],
            ["1-click", "CSV export"],
          ].map(([big, small], i) => (
            <motion.div
              key={small}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold tracking-tight text-gradient">{big}</div>
              <div className="mt-1 text-sm text-muted-foreground">{small}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to build a lead list
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop copying details off Google Maps by hand. LeadFinder does it for
            you — clean, structured and exportable.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -6 }}>
              <Card className="h-full p-6 transition-shadow hover:shadow-glow">
                <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl shadow-soft">
                  <f.icon className="h-5 w-5 text-white" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SPLIT: built for sales teams (with image) */}
      <section className="border-y border-border bg-card">
        <div className="container grid items-center gap-12 py-20 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <LogoMark size={16} /> Built for sales teams
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From “who do we call?” to a full pipeline
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you sell websites, run ads, or do field sales — point
              LeadFinder at any city and get a ready-to-work prospect list with
              the details that matter.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Verified phone numbers to start calling today",
                "Spot businesses with no website — instant pitches",
                "Sort by rating & reviews to prioritise the best",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-7 inline-block">
              <Button variant="gradient" size="lg">
                <Search className="h-5 w-5" /> Get started free
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-200/60 to-fuchsia-200/60 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80"
              alt="Sales team collaborating"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl border border-border object-cover shadow-card"
            />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to a full pipeline
          </h2>
        </motion.div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-12 grid gap-8 md:grid-cols-3"
        >
          {steps.map((s) => (
            <motion.div key={s.n} variants={fadeUp} className="relative">
              <span className="text-5xl font-extrabold text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-border bg-card">
        <div className="container py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by sales teams
            </h2>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 grid gap-5 md:grid-cols-3"
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -6 }}>
                <Card className="flex h-full flex-col p-6">
                  <Quote className="h-7 w-7 text-accent-foreground/40" />
                  <p className="mt-3 flex-1 text-sm text-foreground">“{t.quote}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.img}
                      alt={t.name}
                      loading="lazy"
                      className="h-10 w-10 rounded-full border border-border object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="brand-gradient relative overflow-hidden p-10 text-center text-white sm:p-16">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to find your next 60 customers?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/85">
              Create your free account — no credit card required.
            </p>
            <Link href="/register" className="relative mt-8 inline-block">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <Search className="h-5 w-5" />
                Start finding leads
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <LogoMark size={22} />
            © 2026 LeadFinder. Built for sales teams.
          </span>
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
