import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface HoverBorderGradientProps {
  children: ReactNode;
  className?: string;
}

export function HoverBorderGradient({ children, className }: HoverBorderGradientProps) {
  return (
    <span
      className={cn(
        "group border-accent/20 bg-accent/5 relative isolate flex w-fit rounded-full border p-px",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit] blur-[2px]">
        <span className="absolute top-1/2 left-1/2 aspect-square w-full -translate-1/2 animate-spin bg-[conic-gradient(from_-45deg,transparent,white_45deg,transparent_90deg)] [animation-duration:4s] motion-reduce:animate-none" />
        <span className="absolute inset-0 bg-[radial-gradient(75%_181%_at_50%_50%,#9b7cff,transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      {children}
    </span>
  );
}
