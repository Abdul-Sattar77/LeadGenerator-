import type { Transition, Variants } from "framer-motion";

// Signature motion language — one easing, one spring, used everywhere so the
// whole product feels cohesive and intentional. Respect prefers-reduced-motion
// at the component level (Framer's useReducedMotion) for accessibility.

/** Signature ease — a confident, slightly-overshooting out-expo curve. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Signature spring for drag / interactive elements. */
export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } },
};

/** Parent that staggers its children (lists, card grids, dashboard sections). */
export const stagger = (gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});

/** Route/page transition wrapper props. */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: EASE },
};
