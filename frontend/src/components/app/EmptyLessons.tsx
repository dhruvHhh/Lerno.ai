import { HairlineFigure } from "@/components/ui/hairline-figure";
import abacus from "@/vendor/hairline/abacus.js";

// An abacus with every bead at zero: no lessons yet. Its own chunk, so users with lessons never load the drawing.
export default function EmptyLessons() {
  return (
    <div className="grid justify-items-center gap-1 px-2 pt-6 text-center">
      <HairlineFigure
        figure={abacus}
        tour={false}
        className="w-[200px] max-w-full [--hairline-plate:var(--color-surface)]"
      />
      <p className="text-muted-foreground text-xs">Your lessons will show here.</p>
    </div>
  );
}
