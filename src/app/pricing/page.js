import { Sparkles } from "lucide-react";
import PricingPlans from "@/components/PricingPlans";

export const metadata = {
  title: "Pricing — LeadFinder",
};

const faqs = [
  {
    q: "Can I try it without paying?",
    a: "Yes. The Free plan needs no card and lets you pull up to 20 leads per search and export them to CSV.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Plans are month-to-month (or yearly). Cancel whenever you like — no lock-in, no fees.",
  },
  {
    q: "How is the data sourced?",
    a: "Leads come live from Google Maps — names, categories, phone numbers, ratings, reviews, websites and addresses.",
  },
  {
    q: "Do I need my own Google API key?",
    a: "For self-hosting, yes — Google Places usage is billed to your own Google Cloud account, separate from these plans.",
  },
];

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden mesh-bg">
      <div className="grid-fade pointer-events-none absolute inset-0" />

      <div className="container relative py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Simple, transparent pricing
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Plans that scale with your <span className="text-gradient">outreach</span>
          </h1>
          <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
            Start free. Upgrade when you’re ready to pull more leads and unlock
            advanced filters.
          </p>
        </div>

        <PricingPlans />

        {/* FAQ */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="glass rounded-2xl p-6"
              >
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center text-xs text-muted-foreground">
          Prices are illustrative for this demo. Google Places API usage is billed
          separately to your own Google Cloud account.
        </p>
      </div>
    </div>
  );
}
