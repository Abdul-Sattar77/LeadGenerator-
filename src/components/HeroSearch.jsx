"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Phone, Globe, MapPin, Lock, Loader2, Plus, ArrowRight, Sparkles } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";

// Public hero search: anonymous visitors get ONE free search (20 leads),
// then a sign-up wall. Saving any lead also requires an account.
export default function HeroSearch() {
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(q) {
    setLoading(true);
    setError("");
    setNeedLogin(false);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=20`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === "LOGIN_REQUIRED") {
        setNeedLogin(true);
        setResults(null);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Search failed");
      setQuery(q);
      setResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SearchBar onSubmit={runSearch} loading={loading} />

      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

      {/* Sign-up wall after the free search is used */}
      {needLogin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-card"
        >
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold">That was your free search</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a free account to keep finding leads — Free includes up to <b>100 companies</b> and 20 leads per search.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/register"><Button variant="gradient">Create free account <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/login"><Button variant="outline">Log in</Button></Link>
          </div>
        </motion.div>
      )}

      {/* Results from the one free search */}
      {results && (
        <div className="mt-6 text-left">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> free leads for “{query}”
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3.5 w-3.5" /> Free preview · sign up to save
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 9).map((r, i) => (
              <motion.div
                key={`${r.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="rounded-xl border border-border bg-card p-3 text-left shadow-soft"
              >
                <div className="truncate font-semibold leading-tight">{r.name}</div>
                <div className="truncate text-xs text-muted-foreground">{r.category || "Business"}</div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {r.rating != null && (
                    <div className="flex items-center gap-1.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating} {r.reviews != null && `(${r.reviews})`}</div>
                  )}
                  {r.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.phone}</div>}
                  {r.website && <div className="flex items-center gap-1.5 truncate"><Globe className="h-3 w-3" /> <span className="truncate">{r.website.replace(/^https?:\/\//, "")}</span></div>}
                  {r.address && <div className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> <span className="line-clamp-1">{r.address}</span></div>}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-gradient-to-r from-indigo-50 to-violet-50 p-5 text-center">
            <h3 className="font-bold">Save these into your CRM — free</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create a free account to save leads, search again, and work them through your pipeline.</p>
            <Link href="/register"><Button variant="gradient" className="mt-3"><Plus className="h-4 w-4" /> Create free account</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
