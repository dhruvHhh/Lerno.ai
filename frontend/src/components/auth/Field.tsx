import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  action?: ReactNode;
  note?: string;
  children: ReactNode;
}

export default function Field({ id, label, error, action, note, children }: FieldProps) {
  const reduce = useReducedMotion();
  const message = error ?? note;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-secondary-foreground text-sm">
          {label}
        </label>
        {action}
      </div>
      {children}
      {/* The message grows in from above, so the fields below glide down instead of jumping. */}
      <AnimatePresence initial={false}>
        {message && (
          <m.div
            key={message}
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <p
              id={error ? `${id}-error` : undefined}
              className={cn("pt-2 text-sm", error ? "text-danger" : "text-secondary-foreground")}
            >
              {message}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
