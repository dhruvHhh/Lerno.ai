import { ArrowRightIcon, BookmarkSimpleIcon, GridFourIcon, PercentIcon, TimerIcon } from "@phosphor-icons/react";
import { m, useInView, useReducedMotion, type Target, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { TutorChat } from "@/components/home/FeatureVisuals";
import LessonPlayer from "@/components/lesson/LessonPlayer";
import PlayerBar from "@/components/lesson/PlayerBar";
import { SegmentedDisplay } from "@/components/ui/segmented-control";
import { DEMO_LESSONS, NOTE_AT, shareOf } from "@/content/demo-lessons";
import { KEY } from "@/lib/styles";
import { cn, formatTime } from "@/lib/utils";
import { appear, fadeOut, fadeUp } from "@/lib/variants";

const LESSON = DEMO_LESSONS[0];

const press: Variants = {
  hidden: { scale: 1 },
  shown: (delay = 0) => ({ scale: [1, 0.92, 1], transition: { duration: 0.35, delay } }),
};

interface WindowProps {
  title: string;
  className?: string;
  children: ReactNode;
}

function Window({ title, className, children }: WindowProps) {
  return (
    <m.div
      variants={fadeUp}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-linear-to-b from-[#14151f] to-[#0b0c12] text-sm shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/6 px-4 py-2.5 text-xs">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-2 rounded-full bg-white/12" />
          ))}
        </span>
        <span className="text-muted-foreground">
          Lerno · <span className="text-secondary-foreground">{title}</span>
        </span>
      </div>
      {children}
    </m.div>
  );
}

const QUESTION = "Why is the area under y = x² from 0 to 2 equal to 8/3?";

const TYPE_START = 0.5;

const TYPE_GAP = 0.03;

const TYPED = TYPE_START + QUESTION.length * TYPE_GAP;

// Untyped letters are out of the layout, so the caret follows the text.
const typed: Variants = {
  hidden: { display: "none" },
  shown: (delay = 0) => ({ display: "inline", transition: { delay } }),
};

const LEVELS = ["School", "High school", "College"];

const RECENT = [
  ...DEMO_LESSONS.slice(1),
  { id: "bayes", title: "Explain Bayes' theorem", topic: "Probability", icon: PercentIcon },
  { id: "eigen", title: "What is an eigenvector?", topic: "Linear algebra", icon: GridFourIcon },
];

export function AskPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const still = useReducedMotion();
  const [level, setLevel] = useState(still ? 1 : 0);

  useEffect(() => {
    if (!inView || still) return;
    const timer = setTimeout(() => setLevel(1), (TYPED + 0.3) * 1000);
    return () => clearTimeout(timer);
  }, [inView, still]);

  return (
    <Window title="New lesson">
      <div ref={ref} aria-hidden="true" className="flex flex-col gap-5 p-5 sm:p-6">
        <p className="min-h-16 text-xl leading-snug font-medium tracking-tight sm:text-2xl">
          {[...QUESTION].map((char, index) => (
            <m.span key={index} variants={typed} custom={TYPE_START + index * TYPE_GAP}>
              {char}
            </m.span>
          ))}
          <span className="bg-accent animate-caret ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-[0.15em] motion-reduce:animate-none" />
        </p>

        <SegmentedDisplay options={LEVELS} selected={level} />

        <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-5">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <TimerIcon className="size-3.5" />
            About 1 min · Animated
          </span>
          <m.span
            variants={press}
            custom={TYPED + 1}
            className="bg-foreground text-background flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium shadow-[0_0_24px_rgba(155,124,255,0.25)]"
          >
            Generate lesson
            <ArrowRightIcon weight="bold" className="size-3" />
          </m.span>
        </div>

        <div className="hidden sm:block">
          <p className="text-muted-foreground mb-2 text-xs">Recent</p>
          <ul className="flex flex-col">
            {RECENT.map(({ id, title, topic, icon: LessonIcon }) => (
              <li key={id} className="flex items-center gap-3 border-t border-white/5 py-2.5 first:border-t-0">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", KEY)}>
                  <LessonIcon className="text-accent-soft size-3.5" />
                </span>
                <span className="text-secondary-foreground flex-1 truncate">{title}</span>
                <span className="text-muted-foreground text-xs">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Window>
  );
}

const FRAMES = [
  "/videos/area-under-curve-shade.webp",
  "/videos/area-under-curve-slice.webp",
  "/videos/area-under-curve-thin.webp",
];

// Round the boundaries, not the lengths, so the total still matches.
const BOUNDARIES = [...LESSON.scenes.map(({ at }) => at), LESSON.duration].map(Math.round);

const TOTAL = BOUNDARIES[BOUNDARIES.length - 1];

const SWEEP_START = 0.6;

const SWEEP_S = 7;

const sweepAt = (second: number) => SWEEP_START + (second / TOTAL) * SWEEP_S;

const SCENES = LESSON.scenes.map(({ title, narration }, index) => ({
  title,
  narration,
  src: FRAMES[index],
  seconds: BOUNDARIES[index + 1] - BOUNDARIES[index],
  // The last scene stays lit, like its narration.
  phase: {
    starts: sweepAt(BOUNDARIES[index]),
    ends: sweepAt(BOUNDARIES[index + 1]),
    last: index === LESSON.scenes.length - 1,
  },
}));

interface Phase {
  starts: number;
  ends: number;
  last: boolean;
}

const phases = (
  key: "opacity" | "color",
  before: string | number,
  active: string | number,
  after: string | number,
): Variants => {
  // TypeScript widens computed keys to string, so type it by hand.
  const style = (value: string | number | (string | number)[]) => ({ [key]: value }) as Target;
  return {
    hidden: style(before),
    shown: ({ starts, ends, last }: Phase) => {
      if (last) return { ...style(active), transition: { delay: starts, duration: 0.3 } };
      const edge = Math.min(0.3 / (ends - starts), 0.5);
      return {
        ...style([before, active, active, after]),
        transition: { delay: starts, duration: ends - starts, times: [0, edge, 1 - edge, 1] },
      };
    },
  };
};

const ring = phases("opacity", 0, 1, 0);

const dim = phases("opacity", 0, 0, 1);

const titleColor = phases("color", "#737789", "#f5f5f7", "#a7aab8");

const playhead: Variants = {
  hidden: { left: "0%", opacity: 1 },
  shown: {
    left: "100%",
    opacity: 0,
    transition: {
      left: { duration: SWEEP_S, delay: SWEEP_START, ease: "linear" },
      opacity: { duration: 0.5, delay: SWEEP_START + SWEEP_S + 0.2 },
    },
  },
};

const build: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  shown: ({ starts, ends }: Phase) => ({
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: ends - starts, delay: starts, ease: "linear" },
  }),
};

export function PlanPanel() {
  const still = useReducedMotion();
  const timecodeRef = useRef<HTMLSpanElement>(null);

  const showTime = ({ left }: { left?: string }) => {
    if (timecodeRef.current && left) timecodeRef.current.textContent = formatTime((parseFloat(left) / 100) * TOTAL);
  };

  return (
    <Window title="Planning lesson">
      <div aria-hidden="true" className="flex flex-col gap-6 p-5 sm:p-6">
        <div>
          <p className="text-xl font-medium tracking-tight sm:text-2xl">{LESSON.title}</p>
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            High school · {SCENES.length} scenes ·{" "}
            <span ref={timecodeRef} className="text-secondary-foreground">
              {formatTime(still ? TOTAL : 0)}
            </span>
          </p>
        </div>

        <div>
          <div className="relative">
            {/* The lesson's background behind each frame hides letterbox bars. */}
            <ol className="flex h-24 gap-px overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10 sm:h-32">
              {SCENES.map(({ title, src, seconds, phase }) => (
                <li key={title} className="group relative bg-[#050609]" style={{ flex: `${seconds} 1 0` }}>
                  <m.img
                    variants={build}
                    custom={phase}
                    src={src}
                    alt=""
                    className="absolute inset-0 size-full object-contain"
                  />
                  <m.span variants={dim} custom={phase} className="absolute inset-0 bg-[#050609]/45" />
                  <m.span
                    variants={ring}
                    custom={phase}
                    className="bg-accent/8 ring-accent/70 absolute inset-0 ring-2 ring-inset group-first:rounded-l-lg group-last:rounded-r-lg"
                  />
                </li>
              ))}
            </ol>
            <m.span
              variants={playhead}
              onUpdate={showTime}
              className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(183,164,255,0.8)] motion-reduce:hidden"
            />
          </div>
          <ol className="mt-2.5 flex gap-px text-xs">
            {SCENES.map(({ title, seconds, phase }) => (
              <m.li
                key={title}
                variants={titleColor}
                custom={phase}
                className="min-w-0 pr-2 leading-snug"
                style={{ flex: `${seconds} 1 0` }}
              >
                {title}
              </m.li>
            ))}
          </ol>
        </div>

        {/* Narrations share one spot; each fades out before the next fades in. */}
        <div className="border-accent/50 grid border-l-2 pl-4 *:col-start-1 *:row-start-1">
          {SCENES.map(({ title, narration, phase }, index) => (
            <m.div key={title} variants={appear} custom={phase.starts}>
              <m.div variants={phase.last ? undefined : fadeOut} custom={phase.ends - 0.35}>
                <p className="text-muted-foreground mb-1.5 text-xs">Scene {index + 1} · Narration</p>
                <p className="text-secondary-foreground leading-relaxed">{narration}</p>
              </m.div>
            </m.div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function WatchPanel() {
  const [second, setSecond] = useState(0);
  const playing = LESSON.scenes.findLastIndex(({ at }) => at <= second);

  return (
    <Window title={LESSON.title}>
      <div className="p-3">
        <LessonPlayer lesson={LESSON} onSecond={setSecond} />
      </div>
      <ol className="px-3 pb-3">
        {LESSON.scenes.map(({ at, title }, index) => (
          <li
            key={title}
            aria-current={index === playing ? "step" : undefined}
            className={cn(
              "flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors duration-500",
              index === playing ? "text-foreground bg-white/5" : "text-muted-foreground",
            )}
          >
            <span className="w-8 text-xs tabular-nums">{formatTime(at)}</span>
            <span className="flex-1">{title}</span>
            {index === playing && <span className="text-accent-soft text-xs">Playing</span>}
          </li>
        ))}
      </ol>
    </Window>
  );
}

const ANSWER =
  "Each rectangle takes its height from the left edge of its strip. While the curve rises, that is the lowest point, so the total comes out a little low.".split(
    " ",
  );

const PAUSED_SHARE = shareOf(NOTE_AT, LESSON);

const TUTOR_AT = 0.3;

const NOTE_REVEAL = TUTOR_AT + 1.1 + ANSWER.length * 0.08 + 0.4;

export function ExplorePanel() {
  return (
    <Window title={LESSON.title}>
      <div aria-hidden="true" className="flex flex-col gap-4 p-5">
        {/* Wider than 16:9 so the answer clears the bottom fade. */}
        <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-white/10 sm:aspect-2/1">
          <img src="/videos/area-under-curve-strips.webp" alt="" className="size-full object-cover object-[50%_30%]" />
          <PlayerBar
            playing={false}
            progress={NOTE_AT / LESSON.duration}
            time={NOTE_AT}
            duration={LESSON.duration}
            className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black to-transparent px-3 pt-8 pb-2.5"
          />
          <m.div
            variants={fadeUp}
            custom={NOTE_REVEAL}
            style={{ left: PAUSED_SHARE }}
            className="absolute bottom-11 max-w-[60%] -translate-x-1/2 rounded-lg border border-white/10 bg-[#101219]/95 px-3 py-2 text-xs leading-relaxed shadow-lg backdrop-blur"
          >
            <span className="text-accent-soft flex items-center gap-1.5 font-medium">
              <BookmarkSimpleIcon weight="fill" className="size-3" />
              Note · {formatTime(NOTE_AT)}
            </span>
            <span className="text-secondary-foreground mt-0.5 hidden sm:block">
              Left edges underestimate while the curve rises.
            </span>
          </m.div>
        </div>

        <div className="flex flex-col gap-3">
          <TutorChat question="Why use the left edge?" answer={ANSWER} at={TUTOR_AT} />
        </div>
      </div>
    </Window>
  );
}
