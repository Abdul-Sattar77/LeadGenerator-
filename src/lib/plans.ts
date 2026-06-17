import type { PlanTier } from "@/lib/enums";

export interface PlanDef {
  tier: PlanTier;
  name: string;
  price: number; // USD / month
  leadLimit: number | null; // null = unlimited
  seats: number;
  blurb: string;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanDef> = {
  FREE: {
    tier: "FREE", name: "Free", price: 0, leadLimit: 100, seats: 1,
    blurb: "For trying things out and small one-off searches.",
    features: ["100 companies in your CRM", "1 seat", "Pipeline & tasks", "CSV export"],
  },
  PRO: {
    tier: "PRO", name: "Pro", price: 29, leadLimit: null, seats: 3,
    blurb: "For freelancers and small sales teams building pipelines.",
    features: ["Unlimited companies", "3 seats", "Reports & analytics", "Priority support"],
  },
  AGENCY: {
    tier: "AGENCY", name: "Agency", price: 99, leadLimit: null, seats: 25,
    blurb: "For agencies running outreach at scale.",
    features: ["Unlimited companies", "25 seats", "Team performance reports", "CSV export & API"],
  },
};

export function planOf(tier: string): PlanDef {
  return PLANS[(tier as PlanTier)] ?? PLANS.FREE;
}

// Thrown when an org hits its plan's record cap.
export class PlanLimitError extends Error {
  limit: number;
  constructor(limit: number) {
    super(`You've reached your plan's limit of ${limit} companies. Upgrade to add more.`);
    this.name = "PlanLimitError";
    this.limit = limit;
  }
}
