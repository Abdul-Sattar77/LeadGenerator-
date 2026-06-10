import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional class names and dedupe conflicting Tailwind classes.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Turn a Google primaryType like "fast_food_restaurant" into "Fast Food Restaurant".
export function prettyCategory(value) {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
