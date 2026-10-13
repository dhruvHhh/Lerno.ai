import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, m, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";

import { LogoIcon } from "@/components/brand/Logo";
import PlayerBar from "@/components/lesson/PlayerBar";
import { SegmentedDisplay } from "@/components/ui/segmented-display";
import { lessonById, NOTE_AT, shareOf } from "@/content/demo-lessons";
import { RAISED_KEY } from "@/lib/styles";
import { cn, formatTime } from "@/lib/utils";
import { appear, fadeUp, sweep } from "@/lib/variants";

// True while on screen, unless motion is reduced.
function useAmbient(ref: RefObject<Element | null>) {
  const inView = useInView(ref, { amount: 0.3 });
  const still = useReducedMotion();
  return inView && !still;
}

const CALM = [0.45, 0, 0.55, 1] as const;

const DRAW_DELAY = 0.4;

const DRAW_TIME = 2.6;

const draw: Variants = {
  hidden: { pathLength: 0 },
  shown: { pathLength: 1, transition: { duration: DRAW_TIME, delay: DRAW_DELAY, ease: CALM } },
};

// sin(x) for x from 0 to 3π, at progress p from 0 to 1.
const waveX = (p: number) => 40 + p * 570;

const waveY = (p: number) => 100 - 62 * Math.sin(p * Math.PI * 3);

const slopeAngle = (p: number) => (Math.atan2(-62 * 3 * Math.PI * Math.cos(p * Math.PI * 3), 570) * 180) / Math.PI;

const WAVE = Array.from({ length: 61 }, (_, i) => `${i ? "L" : "M"}${waveX(i / 60)} ${waveY(i / 60).toFixed(1)}`).join(
  " ",
);

const X_TICKS = [
  { p: 1 / 3, label: "π" },
  { p: 2 / 3, label: "2π" },
  { p: 1, label: "3π" },
];

const GRID = [
  ...Array.from({ length: 7 }, (_, i) => `M${waveX(i / 6)} 26V174`),
  `M24 ${waveY(1 / 6)}H624`,
  `M24 ${waveY(1 / 2)}H624`,
].join("");

const GLIDE_S = 10;

const REST_S = 1;

const GLIDE_RANGE = [0.04, 0.96];

const SINE_LESSON = lessonById("derivatives");

export function AnimationsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const gliderRef = useRef<SVGGElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const playing = useAmbient(ref);
  // Wait for the curve to finish drawing before the dot sets off.
  const [drawn, setDrawn] = useState(false);
  const [second, setSecond] = useState(0);
  // Kept across pauses, so scrolling back resumes.
  const elapsed = useRef(0);

  useEffect(() => {
    if (!playing || !drawn) return;
    const start = performance.now() - elapsed.current * 1000;
    let frame = 0;
    const step = (now: number) => {
      const glider = gliderRef.current;
      const bar = barRef.current;
      if (!glider || !bar) return;
      elapsed.current = (now - start) / 1000;
      const time = elapsed.current % (GLIDE_S + REST_S);
      const eased = (1 - Math.cos(Math.min(time / GLIDE_S, 1) * Math.PI)) / 2;
      const p = GLIDE_RANGE[0] + eased * (GLIDE_RANGE[1] - GLIDE_RANGE[0]);
      glider.setAttribute("transform", `translate(${waveX(p)} ${waveY(p)}) rotate(${slopeAngle(p)})`);
      glider.style.opacity = String(Math.min(time / 0.6, 1, Math.max((GLIDE_S + REST_S * 0.6 - time) / 0.6, 0)));
      // A CSS variable moves the bar each frame; state updates once a second.
      bar.style.setProperty("--progress", `${p * 100}%`);
      setSecond(Math.floor(p * SINE_LESSON.duration));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, drawn]);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0c12]">
      <p className="text-muted-foreground border-b border-white/6 px-4 py-2.5 text-xs">
        Lerno · <span className="text-secondary-foreground">{SINE_LESSON.title}</span>
      </p>
      <div className="relative">
        <p className="absolute top-3 left-4 flex items-center gap-2 text-xs font-medium">
          <span className="bg-accent h-3.5 w-0.5 rounded-full" />
          Slope of sin x
        </p>
        <p className="text-muted-foreground absolute top-3 right-4 font-serif text-xs italic">
          slope = <span className="text-accent-soft">cos x</span>
        </p>
        <svg viewBox="0 0 640 200" fill="none" className="h-36 w-full">
          <path d={GRID} stroke="white" strokeOpacity={0.04} />
          <g stroke="white" strokeOpacity={0.16}>
            <path d="M24 100H624M40 26V174" />
            {X_TICKS.map(({ p }) => (
              <path key={p} d={`M${waveX(p)} 95V105`} />
            ))}
          </g>
          <g fill="white" fillOpacity={0.4} fontSize={16} textAnchor="middle">
            {X_TICKS.map(({ p, label }) => (
              <text key={label} x={waveX(p)} y={126}>
                {label}
              </text>
            ))}
          </g>
          <m.path
            variants={draw}
            onAnimationComplete={(definition) => definition === "shown" && setDrawn(true)}
            d={WAVE}
            stroke="#b7a4ff"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <m.text
            variants={appear}
            custom={DRAW_DELAY + DRAW_TIME}
            x={waveX(1 / 2)}
            y={waveY(1 / 2) + 30}
            fill="#b7a4ff"
            fontSize={18}
            fontFamily="Georgia, serif"
            fontStyle="italic"
            textAnchor="middle"
          >
            y = sin x
          </m.text>
          <g ref={gliderRef} style={{ opacity: 0 }}>
            <line x1={-46} x2={46} stroke="#efeaff" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
            <circle r={5.5} fill="#efeaff" stroke="#9b7cff" strokeWidth={3} />
          </g>
        </svg>
      </div>
      <PlayerBar
        ref={barRef}
        playing
        progress={0}
        time={second}
        duration={SINE_LESSON.duration}
        className="px-4 pb-3"
      />
    </div>
  );
}

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

const LEVEL_MS = 4500;

function LevelThumb({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 72 56" fill="none" className="h-14 w-18 shrink-0">
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
            stroke="#0b0c12"
          />
        ))}
      {level === 2 && <path d={`${THUMB_CURVE} V50 Z`} fill="#9b7cff" fillOpacity={0.35} />}
      <path d="M4 50H68" stroke="white" strokeOpacity={0.25} />
      <path d={THUMB_CURVE} stroke="#b7a4ff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function LevelsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = useAmbient(ref);
  const [active, setActive] = useState(1);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setActive((level) => (level + 1) % LEVELS.length), LEVEL_MS);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <m.div ref={ref} variants={fadeUp} className="flex flex-col gap-3">
      <SegmentedDisplay options={LEVEL_NAMES} selected={active} className="w-full auto-cols-fr" />
      <div className="grid h-24 items-center overflow-hidden rounded-xl border border-white/10 bg-[#0b0c12] px-4">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
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
    </m.div>
  );
}

export function TutorChat({ question, answer, at = 0 }: { question: string; answer: string[]; at?: number }) {
  return (
    <>
      <m.p
        variants={fadeUp}
        custom={at}
        className="self-end rounded-2xl rounded-br-md border border-white/10 bg-white/6 px-3.5 py-2"
      >
        {question}
      </m.p>
      <m.div variants={fadeUp} custom={at + 0.7} className="flex items-start gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
          <LogoIcon className="size-4" />
        </span>
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Lerno tutor</p>
          <p className="text-secondary-foreground rounded-2xl rounded-tl-md border border-white/10 bg-white/4 px-3.5 py-2 leading-relaxed">
            {answer.map((word, index) => (
              <m.span key={index} variants={appear} custom={at + 1.1 + index * 0.08}>
                {word}{" "}
              </m.span>
            ))}
          </p>
        </div>
      </m.div>
    </>
  );
}

const CHATS = [
  {
    question: "Why do thinner strips help?",
    answer: "They hug the curve, so the gaps shrink and the sum gets closer to the true area.",
  },
  {
    question: "What does the slope tell me?",
    answer: "How fast the curve rises there. At the top of sin x the slope is zero.",
  },
  {
    question: "Is 8/3 exact?",
    answer: "Yes. It is the limit of the sums as the strips become infinitely thin.",
  },
].map(({ question, answer }) => ({ question, answer: answer.split(" ") }));

const CHAT_MS = 8000;

export function TutorVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = useAmbient(ref);
  // Only the first exchange waits for the cell's entrance.
  const [round, setRound] = useState(0);
  const chat = round % CHATS.length;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setRound((count) => count + 1), CHAT_MS);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div ref={ref} className="grid text-sm">
      <AnimatePresence>
        <m.div
          key={round}
          initial={round ? "hidden" : undefined}
          animate={round ? "shown" : undefined}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="col-start-1 row-start-1 flex flex-col gap-3"
        >
          <TutorChat {...CHATS[chat]} at={round ? 0.6 : 0.2} />
        </m.div>
      </AnimatePresence>
    </div>
  );
}

const TOPIC_ROWS = [
  { seconds: 60, topics: ["Derivatives", "Eigenvectors", "Bayes' theorem", "Fourier series", "Limits", "Vectors"] },
  { seconds: 70, topics: ["Integrals", "Probability", "Matrices", "Taylor series", "Complex numbers", "Trigonometry"] },
  {
    seconds: 65,
    topics: ["Geometry", "Differential equations", "Statistics", "Sequences", "Logarithms", "Linear maps"],
  },
];

const PICKS = ["Eigenvectors", "Probability", "Differential equations"];

export function TopicsVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = useAmbient(ref);

  return (
    <m.div
      ref={ref}
      variants={appear}
      className="flex flex-col gap-2.5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]"
    >
      {TOPIC_ROWS.map(({ seconds, topics }, index) => (
        // The list is doubled and slides half its width, so the loop is seamless.
        <div
          key={topics[0]}
          className={cn(
            "animate-marquee flex w-max motion-reduce:animate-none",
            !playing && "[animation-play-state:paused]",
          )}
          style={{ animationDuration: `${seconds}s`, animationDirection: index % 2 ? "reverse" : "normal" }}
        >
          {[...topics, ...topics].map((topic, position) => (
            <span
              key={position}
              className={cn(
                "mr-2.5 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap",
                PICKS.includes(topic)
                  ? cn("text-foreground border-transparent", RAISED_KEY)
                  : "text-secondary-foreground border-white/10 bg-white/3",
              )}
            >
              {topic}
            </span>
          ))}
        </div>
      ))}
    </m.div>
  );
}

const AREA_LESSON = lessonById("integrals");

const NOTE_SHARE = shareOf(NOTE_AT, AREA_LESSON);

// The glow peaks at 50%, so shift it to peak as the playhead hits the note.
const NOTE_LOOP_S = 12;

const NOTE_LOOP = { animationDuration: `${NOTE_LOOP_S}s` };

const GLOW = { ...NOTE_LOOP, animationDelay: `${(NOTE_AT / AREA_LESSON.duration - 0.5) * NOTE_LOOP_S}s` };

export function NotesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const playing = useAmbient(ref);

  return (
    <div ref={ref} className="flex max-w-xs flex-col gap-4 pb-5">
      <m.div
        variants={fadeUp}
        style={GLOW}
        className={cn(
          "animate-note-glow relative isolate rounded-xl border border-white/10 bg-[#0b0c12] p-4 text-sm motion-reduce:animate-none",
          !playing && "[animation-play-state:paused]",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs tabular-nums">
            Note · Scene 2 · <span className="text-accent-soft">{formatTime(NOTE_AT)}</span>
          </span>
          <BookmarkSimpleIcon weight="fill" className="text-accent size-4" />
        </div>
        <p className="mt-2 font-medium">Area under a curve</p>
        <p className="text-secondary-foreground mt-1 leading-relaxed">
          Left-edge rectangles{" "}
          <span className="text-foreground relative">
            <m.span
              variants={sweep}
              custom={0.8}
              className="bg-accent/30 absolute -inset-x-0.5 inset-y-0 -z-10 origin-left rounded-sm"
            />
            underestimate
          </span>{" "}
          the area while the curve is rising.
        </p>
      </m.div>
      <m.div variants={appear} custom={0.4} className="relative h-1 rounded-full bg-white/10">
        <span
          style={NOTE_LOOP}
          className={cn(
            "animate-playhead bg-accent/60 absolute inset-0 origin-left rounded-full motion-reduce:hidden",
            !playing && "[animation-play-state:paused]",
          )}
        />
        <span
          className="bg-accent-soft absolute top-1/2 size-2 -translate-1/2 rounded-full ring-2 ring-[#050609]"
          style={{ left: NOTE_SHARE }}
        />
        <span className="text-muted-foreground absolute top-3 left-0 text-[11px] tabular-nums">0:00</span>
        <span
          className="text-accent-soft absolute top-3 -translate-x-1/2 text-[11px] font-medium tabular-nums"
          style={{ left: NOTE_SHARE }}
        >
          {formatTime(NOTE_AT)}
        </span>
        <span className="text-muted-foreground absolute top-3 right-0 text-[11px] tabular-nums">
          {formatTime(AREA_LESSON.duration)}
        </span>
      </m.div>
    </div>
  );
}
