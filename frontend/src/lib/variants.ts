import type { Variants } from "motion/react";

// Shared reveal presets; `custom` is each element's delay in seconds.
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: EASE } }),
};

export const appear: Variants = {
  hidden: { opacity: 0 },
  shown: (delay = 0) => ({ opacity: 1, transition: { duration: 0.4, delay } }),
};

export const sweep: Variants = {
  hidden: { scaleX: 0 },
  shown: (delay = 0) => ({ scaleX: 1, transition: { duration: 0.8, delay, ease: EASE } }),
};

export const fadeOut: Variants = {
  hidden: { opacity: 1 },
  shown: (delay = 0) => ({ opacity: 0, transition: { duration: 0.3, delay } }),
};

export const lightUp: Variants = {
  hidden: { color: "#737789" },
  shown: (delay = 0) => ({ color: "#f5f5f7", transition: { duration: 0.5, delay } }),
};
