import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

const SCENES = ["Shade the area", "Slice into strips", "Thinner strips"];

const ORIGIN = { x: 44, y: 118 };

const UNIT = { x: 100, y: 25 };

const DRAW = 1.4;

const EASE = [0.22, 1, 0.36, 1] as const;

const DRAW_EASE = [0.65, 0, 0.35, 1] as const;

const COLORS = { axis: "#58c4dd", curve: "#f7d96f", area: "#1f5a4a", strip: "#c46a2a" };

const toX = (x: number) => ORIGIN.x + x * UNIT.x;

const toY = (y: number) => ORIGIN.y - y * UNIT.y;

// y = x² from 0 to 2 is exactly one quadratic Bézier with its control point at (1, 0), so the curve is perfectly smooth.
const CURVE = `M${toX(0)} ${toY(0)} Q${toX(1)} ${toY(0)} ${toX(2)} ${toY(4)}`;

const AREA = `${CURVE} V${ORIGIN.y} Z`;

// Left-edge rectangles under y = x² from 0 to 2, like the lesson's Riemann sums.
const strips = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const x = (i * 2) / count;
    return { x: toX(x), width: (2 / count) * UNIT.x, height: x * x * UNIT.y };
  });

const STRIPS = [strips(4), strips(16)];

const SUMS = ["Sum = 1.75", "Sum → 8/3"];

// Step 2 of How it works: the plan of the step 3 lesson, drawing each scene in turn.
export default function PlanDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  // Remembers the first time it was seen, so the drawing starts once and stays drawn while off screen.
  const [started, setStarted] = useState(false);
  if (inView && !started) setStarted(true);
  const still = !!useReducedMotion();
  const [scene, setScene] = useState(0);
  const animated = (from: number) => from === scene && !still;

  const draw = (from: number) =>
    animated(from)
      ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: DRAW, ease: DRAW_EASE } }
      : {};

  const fade = (from: number, delay: number) =>
    animated(from) ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, delay } } : {};

  const grow = (from: number, delay: number) =>
    animated(from)
      ? { initial: { scaleY: 0 }, animate: { scaleY: 1 }, transition: { duration: 0.6, delay, ease: EASE } }
      : {};

  return (
    <div
      ref={ref}
      role="group"
      aria-label="The lesson plan for the area under a curve"
      className="flex h-full flex-col"
    >
      {/* Each scene is its own drawing; the previous one fades out underneath as the next one draws in. */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false}>
          <m.svg
            key={scene}
            viewBox="0 0 300 130"
            fill="none"
            aria-hidden="true"
            shapeRendering="geometricPrecision"
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="absolute inset-0 h-full w-full px-3 pt-3"
          >
            {started && (
              <>
                <m.path d={AREA} fill={COLORS.area} fillOpacity={0.7} {...fade(0, DRAW)} />
                {scene > 0 &&
                  STRIPS[scene - 1].map(({ x, width, height }, i) => (
                    <m.rect
                      key={x}
                      x={x}
                      y={ORIGIN.y - height}
                      width={width}
                      height={height}
                      fill={COLORS.strip}
                      rx={1}
                      stroke="black"
                      strokeWidth={0.5}
                      style={{ originY: 1 }}
                      {...grow(scene, 0.2 + i * (scene === 1 ? 0.25 : 0.06))}
                    />
                  ))}
                <path
                  d={`M${ORIGIN.x - 8} ${ORIGIN.y}H290M${ORIGIN.x} ${ORIGIN.y + 8}V8`}
                  stroke={COLORS.axis}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                />
                <m.path d={CURVE} stroke={COLORS.curve} strokeWidth={2.5} strokeLinecap="round" {...draw(0)} />
                <m.text x={toX(2) + 8} y={toY(4) + 10} fill={COLORS.curve} fontSize={11} {...fade(0, DRAW)}>
                  y = x²
                </m.text>
                {scene > 0 && (
                  <m.text x={toX(0) + 10} y={20} fill="white" fontSize={11} {...fade(scene, 1)}>
                    {SUMS[scene - 1]}
                  </m.text>
                )}
              </>
            )}
          </m.svg>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pt-2 pb-3">
        {SCENES.map((title, index) => (
          <button
            key={title}
            type="button"
            aria-pressed={index === scene}
            onClick={() => setScene(index)}
            className={cn(
              "cursor-pointer text-left text-xs transition-colors duration-300",
              index === scene ? "text-foreground" : "text-muted-foreground hover:text-secondary-foreground",
            )}
          >
            <span className="block h-0.5 overflow-hidden rounded-full bg-white/10">
              <span
                onAnimationEnd={index === scene ? () => setScene((index + 1) % SCENES.length) : undefined}
                className={cn(
                  "bg-accent block h-full origin-left",
                  index < scene && "opacity-50",
                  index > scene && "scale-x-0",
                  index === scene && "animate-scene-fill motion-reduce:animate-none",
                  index === scene && !inView && "[animation-play-state:paused]",
                )}
              />
            </span>
            <span className="mt-2 block leading-snug">{title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
