// Lead scoring (0–100). Pure function — reused by the API and seed script.
// Factors: has a website, Google rating, review volume, industry weight, recent activity.

export interface ScoreInput {
  website?: string | null;
  rating?: number | null;
  reviews?: number | null;
  industry?: string | null;
  activityCount?: number;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
}

// Configurable per-industry weight (defaults to 5 for unknown industries).
const INDUSTRY_WEIGHT: Record<string, number> = {
  dentist: 12,
  restaurant: 8,
  gym: 9,
  salon: 8,
  clinic: 11,
  lawyer: 10,
  "real estate": 9,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function scoreLead(input: ScoreInput): ScoreResult {
  const hasWebsite = Boolean(input.website && input.website.trim() && input.website !== "—");
  const rating = Number(input.rating) || 0;
  const reviews = Number(input.reviews) || 0;
  const industry = (input.industry || "").toLowerCase().trim();
  const activity = input.activityCount ?? 0;

  const breakdown: Record<string, number> = {
    website: hasWebsite ? 20 : 0,
    rating: rating >= 4.5 ? 20 : rating >= 4 ? 14 : rating >= 3 ? 7 : 0,
    reviews: reviews >= 200 ? 20 : reviews >= 50 ? 12 : reviews >= 10 ? 6 : 0,
    industry: INDUSTRY_WEIGHT[industry] ?? 5,
    activity: clamp(activity * 4, 0, 20),
  };

  const score = clamp(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    0,
    100
  );

  return { score, breakdown };
}
