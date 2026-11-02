import { ArrowRight } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

import { EASE_EXPO } from "@/lib/variants";

interface TopicSuggestionProps {
  topic: string;
  suggestion: string;
  // Called once the suggestion sits where the box draws its text, so the box can take over with no jump.
  onTaken: () => void;
}

// Drawn over the ask box's own text, in the same place and font: the topic it turned away is struck through, and the
// maths topic offered sits beside it. Picking the offer slides it left into the text's place.
export default function TopicSuggestion({ topic, suggestion, onTaken }: TopicSuggestionProps) {
  const reduceMotion = useReducedMotion();
  const row = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  // How far left the suggestion slides to sit where the box draws its text.
  const [landing, setLanding] = useState<number | null>(null);

  const take = () => {
    if (reduceMotion) return onTaken();
    setLanding(row.current!.getBoundingClientRect().left - text.current!.getBoundingClientRect().left);
  };

  const after = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, x: -4 },
    animate: landing !== null ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 },
    transition: landing !== null ? { duration: 0.2 } : { duration: 0.4, ease: EASE_EXPO, delay },
  });

  return (
    <div
      ref={row}
      className="pointer-events-none absolute inset-y-0 right-14 left-5 z-[3] flex items-center gap-2.5 text-[15px] sm:left-[26px] sm:text-base"
    >
      <m.span
        initial={reduceMotion ? false : { backgroundSize: "0% 1.5px", color: "#f5f5f7" }}
        animate={{ opacity: landing === null ? 1 : 0, backgroundSize: "100% 1.5px", color: "#737789" }}
        transition={landing !== null ? { duration: 0.2 } : { duration: 0.5, ease: EASE_EXPO, delay: 0.1 }}
        className="min-w-[3ch] truncate bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_55%] bg-no-repeat whitespace-pre"
      >
        <span className="sr-only">Not a maths topic: </span>
        {topic}
      </m.span>
      <m.span {...after(0.45)} aria-hidden="true" className="text-muted-foreground flex-none">
        <ArrowRight size={13} />
      </m.span>
      <m.button
        type="button"
        onClick={take}
        disabled={landing !== null}
        aria-label={`Use this topic: ${suggestion}`}
        initial={reduceMotion ? false : { opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: landing ?? 0 }}
        transition={
          landing === null ? { duration: 0.4, ease: EASE_EXPO, delay: 0.52 } : { duration: 0.55, ease: EASE_EXPO }
        }
        onAnimationComplete={() => landing !== null && onTaken()}
        className="group/use text-foreground focus-visible:outline-accent/60 pointer-events-auto max-w-[75%] flex-none cursor-pointer rounded-sm py-2 outline-offset-2 focus-visible:outline-2"
      >
        {/* Dotted reads as "you can pick this"; it turns solid on hover and fades as the text slides into place. */}
        <m.span
          ref={text}
          animate={{ textDecorationColor: landing === null ? "rgba(183,164,255,0.7)" : "rgba(183,164,255,0)" }}
          transition={{ duration: 0.25 }}
          className="block truncate underline decoration-dotted decoration-[1.5px] underline-offset-[5px] group-hover/use:decoration-solid"
        >
          {suggestion}
        </m.span>
      </m.button>
    </div>
  );
}
