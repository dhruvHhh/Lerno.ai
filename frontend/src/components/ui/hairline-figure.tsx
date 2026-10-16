import { useEffect, useRef } from "react";

import HL, { type HairlineFigure as Figure } from "@/vendor/hairline/kernel.js";

interface HairlineFigureProps {
  figure: Figure;
  className?: string;
  // Beside other content, a figure waits for a pointer instead of playing its tour.
  tour?: boolean;
}

// Mounts a drawing from the hairline-create skill; it plays its tour until a pointer arrives.
export function HairlineFigure({ figure, className, tour = true }: HairlineFigureProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    HL.inject(document);
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    const drawing = figure.mount({ stage, svg, read: { textContent: "" } }, figure.range[1]);
    const playing = !tour || HL.reducedMotion() ? null : HL.tour(stage, figure.tour ?? HL.LAP, () => {});
    return () => {
      playing?.stop();
      drawing.destroy();
      svg.remove();
    };
  }, [figure, tour]);

  return <div ref={ref} data-hairline={figure.name} role="img" aria-label={figure.means} className={className} />;
}
