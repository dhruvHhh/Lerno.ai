import { PlayIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

interface MathCardProps {
  image: string;
  title: string;
  subtitle: string;
  className?: string;
}

export default function MathCard({ image, title, subtitle, className }: MathCardProps) {
  return (
    <div
      className={cn(
        "math-card bg-surface/50 hover:border-border-active absolute hidden w-56 rounded-2xl border border-white/10 p-4 shadow-2xl backdrop-blur-sm transition-colors xl:block",
        className,
      )}
    >
      {/* "screen" blending hides the illustration's black background. */}
      <img src={image} alt={`${title} illustration`} className="h-24 w-full object-contain mix-blend-screen" />
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-foreground font-semibold">{title}</p>
          <p className="text-secondary-foreground text-xs">{subtitle}</p>
        </div>
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-white/10">
          <PlayIcon weight="fill" className="text-foreground size-3.5" />
        </span>
      </div>
    </div>
  );
}
