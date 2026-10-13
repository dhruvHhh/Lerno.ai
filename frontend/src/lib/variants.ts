import type { Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

// `custom` is each element's delay in seconds.

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
