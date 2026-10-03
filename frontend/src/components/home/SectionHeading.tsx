import type { ReactNode } from "react";

import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

interface SectionHeadingProps {
  tag: string;
  title: ReactNode;
  children: ReactNode;
}

export default function SectionHeading({ tag, title, children }: SectionHeadingProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <HoverBorderGradient>
        <span className="bg-accent-surface text-accent-soft rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.2em] uppercase">
          {tag}
        </span>
      </HoverBorderGradient>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="text-secondary-foreground mt-4 max-w-2xl text-base sm:text-lg">{children}</p>
    </div>
  );
}
