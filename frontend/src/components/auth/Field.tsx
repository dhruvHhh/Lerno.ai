import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { EASE_IN_OUT } from "@/lib/variants";

interface MessageProps {
  text?: string;
  id?: string;
  error?: boolean;
}

// Grows in from above, so what's below glides down instead of jumping.
export function Message({ text, id, error }: MessageProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {text && (
        <m.div
          key={text}
          initial={{ opacity: 0, height: 0, y: -5 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -5 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: EASE_IN_OUT }}
        >
          <p
            id={id}
            role={error ? "alert" : undefined}
            className={cn("pt-2 text-sm", error ? "text-danger" : "text-secondary-foreground")}
          >
            {text}
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  action?: ReactNode;
  note?: string;
  children: ReactNode;
}

export default function Field({ id, label, error, action, note, children }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-secondary-foreground text-sm">
          {label}
        </label>
        {action}
      </div>
      {children}
      <Message text={error ?? note} id={error ? `${id}-error` : undefined} error={!!error} />
    </div>
  );
}
