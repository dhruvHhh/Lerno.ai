import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface VisualProps {
  run: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const TRACE_SECONDS = 2.6;

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

const lightUp: Variants = {
  hidden: { color: "#737789" },
  shown: (delay = 0) => ({ color: "#f5f5f7", transition: { duration: 0.5, delay } }),
};

// One and a half waves of sin(x) across the animations frame, at progress p from 0 to 1.
const waveX = (p: number) => 40 + p * 340;

const waveY = (p: number) => 120 - 70 * Math.sin(p * Math.PI * 3);

const WAVE = Array.from({ length: 61 }, (_, i) => `${i ? "L" : "M"}${waveX(i / 60)} ${waveY(i / 60).toFixed(1)}`).join(
  " ",
);

const SCENES = [
  { title: "Draw the axes", at: 0.1 },
  { title: "Plot sin(x)", at: 0.4 },
  { title: "Trace the curve", at: 0.4 + TRACE_SECONDS },
];

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

// A dot that rides along the wave while it draws.
function Tracer({ run }: VisualProps) {
  const ref = useRef<SVGCircleElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    if (still || !run) return;
    const start = performance.now() + SCENES[1].at * 1000;
    let frame = 0;
    const step = (now: number) => {
      const dot = ref.current;
      const progress = Math.min(Math.max((now - start) / (TRACE_SECONDS * 1000), 0), 1);
      if (!dot) return;
      dot.setAttribute("cx", String(waveX(progress)));
      dot.setAttribute("cy", String(waveY(progress)));
      dot.style.opacity = now >= start ? "1" : "0";
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [run, still]);

  return (
    <circle
      ref={ref}
      cx={waveX(1)}
      cy={waveY(1)}
      r={5}
      fill="#efeaff"
      stroke="#9b7cff"
      strokeWidth={3}
      style={{ opacity: still ? 1 : 0 }}
    />
  );
}

export function AnimationsVisual({ run }: VisualProps) {
  return (
    <Stage run={run} className="h-full min-h-48 overflow-hidden rounded-xl border border-white/10 bg-[#101219]">
      <svg viewBox="0 0 400 260" fill="none" className="h-full w-full">
        <m.path variants={appear} custom={SCENES[0].at} d="M24 120H384M40 30V210" stroke="white" strokeOpacity={0.15} />
        <m.path
          d={WAVE}
          stroke="#b7a4ff"
          strokeWidth={3}
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0 },
            shown: { pathLength: 1, transition: { duration: TRACE_SECONDS, delay: SCENES[1].at, ease: "linear" } },
          }}
        />
        <Tracer run={run} />
      </svg>
      <div className="absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/10">
        <m.div
          className="bg-accent h-full origin-left"
          variants={{
            hidden: { scaleX: 0 },
            shown: { scaleX: 1, transition: { duration: TRACE_SECONDS + 0.4, ease: "linear" } },
          }}
        />
      </div>
    </Stage>
  );
}

// The lesson's scene list, shown beside the player in the wide card and lit in step with the drawing.
export function AnimationScenes({ run }: VisualProps) {
  return (
    <Stage run={run} className="h-auto">
      <ol className="flex flex-col gap-3 text-sm">
        {SCENES.map(({ title, at }, index) => (
          <m.li key={title} variants={lightUp} custom={at} className="flex items-center gap-3">
            <span className="relative grid size-6 shrink-0 place-items-center rounded-full border border-white/15 text-xs">
              <m.span variants={appear} custom={at} className="bg-accent absolute inset-0 rounded-full" />
              <span className="relative">{index + 1}</span>
            </span>
            {title}
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
      <div className="relative grid grid-cols-3 rounded-full border border-white/10 bg-white/3 p-1 text-center text-xs">
        <m.span
          className="bg-accent/20 border-accent/40 absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full border"
          initial={false}
          animate={{ x: `${active * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {LEVELS.map(({ name }, index) => (
          <span
            key={name}
            className={cn(
              "relative py-1.5 transition-colors duration-300",
              index === active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {name}
          </span>
        ))}
      </div>

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
      <div className="flex items-end gap-2.5">
        <m.span
          variants={fadeUp}
          custom={0.7}
          className="border-accent/40 bg-accent/15 grid size-7 shrink-0 place-items-center rounded-full border"
        >
          <span className="bg-accent-soft size-2 rounded-full" />
        </m.span>
        <m.p
          variants={fadeUp}
          custom={0.7}
          className="border-accent/30 bg-accent/8 text-secondary-foreground rounded-2xl rounded-bl-md border px-3.5 py-2 leading-relaxed"
        >
          {ANSWER.map((word, index) => (
            <m.span key={index} variants={appear} custom={1.1 + index * 0.08}>
              {word}{" "}
            </m.span>
          ))}
        </m.p>
      </div>
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
                  ? "border-accent/40 bg-accent/12 text-accent-soft"
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
        <div className="absolute inset-x-4 -top-2.5 bottom-2 rounded-xl border border-white/6 bg-[#0d0f15]" />
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
