import type { ReactNode } from "react";

export default function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-brand-gradient bg-clip-text whitespace-nowrap text-transparent drop-shadow-[0_0_24px_rgba(155,124,255,0.35)]">
      {children}
    </span>
  );
}
