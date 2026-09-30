import type { ReactNode } from "react";

export default function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-linear-to-r from-[#a996ff] via-[#efeaff] via-40% to-[#e2b6ff] bg-clip-text whitespace-nowrap text-transparent drop-shadow-[0_0_24px_rgba(155,124,255,0.35)]">
      {children}
    </span>
  );
}
