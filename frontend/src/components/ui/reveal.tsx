import { m, useReducedMotion, type HTMLMotionProps } from "motion/react";

// Plays its children's "shown" variants once, when it scrolls into view; with reduced motion they start shown.
export function Reveal({ amount = 0.4, ...props }: HTMLMotionProps<"div"> & { amount?: number }) {
  const still = useReducedMotion();
  return <m.div initial={still ? false : "hidden"} whileInView="shown" viewport={{ once: true, amount }} {...props} />;
}
