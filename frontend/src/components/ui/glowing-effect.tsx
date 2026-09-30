import { memo, useCallback, useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const GRADIENT =
  "repeating-conic-gradient(from 236.84deg at 50% 50%, #9b7cff 0%, #e2b6ff 5%, #efeaff 10%, #7657e8 15%, #9b7cff 20%)";

interface GlowingEffectProps {
  spread?: number;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
  className?: string;
}

const GlowingEffect = memo(
  ({ spread = 80, proximity = 64, inactiveZone = 0.01, borderWidth = 3, className }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const frame = useRef(0);

    const handleMove = useCallback(
      (e?: PointerEvent) => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          if (e) lastPosition.current = { x: e.clientX, y: e.clientY };
          const { x, y } = lastPosition.current;

          const centerX = left + width / 2;
          const centerY = top + height / 2;
          const inCenter = Math.hypot(x - centerX, y - centerY) < 0.5 * Math.min(width, height) * inactiveZone;
          const isNear =
            x > left - proximity && x < left + width + proximity && y > top - proximity && y < top + height + proximity;

          element.style.setProperty("--glow-active", isNear && !inCenter ? "1" : "0");
          if (!isNear || inCenter) return;

          const current = parseFloat(element.style.getPropertyValue("--glow-angle")) || 0;
          const target = (180 * Math.atan2(y - centerY, x - centerX)) / Math.PI + 90;
          const diff = ((((target - current + 180) % 360) + 360) % 360) - 180;
          element.style.setProperty("--glow-angle", String(current + diff));
        });
      },
      [inactiveZone, proximity],
    );

    useEffect(() => {
      if (!window.matchMedia("(hover: hover)").matches) return;

      const onScroll = () => handleMove();
      window.addEventListener("scroll", onScroll, { passive: true });
      document.body.addEventListener("pointermove", handleMove, { passive: true });

      return () => {
        cancelAnimationFrame(frame.current);
        window.removeEventListener("scroll", onScroll);
        document.body.removeEventListener("pointermove", handleMove);
      };
    }, [handleMove]);

    return (
      <div
        ref={containerRef}
        style={
          { "--glow-spread": spread, "--glow-border": `${borderWidth}px`, "--glow-gradient": GRADIENT } as CSSProperties
        }
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] [transition:--glow-angle_2s_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
      >
        <div className="rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glow-border))] after:rounded-[inherit] after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--glow-angle)-var(--glow-spread))*1deg),#0000_0deg,#fff,#0000_calc(var(--glow-spread)*2deg))] after:[mask-composite:intersect] after:[mask-clip:padding-box,border-box] after:opacity-(--glow-active) after:transition-opacity after:duration-300 after:content-[''] after:[background:var(--glow-gradient)] after:[border:var(--glow-border)_solid_transparent]" />
      </div>
    );
  },
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
