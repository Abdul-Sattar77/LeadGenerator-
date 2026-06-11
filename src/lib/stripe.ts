import Stripe from "stripe";

// Lazily-constructed Stripe client. Returns null when STRIPE_SECRET_KEY is unset,
// so the app runs without Stripe (plan switches fall back to an instant change).
let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
