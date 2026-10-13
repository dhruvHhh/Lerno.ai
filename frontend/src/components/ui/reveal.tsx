import { m, useReducedMotion, type HTMLMotionProps } from "motion/react";

// Plays children's "shown" variants once in view; starts shown with reduced motion.
export function Reveal({ amount = 0.4, ...props }: HTMLMotionProps<"div"> & { amount?: number }) {
  const still = useReducedMotion();
  return <m.div initial={still ? false : "hidden"} whileInView="shown" viewport={{ once: true, amount }} {...props} />;
}
