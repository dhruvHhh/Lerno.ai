import { m, useReducedMotion } from "motion/react";
import { useId, type ComponentProps } from "react";

import { RAISED_KEY } from "@/lib/styles";
import { cn } from "@/lib/utils";

const SLIDE = { type: "spring", stiffness: 420, damping: 36 } as const;

const OPTION = "relative px-2.5 py-1.5 text-center whitespace-nowrap transition-colors duration-300 sm:px-3";

interface DisplayProps {
  options: string[];
  selected: number;
  className?: string;
}

interface ControlProps extends DisplayProps {
  onSelect: (index: number) => void;
  label: string;
}

// The sunken track both variants sit in.
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

// The raised key under the selected option; it slides between options because each track shares one layoutId.
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

// Clickable: the reader picks an option.
export function SegmentedControl({ options, selected, onSelect, label, className }: ControlProps) {
  const keyId = useId();
  return (
    <Track role="group" aria-label={label} className={className}>
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={index === selected}
          onClick={() => onSelect(index)}
          className={cn(
            OPTION,
            "cursor-pointer",
            index === selected ? "text-foreground" : "text-muted-foreground hover:text-secondary-foreground",
          )}
        >
          {index === selected && <SlidingKey id={keyId} />}
          <span className="relative">{option}</span>
        </button>
      ))}
    </Track>
  );
}

// Display only: shows which option is selected, for illustrations that drive it themselves.
export function SegmentedDisplay({ options, selected, className }: DisplayProps) {
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
