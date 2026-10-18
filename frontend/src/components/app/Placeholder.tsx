import { useState, type ReactNode } from "react";

import { SETTLE_MS } from "@/lib/styles";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  loading: boolean;
  className?: string;
  children: ReactNode;
}

// Grey shapes where content will land. When it lands they fade out while it fades in, then they leave the page.
export default function Placeholder({ loading, className, children }: PlaceholderProps) {
  const [gone, setGone] = useState(!loading);
  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={(event) => event.target === event.currentTarget && setGone(true)}
      style={{ transitionDelay: `${SETTLE_MS}ms` }}
      className={cn("pointer-events-none transition-opacity duration-500 ease-out", !loading && "opacity-0", className)}
    >
      {children}
    </div>
  );
}
