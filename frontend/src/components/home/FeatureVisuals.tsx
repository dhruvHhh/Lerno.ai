import { BookmarkSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LogoIcon } from "@/components/Logo";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RAISED_KEY } from "@/lib/styles";
import { cn } from "@/lib/utils";

export interface VisualProps {
  run: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const LEVEL_MS = 2400;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: EASE } }),
};

const appear: Variants = {
  hidden: { opacity: 0 },
  shown: (delay = 0) => ({ opacity: 1, transition: { duration: 0.4, delay } }),
};

const sweep: Variants = {
  hidden: { scaleX: 0 },
  shown: (delay = 0) => ({ scaleX: 1, transition: { duration: 0.8, delay, ease: EASE } }),
};

const fadeOut: Variants = {
  hidden: { opacity: 1 },
  shown: (delay = 0) => ({ opacity: 0, transition: { duration: 0.3, delay } }),
};

const lightUp: Variants = {
  hidden: { color: "#737789" },
  shown: (delay = 0) => ({ color: "#f5f5f7", transition: { duration: 0.5, delay } }),
};

// One and a half waves of sin(x) across the animations frame, at progress p from 0 to 1 (x from 0 to 3π).
const waveX = (p: number) => 40 + p * 340;

const waveY = (p: number) => 120 - 70 * Math.sin(p * Math.PI * 3);

// Angle of the curve at p, so the tangent line can be turned to match.
const slopeAngle = (p: number) => (Math.atan2(-70 * 3 * Math.PI * Math.cos(p * Math.PI * 3), 340) * 180) / Math.PI;

const WAVE = Array.from({ length: 61 }, (_, i) => `${i ? "L" : "M"}${waveX(i / 60)} ${waveY(i / 60).toFixed(1)}`).join(
  " ",
);

const X_TICKS = [
  { p: 1 / 3, label: "π" },
  { p: 2 / 3, label: "2π" },
  { p: 1, label: "3π" },
];

const SCENES = [
  { title: "Draw the axes", time: "0:00", at: 0.1, end: 0.6 },
  { title: "Plot sin(x)", time: "0:04", at: 0.6, end: 3.2 },
  { title: "Find the slope", time: "0:11", at: 3.6, end: 6.4 },
];

const [, PLOT, SLOPE] = SCENES;

// Where the tangent comes to rest, short of the frame's edge.
const SLOPE_RANGE = [0.04, 0.94];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// y = x² from 0 to 2 inside a 72×56 thumbnail.
const thumbX = (u: number) => 6 + u * 30;

const thumbY = (u: number) => 50 - 11 * u * u;

const THUMB_CURVE = Array.from(
  { length: 21 },
  (_, i) => `${i ? "L" : "M"}${thumbX(i / 10)} ${thumbY(i / 10).toFixed(1)}`,
).join(" ");

const SQUARES = Array.from({ length: 6 }, (_, col) =>
  Array.from({ length: 4 }, (_, row) => ({ x: 6 + col * 10, y: 40 - row * 10 })).filter(
    ({ y }) => thumbY((col * 10) / 30) <= y,
  ),
).flat();

const STRIPS = [0, 0.5, 1, 1.5].map((u) => ({ x: thumbX(u), height: 50 - thumbY(u) }));

const LEVELS = [
  { name: "School", explanation: "Count the squares that fit under the curve." },
  { name: "High school", explanation: "Add up thin rectangles under y = x²." },
  { name: "College", explanation: "∫₀² x² dx = 8⁄3" },
];

const LEVEL_NAMES = LEVELS.map(({ name }) => name);

const ANSWER = "They hug the curve, so the gaps shrink and the sum gets closer to the true area.".split(" ");

const TOPIC_ROWS = [
  ["Derivatives", "Eigenvectors", "Bayes' theorem", "Fourier series", "Limits", "Vectors"],
  ["Integrals", "Probability", "Matrices", "Taylor series", "Complex numbers", "Trigonometry"],
  ["Geometry", "Differential equations", "Statistics", "Sequences", "Logarithms", "Linear maps"],
];

// Plays its children's "shown" variants each time `run` changes; reduced motion shows the end state at once.
function Stage({ run, className, children }: VisualProps & { className?: string; children: ReactNode }) {
  const still = useReducedMotion();
  return (
    <m.div
      key={run}
      aria-hidden="true"
      initial={still ? false : "hidden"}
      animate={still || run ? "shown" : "hidden"}
      className={cn("relative h-48", className)}
    >
      {children}
    </m.div>
  );
}

// The sine wave drawing itself with a dot at its tip, then the dot sweeping back along it with its tangent line.
// Wave, dot and tangent all run off one clock so they stay in step.
function SineDrawing({ run }: VisualProps) {
  const waveRef = useRef<SVGPathElement>(null);
  const ref = useRef<SVGGElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    if (still || !run) return;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const wave = waveRef.current;
      const rider = ref.current;
      const line = lineRef.current;
      if (!wave || !rider || !line) return;
      const time = (now - start) / 1000;
      const plotted = clamp01((time - PLOT.at) / (PLOT.end - PLOT.at));
      const sloping = time >= SLOPE.at;
      const progress = sloping
        ? SLOPE_RANGE[0] + clamp01((time - SLOPE.at) / (SLOPE.end - SLOPE.at)) * (SLOPE_RANGE[1] - SLOPE_RANGE[0])
        : plotted;
      wave.style.strokeDashoffset = String(1 - plotted);
      rider.setAttribute(
        "transform",
        `translate(${waveX(progress)} ${waveY(progress)}) rotate(${slopeAngle(progress)})`,
      );
      rider.style.opacity = time >= PLOT.at ? "1" : "0";
      line.style.opacity = sloping ? "1" : "0";
      if (time < SLOPE.end) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [run, still]);

  const rest = SLOPE_RANGE[1];
  return (
    <>
      <path
        ref={waveRef}
        d={WAVE}
        pathLength={1}
        strokeDasharray="1 1"
        stroke="#b7a4ff"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ strokeDashoffset: still ? 0 : 1 }}
      />
      <g
        ref={ref}
        transform={`translate(${waveX(rest)} ${waveY(rest)}) rotate(${slopeAngle(rest)})`}
        style={{ opacity: still ? 1 : 0 }}
      >
        <line
          ref={lineRef}
          x1={-44}
          x2={44}
          stroke="#efeaff"
          strokeOpacity={0.75}
          strokeWidth={2}
          strokeLinecap="round"
          className="transition-opacity duration-300"
          style={{ opacity: still ? 1 : 0 }}
        />
        <circle r={5} fill="#efeaff" stroke="#9b7cff" strokeWidth={3} />
      </g>
    </>
  );
}

export function AnimationsVisual({ run }: VisualProps) {
  return (
    <Stage run={run} className="h-full min-h-48 overflow-hidden rounded-xl border border-white/10 bg-[#101219]">
      <svg viewBox="0 0 400 260" fill="none" className="h-full w-full">
        <m.g variants={appear} custom={SCENES[0].at} stroke="white" strokeOpacity={0.18}>
          <path d="M24 120H392M40 34V206" />
          {X_TICKS.map(({ p }) => (
            <path key={p} d={`M${waveX(p)} 115V125`} />
          ))}
          <path d="M35 50H45M35 190H45" />
        </m.g>
        <m.g variants={appear} custom={SCENES[0].end} fill="white" fillOpacity={0.45} fontSize={13} textAnchor="middle">
          {X_TICKS.map(({ p, label }) => (
            <text key={label} x={waveX(p)} y={144}>
              {label}
            </text>
          ))}
        </m.g>
        <m.text
          variants={appear}
          custom={PLOT.end}
          x={waveX(1 / 6) + 18}
          y={waveY(1 / 6) - 4}
          fill="#b7a4ff"
          fontSize={14}
        >
          sin x
        </m.text>
        <SineDrawing run={run} />
      </svg>
      <div className="absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/10">
        <m.div
          className="bg-accent h-full origin-left"
          variants={{
            hidden: { scaleX: 0 },
            shown: { scaleX: 1, transition: { duration: SLOPE.end, ease: "linear" } },
          }}
        />
      </div>
    </Stage>
  );
}

// The lesson's scene list with its timestamps, beside the player in the wide card: each step lights up as its
// scene starts and gets a check when it ends.
export function AnimationScenes({ run }: VisualProps) {
  return (
    <Stage run={run} className="h-auto">
      <ol className="flex flex-col gap-3 text-sm">
        {SCENES.map(({ title, time, at, end }, index) => (
          <m.li key={title} variants={lightUp} custom={at} className="flex items-center gap-3">
            <span className="relative grid size-6 shrink-0 place-items-center rounded-full text-xs ring-1 ring-white/15">
              <m.span variants={appear} custom={at} className={cn("absolute inset-0 rounded-full", RAISED_KEY)} />
              <m.span variants={fadeOut} custom={end} className="relative">
                {index + 1}
              </m.span>
              <m.span variants={appear} custom={end} className="text-accent-soft absolute">
                <CheckIcon weight="bold" className="size-3" />
              </m.span>
            </span>
            <span className="flex-1">{title}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{time}</span>
          </m.li>
        ))}
      </ol>
    </Stage>
  );
}

function LevelThumb({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 72 56" fill="none" className="h-[4.5rem] w-24 shrink-0">
      {level === 0 &&
        SQUARES.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x + 0.75}
            y={y + 0.75}
            width={8.5}
            height={8.5}
            rx={1.5}
            fill="#9b7cff"
            fillOpacity={0.35}
          />
        ))}
      {level === 1 &&
        STRIPS.map(({ x, height }) => (
          <rect
            key={x}
            x={x}
            y={50 - height}
            width={15}
            height={height}
            fill="#9b7cff"
            fillOpacity={0.4}
            stroke="#101219"
          />
        ))}
      {level === 2 && <path d={`${THUMB_CURVE} V50 Z`} fill="#9b7cff" fillOpacity={0.35} />}
      <path d="M4 50H68" stroke="white" strokeOpacity={0.25} />
      <path d={THUMB_CURVE} stroke="#b7a4ff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// Steps School → High school → College once per run, then stays on College.
function LevelSwitcher({ playing }: { playing: boolean }) {
  const [active, setActive] = useState(playing ? 0 : LEVELS.length - 1);

  useEffect(() => {
    if (!playing) return;
    const timers = [1, 2].map((level) => window.setTimeout(() => setActive(level), level * LEVEL_MS));
    return () => timers.forEach(window.clearTimeout);
  }, [playing]);

  return (
    <div className="flex h-full flex-col justify-end gap-3">
      <SegmentedControl options={LEVEL_NAMES} selected={active} className="w-full auto-cols-fr" />

      <div className="flex h-24 items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#101219] px-4">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="flex flex-1 items-center gap-4"
          >
            <p
              className={cn(
                "flex-1 text-sm leading-relaxed",
                active === 2 ? "text-foreground text-lg" : "text-secondary-foreground",
              )}
            >
              {LEVELS[active].explanation}
            </p>
            <LevelThumb level={active} />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LevelsVisual({ run }: VisualProps) {
  const still = useReducedMotion();
  return (
    <Stage run={run}>
      <LevelSwitcher playing={!still && run > 0} />
    </Stage>
  );
}

export function TutorVisual({ run }: VisualProps) {
  return (
    <Stage run={run} className="flex flex-col justify-center gap-3 text-sm">
      <m.p
        variants={fadeUp}
        className="self-end rounded-2xl rounded-br-md border border-white/10 bg-white/6 px-3.5 py-2"
      >
        Why do thinner strips help?
      </m.p>
      <m.div variants={fadeUp} custom={0.7} className="flex items-start gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
          <LogoIcon className="size-4" />
        </span>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Lerno tutor</p>
          <p className="text-secondary-foreground rounded-2xl rounded-tl-md border border-white/10 bg-white/4 px-3.5 py-2 leading-relaxed">
            {ANSWER.map((word, index) => (
              <m.span key={index} variants={appear} custom={1.1 + index * 0.08}>
                {word}{" "}
              </m.span>
            ))}
          </p>
        </div>
      </m.div>
    </Stage>
  );
}

export function TopicsVisual() {
  return (
    <div
      aria-hidden="true"
      className="-mx-5 flex h-48 flex-col justify-center gap-2.5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]"
    >
      {TOPIC_ROWS.map((row, index) => (
        <div
          key={row[0]}
          className="animate-marquee flex w-max motion-reduce:animate-none"
          style={{ animationDuration: `${40 + index * 8}s`, animationDirection: index % 2 ? "reverse" : "normal" }}
        >
          {[...row, ...row].map((topic, position) => (
            <span
              key={position}
              className={cn(
                "mr-2.5 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap",
                position % row.length === index * 2
                  ? cn("text-foreground border-transparent", RAISED_KEY)
                  : "text-secondary-foreground border-white/10 bg-white/3",
              )}
            >
              {topic}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function NotesVisual({ run }: VisualProps) {
  return (
    <Stage run={run} className="grid place-items-center">
      <div className="relative w-full max-w-xs">
        <m.div
          variants={fadeUp}
          className="relative isolate rounded-xl border border-white/10 bg-[#101219] p-4 text-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs tabular-nums">
              Note · Scene 2 · <span className="text-accent-soft">0:14</span>
            </span>
            <m.span variants={fadeUp} custom={1.8}>
              <BookmarkSimpleIcon weight="fill" className="text-accent size-4" />
            </m.span>
          </div>
          <p className="mt-2 font-medium">Area under a curve</p>
          <p className="text-secondary-foreground mt-1 leading-relaxed">
            Left-edge rectangles{" "}
            <span className="text-foreground relative">
              <m.span
                variants={sweep}
                custom={1}
                className="bg-accent/30 absolute -inset-x-0.5 inset-y-0 -z-10 origin-left rounded-sm"
              />
              underestimate
            </span>{" "}
            the area while the curve is rising.
          </p>
        </m.div>
      </div>
    </Stage>
  );
}
