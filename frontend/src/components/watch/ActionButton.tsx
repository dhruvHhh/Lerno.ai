import { Check, CircleNotch } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ActionState = "idle" | "busy" | "done";

const STATES: ActionState[] = ["idle", "busy", "done"];

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state: ActionState;
  labels: [idle: string, busy: string, done: string];
}

// A button that says what it is doing: its label, then a spinner, then a tick. The labels swap in one cell while the
// button slides to the new label's width.
export default function ActionButton({ state, labels, disabled, className, ...props }: ActionButtonProps) {
  const cell = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const fit = () => {
      const label = items.current[STATES.indexOf(state)];
      if (cell.current && label) cell.current.style.width = `${label.offsetWidth}px`;
    };
    fit();
    // A label measured before the web font loaded is the wrong width.
    document.fonts.ready.then(fit);
  }, [state]);

  return (
    <button
      {...props}
      disabled={disabled || state !== "idle"}
      className={cn(className, "inline-flex items-center justify-center", state !== "idle" && "disabled:opacity-100")}
    >
      <span
        ref={cell}
        className="grid grid-cols-[100%] overflow-hidden transition-[width] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      >
        {labels.map((label, i) => (
          <span
            key={label}
            ref={(el) => {
              items.current[i] = el;
            }}
            aria-hidden={STATES[i] !== state}
            className={cn(
              "col-start-1 row-start-1 flex w-max items-center gap-1.5 transition-opacity ease-out motion-reduce:transition-none",
              // The old label leaves before the new one comes, so the two never show on top of each other.
              STATES[i] === state ? "opacity-100 delay-75 duration-150" : "opacity-0 duration-75",
            )}
          >
            {i === 1 && <CircleNotch size="1.1em" className="motion-safe:animate-spin" />}
            {i === 2 && <Check size="1.1em" weight="bold" />}
            {label}
          </span>
        ))}
      </span>
    </button>
  );
}
