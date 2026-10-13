import { m, useReducedMotion } from "motion/react";
import { useId, type ComponentProps } from "react";

import { RAISED_KEY } from "@/lib/styles";
import { cn } from "@/lib/utils";

const SLIDE = { type: "spring", stiffness: 420, damping: 36 } as const;

const OPTION = "relative px-2.5 py-1.5 text-center whitespace-nowrap transition-colors duration-300 sm:px-3";

interface SegmentedProps {
  options: string[];
  selected: number;
  className?: string;
}

function Track({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid w-fit auto-cols-max grid-flow-col rounded-[11px] bg-[#05060a]/80 p-[3px] text-xs font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] ring-1 ring-white/6 sm:text-[13px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// The shared layoutId makes the key slide between options.
function SlidingKey({ id }: { id: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <m.span
      layoutId={id}
      transition={reduceMotion ? { duration: 0 } : SLIDE}
      style={{ borderRadius: 8 }}
      className={cn("absolute inset-0", RAISED_KEY)}
    />
  );
}

export function SegmentedDisplay({ options, selected, className }: SegmentedProps) {
  const keyId = useId();
  return (
    <Track className={className}>
      {options.map((option, index) => (
        <span key={option} className={cn(OPTION, index === selected ? "text-foreground" : "text-muted-foreground")}>
          {index === selected && <SlidingKey id={keyId} />}
          <span className="relative">{option}</span>
        </span>
      ))}
    </Track>
  );
}
