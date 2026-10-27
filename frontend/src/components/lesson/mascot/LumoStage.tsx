import { SparkleIcon } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react";
import { useEffect, useRef, useState } from "react";

import Lumo, { type LumoState } from "@/components/lesson/mascot/Lumo";
import { WRONG_BEATS, XP, type Line } from "@/components/lesson/mascot/useLumoCheckpoints";
import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

// Lumo stands in a box sized for a check and rests smaller inside it, so growing never moves anything around it.
const REST = 0.76;
const GROW: Transition = { type: "spring", stiffness: 300, damping: 24 };
const POP: Transition = { type: "spring", stiffness: 520, damping: 32 };
const GONE: Transition = { duration: 0.12 };
const CHIP_MS = 1400;
// A bubble stays long enough to read.
const lifeOf = (text: string) => Math.min(4500, 1600 + text.length * 45);

// Lumo's poses, all transforms. The squash, the tilt and the head-shake are small: a wrong answer is an "oops", never
// a scolding.
const UPRIGHT = { scaleX: 1, scaleY: 1, y: "0%", rotate: 0 };
const DROOP = { scaleX: 1.04, scaleY: 0.94, y: "3%", rotate: -3 };
const HEAD_SHAKE = { ...DROOP, rotate: [-3, -5, 4, -2, 0] };
const HOP = { ...UPRIGHT, y: ["0%", "-9%", "1%", "0%"], scaleX: [1, 0.97, 1.03, 1], scaleY: [1, 1.05, 0.96, 1] };
const CUE_HOP = { ...UPRIGHT, y: ["0%", "-7%", "0%"] };
const SOFT: Transition = { type: "spring", stiffness: 260, damping: 18 };
// Decays, like a spring: each swing smaller than the last.
const SHAKE: Transition = { duration: 0.75, ease: "easeInOut", times: [0, 0.2, 0.5, 0.78, 1] };
// A little overshoot, for "you've got this".
const BOUNCE: Transition = { type: "spring", stiffness: 420, damping: 10 };
const CHEER: Transition = { duration: 0.6, ease: EASE_EXPO, times: [0, 0.35, 0.7, 1] };
// Two quick hops in the cue's second.
const CUE: Transition = { duration: 0.5, ease: "easeOut", repeat: Infinity };

// Outside the film, Lumo sits in a row under it, with the bubble to its right, until the lesson column is wide enough
// (`@6xl`, a container query on the column) for Lumo to stand left of the film, with the bubble above it. In the full
// screen film the bubble is above it too, and ends before the question card beside Lumo (on a phone held upright, the
// card is above them both). Each bubble's tail points at Lumo.
const PLACES = {
  outside: {
    body: "origin-bottom-left @6xl:origin-bottom-right",
    bubble:
      "left-full top-1/2 ml-3 -translate-y-1/2 origin-left max-w-[min(280px,calc(100vw-196px))] @6xl:left-auto @6xl:top-auto @6xl:right-0 @6xl:bottom-full @6xl:mb-2 @6xl:ml-0 @6xl:translate-y-0 @6xl:origin-bottom-right @6xl:max-w-full",
    tail: "left-0 top-1/2 -translate-1/2 @6xl:left-auto @6xl:top-full @6xl:right-8 @6xl:translate-x-0",
  },
  film: {
    body: "origin-bottom-left",
    bubble: "bottom-full left-[6%] mb-2 origin-bottom-left max-w-[240px] sm:max-w-[216px]",
    tail: "left-8 top-full -translate-y-1/2",
  },
};

interface LumoStageProps {
  state: LumoState;
  onDone: () => void;
  inFilm: boolean;
  // During a check Lumo stands at its full size.
  checking: boolean;
  // The second before a check: Lumo hops, with a "!".
  cue: boolean;
  // Lumo's reaction to an answer; a new id starts it from the top.
  reaction: { kind: "right" | "wrong"; id: string } | null;
  speech: { id: number; line: Line; text: string } | null;
  // The box's size and place.
  className?: string;
}

// Lumo with what goes around it. All of it is decoration: the question card says the same things to screen readers.
export default function LumoStage({
  state,
  onDone,
  inFilm,
  checking,
  cue,
  reaction,
  speech,
  className,
}: LumoStageProps) {
  const still = useReducedMotion() ?? false;
  const body = useRef<HTMLDivElement>(null);
  // The bubble and the chip leave on their own time; these hold which ones have gone. Lumo shown again, or moved into
  // the full screen film, starts quiet: what was said before it came is not said twice.
  const [said, setSaid] = useState(speech?.id ?? null);
  const [cheered, setCheered] = useState(speech?.id ?? null);
  // How far into its reaction Lumo is.
  const [beat, setBeat] = useState<{ id: string; step: number } | null>(null);
  const place = PLACES[inFilm ? "film" : "outside"];
  const speechId = speech?.id;
  const speechText = speech?.text;
  const cheer = speech?.line === "right" ? speech.id : null;
  const reactionId = reaction?.id;
  const kind = reaction?.kind;

  useEffect(() => {
    if (speechId === undefined || !speechText) return;
    const timer = window.setTimeout(() => setSaid(speechId), lifeOf(speechText));
    return () => window.clearTimeout(timer);
  }, [speechId, speechText]);

  useEffect(() => {
    if (cheer === null) return;
    const timer = window.setTimeout(() => setCheered(cheer), CHIP_MS);
    return () => window.clearTimeout(timer);
  }, [cheer]);

  // The wrong-answer beats: droop, head-shake, bounce back. A right answer is one hop.
  useEffect(() => {
    if (!reactionId || still) return;
    const beats = kind === "wrong" ? [WRONG_BEATS.droop, WRONG_BEATS.headShake, WRONG_BEATS.recover] : [0];
    const timers = beats.map((ms, k) => window.setTimeout(() => setBeat({ id: reactionId, step: k + 1 }), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reactionId, kind, still]);

  const step = beat && beat.id === reactionId ? beat.step : 0;
  let pose: TargetAndTransition = UPRIGHT;
  let move: Transition = SOFT;
  if (cue) [pose, move] = [CUE_HOP, CUE];
  else if (kind === "wrong" && step === 1) pose = DROOP;
  else if (kind === "wrong" && step === 2) pose = HEAD_SHAKE;
  else if (kind === "wrong" && step === 3) move = BOUNCE;
  else if (kind === "right" && step) [pose, move] = [HOP, CHEER];

  const showSpeech = !cue && speech && said !== speech.id;
  const showChip = !still && cheer !== null && cheered !== cheer;
  const scale = checking ? 1 : REST;
  // Only while it moves, so the browser keeps no layer for it at rest.
  const moving = (on: boolean) => body.current?.style.setProperty("will-change", on ? "transform" : "auto");

  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative", className)}>
      <m.div
        ref={body}
        className={cn("size-full", place.body)}
        initial={false}
        animate={still ? { scale } : { scale, ...pose }}
        transition={
          still
            ? { duration: 0 }
            : { scale: GROW, default: move, rotate: kind === "wrong" && step === 2 ? SHAKE : move }
        }
        onAnimationStart={() => moving(true)}
        onAnimationComplete={() => moving(false)}
      >
        <Lumo state={state} onDone={onDone} className="size-full" />
      </m.div>

      {/* The "!" leaves the instant the check starts. */}
      <AnimatePresence>
        {cue && (
          <m.span
            key="cue"
            initial={still ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={POP}
            className="border-accent/70 bg-surface text-accent-soft absolute top-[4%] right-[6%] grid size-7 origin-bottom-left place-items-center rounded-full border text-sm font-bold"
          >
            !
          </m.span>
        )}
      </AnimatePresence>

      {/* One bubble at a time: a new line waits for the last to go. */}
      <AnimatePresence mode="wait">
        {showSpeech && (
          <m.span
            key={speech.id}
            initial={still ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.9, transition: GONE }}
            transition={still ? { duration: 0 } : POP}
            className={cn("absolute z-10 w-max", place.bubble)}
          >
            <span className={cn("border-accent/60 bg-surface absolute size-2.5 rotate-45 border", place.tail)} />
            <span className="border-accent/60 bg-surface text-foreground rounded-row relative block border px-2.5 py-1.5 text-xs leading-snug shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              {/* Clamped inside the padding, so no cut line shows below the last one. */}
              <span className="line-clamp-3">{speech.text}</span>
            </span>
          </m.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChip && (
          <m.span
            key={cheer}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -32, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              y: { duration: 1.3, ease: EASE_EXPO },
              scale: POP,
              opacity: { duration: 1.3, times: [0, 0.15, 0.65, 1] },
            }}
            // From Lumo's chest, and it fades before reaching the bubble over its head.
            className="bg-accent text-background absolute top-[42%] left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
          >
            <SparkleIcon weight="fill" aria-hidden="true" className="size-3" />+{XP} XP
          </m.span>
        )}
      </AnimatePresence>
    </div>
  );
}
