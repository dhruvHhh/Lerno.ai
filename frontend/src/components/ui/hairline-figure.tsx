import { useEffect, useRef } from "react";

import HL, { type HairlineFigure as Figure } from "@/vendor/hairline/kernel.js";

// Mounts a drawing from the hairline-create skill; it plays its tour until a pointer arrives.
export function HairlineFigure({ figure, className }: { figure: Figure; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    HL.inject(document);
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    const drawing = figure.mount({ stage, svg, read: { textContent: "" } }, figure.range[1]);
    const playing = HL.reducedMotion() ? null : HL.tour(stage, figure.tour ?? HL.LAP, () => {});
    return () => {
      playing?.stop();
      drawing.destroy();
      svg.remove();
    };
  }, [figure]);

  return <div ref={ref} data-hairline={figure.name} role="img" aria-label={figure.means} className={className} />;
}
