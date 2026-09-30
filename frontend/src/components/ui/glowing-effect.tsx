import { useEffect, useRef, type CSSProperties } from "react";

const GRADIENT =
  "repeating-conic-gradient(from 236.84deg at 50% 50%, #9b7cff 0%, #e2b6ff 5%, #efeaff 10%, #7657e8 15%, #9b7cff 20%)";

const SPREAD = 80;

const PROXIMITY = 64;

const INACTIVE_ZONE = 0.01;

const BORDER_WIDTH = 3;

// One shared pointer/scroll listener serves every visible card, reading all rects before writing any styles.
const visibleGlows = new Set<HTMLElement>();
const pointer = { x: 0, y: 0 };
let frame = 0;

function updateGlows() {
  frame = 0;
  const measured = [...visibleGlows].map((glow) => ({ glow, rect: glow.getBoundingClientRect() }));

  for (const { glow, rect } of measured) {
    const { left, top, width, height } = rect;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const inCenter =
      Math.hypot(pointer.x - centerX, pointer.y - centerY) < 0.5 * Math.min(width, height) * INACTIVE_ZONE;
    const isNear =
      pointer.x > left - PROXIMITY &&
      pointer.x < left + width + PROXIMITY &&
      pointer.y > top - PROXIMITY &&
      pointer.y < top + height + PROXIMITY;
    const active = isNear && !inCenter;

    glow.style.setProperty("--glow-active", active ? "1" : "0");
    if (!active) continue;

    const current = parseFloat(glow.style.getPropertyValue("--glow-angle")) || 0;
    const target = (180 * Math.atan2(pointer.y - centerY, pointer.x - centerX)) / Math.PI + 90;
    const diff = ((((target - current + 180) % 360) + 360) % 360) - 180;
    glow.style.setProperty("--glow-angle", String(current + diff));
  }
}

function scheduleUpdate() {
  frame ||= requestAnimationFrame(updateGlows);
}

function trackPointer(event: PointerEvent) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  scheduleUpdate();
}

function showGlow(glow: HTMLElement) {
  if (!visibleGlows.size) {
    document.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
  }
  visibleGlows.add(glow);
}

function hideGlow(glow: HTMLElement) {
  visibleGlows.delete(glow);
  glow.style.setProperty("--glow-active", "0");
  if (visibleGlows.size) return;
  document.removeEventListener("pointermove", trackPointer);
  window.removeEventListener("scroll", scheduleUpdate);
  cancelAnimationFrame(frame);
  frame = 0;
}

export function GlowingEffect() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || !window.matchMedia("(hover: hover)").matches) return;

    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? showGlow(glow) : hideGlow(glow)), {
      rootMargin: `${PROXIMITY}px`,
    });
    observer.observe(glow);
    return () => {
      observer.disconnect();
      hideGlow(glow);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={
        { "--glow-spread": SPREAD, "--glow-border": `${BORDER_WIDTH}px`, "--glow-gradient": GRADIENT } as CSSProperties
      }
      className="pointer-events-none absolute inset-0 rounded-[inherit] [transition:--glow-angle_2s_var(--ease-snappy)]"
    >
      <div className="rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glow-border))] after:rounded-[inherit] after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--glow-angle)-var(--glow-spread))*1deg),#0000_0deg,#fff,#0000_calc(var(--glow-spread)*2deg))] after:[mask-composite:intersect] after:[mask-clip:padding-box,border-box] after:opacity-(--glow-active) after:transition-opacity after:duration-300 after:content-[''] after:[background:var(--glow-gradient)] after:[border:var(--glow-border)_solid_transparent]" />
    </div>
  );
}
