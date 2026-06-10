"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    desc: "For trying things out and small one-off searches.",
    features: [
      "20 leads per search",
      "Phone, rating & website data",
      "CSV export",
      "Save up to 50 leads",
    ],
    cta: "Get started",
    href: "/search",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 29,
    yearly: 24,
    desc: "For freelancers and small sales teams building pipelines.",
    features: [
      "60 leads per search",
      "Advanced filters & sorting",
      "Unlimited saved leads",
      "Search history",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/search",
    highlight: true,
  },
  {
    name: "Agency",
    monthly: 99,
    yearly: 82,
    desc: "For agencies running outreach at scale.",
    features: [
      "Everything in Pro",
      "Bulk multi-city searches",
      "Team seats",
      "Email enrichment (add-on)",
      "API access",
    ],
    cta: "Contact sales",
    href: "/search",
    highlight: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function PricingPlans() {
  const [yearly, setYearly] = useState(false);

  return (
    <>
      {/* Billing toggle */}
      <div className="mt-8 flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              !yearly ? "brand-gradient text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              yearly ? "brand-gradient text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                yearly ? "bg-white/25 text-white" : "bg-accent text-accent-foreground"
              )}
            >
              −2 months
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl items-start gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const price = yearly ? plan.yearly : plan.monthly;
          const isPro = plan.highlight;
          return (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={cn("relative rounded-2xl", isPro && "animated-border lg:-mt-3")}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col p-7",
                  isPro ? "bg-card shadow-glow" : "glass"
                )}
              >
                {isPro && (
                  <span className="brand-gradient absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-soft">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most popular
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {isPro && <Zap className="h-4 w-4 fill-primary text-primary" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">${price}</span>
                  <span className="mb-1.5 text-sm text-muted-foreground">
                    {price === 0 ? "forever" : "/ month"}
                  </span>
                </div>
                <p className="mt-1 h-4 text-xs text-muted-foreground">
                  {price > 0 && yearly ? `Billed $${price * 12}/year` : " "}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          isPro ? "brand-gradient" : "bg-accent"
                        )}
                      >
                        <Check
                          className={cn("h-3 w-3", isPro ? "text-white" : "text-accent-foreground")}
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className="mt-7">
                  <Button variant={isPro ? "gradient" : "outline"} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
