import { READY, STEPS, SWAP, useStepLabel } from "@/components/making/steps";
import { cn } from "@/lib/utils";

// Plan sits at the top and Ready at the bottom; the work runs down the stack.
// The slab's centre x, half width, half depth and thickness; the gap between slabs and the bottom slab's y.
const CX = 400;
const A = 120;
const H = 60;
const T = 18;
const GAP = 80;
const BASE = 360;
const cy = (step: number) => BASE - (READY - step) * GAP;
const pts = (list: number[][]) => list.map((p) => p.join(",")).join(" ");
const rhombus = (y: number, a: number, h: number) => [
  [CX, y - h],
  [CX + a, y],
  [CX, y + h],
  [CX - a, y],
];

const LAYER = "opacity-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)]";

// One look per state. Gradients can't fade into each other, so each look is a layer that fades in over the base.
const LOOKS = {
  base: {
    top: "url(#slab-top)",
    left: "url(#slab-left)",
    right: "url(#slab-right)",
    edge: "rgba(255,255,255,.07)",
    side: "rgba(255,255,255,.04)",
    inset: "rgba(255,255,255,.05)",
    rim: "rgba(255,255,255,.13)",
  },
  done: {
    top: "url(#slab-top-done)",
    edge: "rgba(183,164,255,.22)",
    inset: "rgba(183,164,255,.14)",
    rim: "rgba(183,164,255,.5)",
  },
  lit: {
    top: "url(#slab-top-lit)",
    left: "url(#slab-left-lit)",
    right: "url(#slab-right-lit)",
    edge: "rgba(214,204,255,.5)",
    side: "rgba(214,204,255,.15)",
    inset: "rgba(214,204,255,.4)",
    rim: "#ddd4ff",
  },
  failed: {
    top: "url(#slab-top-failed)",
    edge: "rgba(255,127,122,.3)",
    inset: "rgba(255,127,122,.25)",
    rim: "rgba(255,127,122,.7)",
  },
};

function Faces({ y, look, rimClass }: { y: number; look: (typeof LOOKS)[keyof typeof LOOKS]; rimClass?: string }) {
  return (
    <>
      {"left" in look && (
        <>
          <polygon
            points={pts([
              [CX - A, y],
              [CX, y + H],
              [CX, y + H + T],
              [CX - A, y + T],
            ])}
            fill={look.left}
            stroke={look.side}
          />
          <polygon
            points={pts([
              [CX, y + H],
              [CX + A, y],
              [CX + A, y + T],
              [CX, y + H + T],
            ])}
            fill={look.right}
            stroke={look.side}
          />
        </>
      )}
      <polygon points={pts(rhombus(y, A, H))} fill={look.top} stroke={look.edge} />
      <polygon points={pts(rhombus(y, A * 0.7, H * 0.7))} fill="none" stroke={look.inset} />
      <polyline
        points={pts([
          [CX - A, y],
          [CX, y + H],
          [CX + A, y],
        ])}
        fill="none"
        stroke={look.rim}
        strokeWidth={1.2}
        strokeLinecap="round"
        className={rimClass}
      />
    </>
  );
}

interface SlabStackProps {
  step: number;
  failed: boolean;
  // On a phone the drawing crops to the stack and the step reads under it instead.
  compact: boolean;
}

export default function SlabStack({ step, failed, compact }: SlabStackProps) {
  const { label, swapping } = useStepLabel(step, failed);
  const ready = step === READY && !failed;

  return (
    <svg
      viewBox={compact ? "225 0 350 470" : "0 0 800 470"}
      role="img"
      aria-label={`${label[0]}: ${label[1]}`}
      className="block h-auto w-full overflow-visible"
    >
      <defs>
        {[
          ["slab-top", "#171a27", "#0c0e16"],
          ["slab-left", "#0d0f17", "#07080c"],
          ["slab-right", "#11131d", "#090a10"],
          ["slab-top-done", "#1e1c38", "#11111f"],
          ["slab-top-lit", "#5a4bb0", "#2a2356"],
          ["slab-left-lit", "#231e48", "#141130"],
          ["slab-right-lit", "#2d2659", "#191538"],
          ["slab-top-failed", "#2a161c", "#140c10"],
        ].map(([id, from, to]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
        <filter id="slab-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {/* A soft shadow and a dashed floor plate anchor the stack. */}
      <ellipse cx={CX} cy={BASE + H + T + 6} rx={150} ry={40} fill="#000" opacity={0.6} filter="url(#slab-soft)" />
      <polygon
        points={pts(rhombus(BASE + T + 14, A * 1.35, H * 1.35))}
        fill="none"
        stroke="rgba(183,164,255,.12)"
        strokeDasharray="2 6"
      />

      {/* Painted bottom first, so each higher slab covers the one under it. */}
      {STEPS.map((_, pos) => {
        const s = READY - pos;
        const y = cy(s);
        return (
          <g key={s}>
            {pos > 0 &&
              [CX - A, CX + A].map((x) => (
                <line key={x} x1={x} y1={y + T} x2={x} y2={y + GAP} stroke="rgba(183,164,255,.12)" />
              ))}
            <g className={cn(LAYER, s === step && !failed && "opacity-100")}>
              <ellipse
                cx={CX}
                cy={y + H * 0.4}
                rx={A * 0.9}
                ry={H * 0.7}
                fill="#7a60e6"
                opacity={0.55}
                filter="url(#slab-soft)"
                className="motion-safe:animate-breathe"
              />
            </g>
            <Faces y={y} look={LOOKS.base} />
            <g className={cn(LAYER, (s < step || (s === READY && ready)) && "opacity-100")}>
              <Faces y={y} look={LOOKS.done} />
            </g>
            <g className={cn(LAYER, s === step && !failed && "opacity-100")}>
              <Faces y={y} look={LOOKS.lit} rimClass="motion-safe:animate-rim" />
            </g>
            <g className={cn(LAYER, s === step && failed && "opacity-100")}>
              <Faces y={y} look={LOOKS.failed} />
            </g>
          </g>
        );
      })}

      {/* The connector, spinner and label follow the active slab. */}
      {!compact && (
        <g
          style={{ transform: `translateY(${cy(step)}px)` }}
          className="transition-transform duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          <line
            x1={522}
            y1={0}
            x2={576}
            y2={0}
            stroke="rgba(183,164,255,.5)"
            strokeDasharray="3 4"
            className="motion-safe:animate-march"
          />
          <circle
            cx={590}
            cy={0}
            r={10}
            fill="none"
            strokeWidth={2}
            stroke={failed ? "rgba(255,127,122,.3)" : "rgba(183,164,255,.2)"}
          />
          <circle
            cx={590}
            cy={0}
            r={10}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            stroke={failed ? "#ff7f7a" : "#b7a4ff"}
            strokeDasharray={failed || ready ? undefined : "14 40"}
            className={cn("origin-center [transform-box:fill-box]", !failed && !ready && "motion-safe:animate-spin")}
          />
          <g className={cn(SWAP, swapping && "opacity-0 blur-[6px]")}>
            <text x={612} y={-3} className="fill-foreground text-[20px] font-semibold tracking-[-0.01em]">
              {label[0]}
            </text>
            <text x={612} y={17} className="fill-secondary-foreground text-[13px]">
              {label[1]}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
