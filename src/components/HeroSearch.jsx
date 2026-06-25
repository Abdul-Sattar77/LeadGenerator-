"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Briefcase, MapPin, SlidersHorizontal, Star, Phone, Globe, Lock, Loader2, Plus, ArrowRight, Sparkles } from "lucide-react";

const COUNTS = [20, 40, 60];

// Dark glass search card for the hero. Anonymous visitors get one free search,
// then a sign-up wall. Saving requires an account.
export default function HeroSearch() {
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [max, setMax] = useState(20);
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const w = what.trim(), loc = where.trim();
    const q = w && loc ? `${w} in ${loc}` : w || loc;
    if (!q) return;
    setLoading(true); setError(""); setNeedLogin(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=20`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === "LOGIN_REQUIRED") { setNeedLogin(true); setResults(null); return; }
      if (!res.ok) throw new Error(data.error || "Search failed");
      setQuery(q); setResults(data.results || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const field = "flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 transition-colors focus-within:border-[#6C4CFF]/60";
  const input = "h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40";

  return (
    <div>
      <form onSubmit={submit} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-2.5 shadow-2xl backdrop-blur-xl sm:flex sm:items-center sm:gap-2">
        <label className={`${field} flex-1`}>
          <Briefcase className="h-4 w-4 shrink-0 text-[#9E5CFF]" />
          <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Business type — e.g. Restaurant" className={input} />
        </label>
        <label className={`${field} mt-2 flex-1 sm:mt-0`}>
          <MapPin className="h-4 w-4 shrink-0 text-[#5E8BFF]" />
          <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Location — e.g. Karachi" className={input} />
        </label>
        <label className={`${field} mt-2 sm:mt-0`}>
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-white/50" />
          <select value={max} onChange={(e) => setMax(Number(e.target.value))} className="h-12 bg-transparent text-sm text-white outline-none [&>option]:text-slate-900">
            {COUNTS.map((c) => <option key={c} value={c}>{c} Leads</option>)}
          </select>
        </label>
        <button type="submit" disabled={loading}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4CFF] to-[#9E5CFF] px-6 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(108,76,255,0.45)] transition-transform hover:scale-[1.02] active:scale-95 sm:mt-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search Leads
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-medium text-rose-300">{error}</p>}

      {needLogin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-5 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl backdrop-blur-xl">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C4CFF]/20 text-[#9E5CFF]"><Lock className="h-6 w-6" /></span>
          <h3 className="text-lg font-bold text-white">That was your free search</h3>
          <p className="mt-1 text-sm text-white/60">Create a free account to keep finding leads — 100 companies & 20 leads/search.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/register"><span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#6C4CFF] to-[#9E5CFF] px-4 py-2 text-sm font-semibold text-white">Create free account <ArrowRight className="h-4 w-4" /></span></Link>
            <Link href="/login"><span className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5">Log in</span></Link>
          </div>
        </motion.div>
      )}

      {results && (
        <div className="mt-5 text-left">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/60"><span className="font-semibold text-white">{results.length}</span> free leads for “{query}”</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Free preview · sign up to save</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 6).map((r, i) => (
              <motion.div key={`${r.name}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl">
                <div className="truncate text-sm font-semibold text-white">{r.name}</div>
                <div className="truncate text-xs text-white/45">{r.category || "Business"}</div>
                <div className="mt-2 space-y-1 text-xs text-white/55">
                  {r.rating != null && <div className="flex items-center gap-1.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating}</div>}
                  {r.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.phone}</div>}
                  {r.website && <div className="flex items-center gap-1.5 truncate"><Globe className="h-3 w-3" /> <span className="truncate">{r.website.replace(/^https?:\/\//, "")}</span></div>}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-center backdrop-blur-xl">
            <p className="text-sm text-white/70">Create a free account to <span className="font-semibold text-white">save these into your CRM</span> and search again.</p>
            <Link href="/register"><span className="mt-3 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#6C4CFF] to-[#9E5CFF] px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create free account</span></Link>
          </div>
        </div>
      )}
    </div>
  );
}
