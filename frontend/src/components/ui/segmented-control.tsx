import { m, useReducedMotion } from "motion/react";
import { useId } from "react";

import { RAISED_KEY } from "@/lib/styles";
import { cn } from "@/lib/utils";

const SLIDE = { type: "spring", stiffness: 420, damping: 36 } as const;

interface SegmentedControlProps {
  options: string[];
  selected: number;
  onSelect?: (index: number) => void;
  label?: string;
  className?: string;
}

// A sunken track with a raised key that slides to the selected option; without `onSelect` it is display only.
export function SegmentedControl({ options, selected, onSelect, label, className }: SegmentedControlProps) {
  const keyId = useId();
  const reduceMotion = useReducedMotion();
  const Option = onSelect ? "button" : "span";

  return (
    <div
      role={onSelect ? "group" : undefined}
      aria-label={label}
      className={cn(
        "grid w-fit auto-cols-max grid-flow-col rounded-[11px] bg-[#05060a]/80 p-[3px] text-xs font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] ring-1 ring-white/6 sm:text-[13px]",
        className,
      )}
    >
      {options.map((option, index) => (
        <Option
          key={option}
          {...(onSelect && { type: "button", "aria-pressed": index === selected, onClick: () => onSelect(index) })}
          className={cn(
            "relative px-2.5 py-1.5 text-center whitespace-nowrap transition-colors duration-300 sm:px-3",
            onSelect && "cursor-pointer",
            index === selected ? "text-foreground" : "text-muted-foreground",
            onSelect && index !== selected && "hover:text-secondary-foreground",
          )}
        >
          {index === selected && (
            <m.span
              layoutId={keyId}
              transition={reduceMotion ? { duration: 0 } : SLIDE}
              style={{ borderRadius: 8 }}
              className={cn("absolute inset-0", RAISED_KEY)}
            />
          )}
          <span className="relative">{option}</span>
        </Option>
      ))}
    </div>
  );
}
