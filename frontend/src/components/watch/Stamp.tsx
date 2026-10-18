import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StampProps {
  children: ReactNode;
  // The diamond is the note marker on the progress bar, so a note and its marker read as one thing.
  note?: boolean;
  className?: string;
}

// A moment in the lesson, set like a timecode: fixed-width numbers, no pill.
export default function Stamp({ children, note = false, className }: StampProps) {
  return (
    <span
      className={cn("text-accent-soft inline-flex items-center gap-1.5 text-xs font-medium tabular-nums", className)}
    >
      {note && (
        <i
          aria-hidden="true"
          className="bg-accent-soft size-[7px] flex-none rotate-45 rounded-[2px] shadow-[0_0_8px_rgba(183,164,255,0.55)]"
        />
      )}
      {children}
    </span>
  );
}
