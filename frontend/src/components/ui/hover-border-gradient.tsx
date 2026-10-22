import type { ReactNode } from "react";

export function HoverBorderGradient({ children }: { children: ReactNode }) {
  return (
    <span className="group border-accent/20 bg-accent/5 relative isolate flex w-fit rounded-full border p-px">
      {/* No blur filter here: a blur over a spinning layer is redrawn on every frame, which made the hover stutter.
          The soft edge comes from the gradient's own wide stops instead. */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
        <span className="absolute top-1/2 left-1/2 aspect-square w-full -translate-1/2 animate-spin bg-[conic-gradient(from_-45deg,transparent,rgba(255,255,255,0.35)_25deg,white_45deg,rgba(255,255,255,0.35)_65deg,transparent_90deg)] will-change-transform [animation-duration:4s] motion-reduce:animate-none" />
        <span className="absolute inset-0 bg-[radial-gradient(75%_181%_at_50%_50%,#9b7cff,transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </span>
      {children}
    </span>
  );
}
