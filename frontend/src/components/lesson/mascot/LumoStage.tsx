import { SparkleIcon } from "@phosphor-icons/react";
import {
  AnimatePresence,
  m,
  useReducedMotion,
  type ResolvedValues,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import Lumo, { type LumoState } from "@/components/lesson/mascot/Lumo";
import type { LumoPlacement } from "@/components/lesson/mascot/lumoPlacement";
import { STAGE_BEATS, WRONG_BEATS, XP, type Line } from "@/components/lesson/mascot/useLumoCheckpoints";
import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

const POP: Transition = { type: "spring", stiffness: 520, damping: 32 };
// Back into its tail.
const SHRINK: Transition = { duration: 0.18, ease: "easeIn" };
const CHIP_MS = 1400;
// A bubble stays long enough to read.
const lifeOf = (text: string) => Math.min(4500, 1600 + text.length * 45);
const s = (ms: number) => ms / 1000;
const { hiddenScale, peekDepth, standDepth, nod, exit } = STAGE_BEATS;
// Down from where Lumo stands, as a share of its clip.
const below = (share: number) => `${(standDepth + share) * 100}%`;

// Lumo's poses. Its floor is the top of the player's controls; between checks it waits below that floor, faded out and
// a little smaller, and standing its whole body is on the floor: no pose sinks it through. The squash, the tilt and the
// head-shake are small: a wrong answer is an "oops", never a scolding.
const STAND = { opacity: 1, scaleX: 1, scaleY: 1, y: below(0), rotate: 0 };
const HIDDEN = { opacity: 0, scaleX: hiddenScale, scaleY: hiddenScale, y: "100%", rotate: 0 };
const PEEK = { ...STAND, y: `${peekDepth * 100}%` };
// Up from the peek: stretching as it rises, a soft squash as it lands, then upright.
const ENTER = { ...STAND, scaleX: [null, 0.95, 1.06, 0.99, 1], scaleY: [null, 1.07, 0.92, 1.01, 1] };
// A small nod, then a slide back below the floor, fading and shrinking a little.
const EXIT = { ...HIDDEN, y: [null, below(0.03), below(0), "100%"], rotate: [null, 5, 0, 0] };
// Opacity is named in every pose: a value left out goes back to its starting one, which is the hidden pose's 0.
const DROOP = { opacity: 1, scaleX: 1.04, scaleY: 0.94, y: below(0), rotate: -3 };
const HEAD_SHAKE = { ...DROOP, rotate: [-3, -5, 4, -2, 0] };
const HOP = {
  ...STAND,
  y: [below(0), below(-0.09), below(0), below(0)],
  scaleX: [1, 0.97, 1.03, 1],
  scaleY: [1, 1.05, 0.96, 1],
};

// The springs reach their place this far into their beat; the rest of the beat is the settle.
const ARRIVE = 0.75;
// The peek: a soft spring with a tiny settle, fading in over its first part.
const PEEKING: Transition = {
  default: { type: "spring", visualDuration: s(STAGE_BEATS.peek * ARRIVE), bounce: 0.15 },
  opacity: { duration: s(STAGE_BEATS.peekFade), ease: "easeOut" },
};
// The rest of the way up, with a gentle overshoot. Lumo stretches as it rises and squashes softly as it arrives.
const RISE: Transition = { type: "spring", visualDuration: s(STAGE_BEATS.rise * ARRIVE), bounce: 0.25 };
const LANDING: Transition = { duration: s(STAGE_BEATS.rise), ease: "easeInOut", times: [0, 0.35, 0.75, 0.9, 1] };
const RISING: Transition = {
  default: RISE,
  opacity: { duration: s(STAGE_BEATS.peekFade), ease: "easeOut" },
  scaleX: LANDING,
  scaleY: LANDING,
};
const nodAt = nod / exit;
const slide = s(exit - nod);
const SLIDE: Transition = { duration: slide, ease: "easeIn", delay: s(nod) };
const LEAVING: Transition = {
  default: { duration: s(exit), times: [0, nodAt / 2, nodAt, 1], ease: ["easeOut", "easeInOut", "easeIn"] },
  opacity: { duration: slide * 0.7, ease: "easeIn", delay: s(nod) + slide * 0.3 },
  scaleX: SLIDE,
  scaleY: SLIDE,
};
const SOFT: Transition = { type: "spring", stiffness: 260, damping: 18 };
// Decays, like a spring: each swing smaller than the last.
const SHAKE: Transition = { duration: 0.75, ease: "easeInOut", times: [0, 0.2, 0.5, 0.78, 1] };
// A little overshoot, for "you've got this".
const BOUNCE: Transition = { type: "spring", stiffness: 420, damping: 10 };
const CHEER: Transition = { duration: 0.6, ease: EASE_EXPO, times: [0, 0.35, 0.7, 1] };
// Reduced motion: a gentle fade and a small drift, nothing else.
const FADE: Transition = { duration: s(STAGE_BEATS.fade), ease: "easeOut" };

// Lumo's bubble, which grows out of its tail, pointing at Lumo's head: above its head, starting where its body does,
// or out to the right of it, from just under its eyes up. Placed on Lumo's clip as if it stood fully up; the layer
// it sits in follows Lumo down into its floor.
const BUBBLES = {
  above: {
    bubble: "bottom-[73%] left-[29%] mb-2 origin-[1.25rem_100%]",
    tail: "left-4 top-full -translate-y-1/2 [clip-path:polygon(100%_0,100%_100%,0_100%,0_calc(100%_-_2px),calc(100%_-_2px)_0)]",
  },
  side: {
    bubble: "bottom-[48%] left-[71%] ml-3 origin-[0_calc(100%-0.875rem)]",
    tail: "left-0 bottom-2.5 -translate-x-1/2 [clip-path:polygon(0_0,2px_0,100%_calc(100%_-_2px),100%_100%,0_100%)]",
  },
};

interface LumoStageProps {
  state: LumoState;
  onDone: () => void;
  // Where Lumo stands at the film's bottom-left corner, how big it is and where its bubble goes.
  place: LumoPlacement;
  // Out of sight between checks, peeking in for the cue, standing in view for the check.
  presence: "hidden" | "peek" | "in";
  // Lumo's reaction to an answer; a new id starts it from the top.
  reaction: { kind: "right" | "wrong"; id: string } | null;
  speech: { id: number; line: Line; text: string } | null;
  className?: string;
}

// Lumo with what goes around it. All of it is decoration: the question card says the same things to screen readers.
export default function LumoStage({ state, onDone, place, presence, reaction, speech, className }: LumoStageProps) {
  const still = useReducedMotion() ?? false;
  const body = useRef<HTMLDivElement>(null);
  // The bubble and the chip leave on their own time; these hold which ones have gone. Lumo moved into the full screen
  // film starts quiet: what was said before is not said twice.
  const [said, setSaid] = useState(speech?.id ?? null);
  const [cheered, setCheered] = useState(speech?.id ?? null);
  // How far into its reaction Lumo is.
  const [beat, setBeat] = useState<{ id: string; step: number } | null>(null);
  // Whether Lumo has finished going out of sight; its clips rest only then, so it never freezes on its way out.
  const [gone, setGone] = useState(presence === "hidden");
  if (presence !== "hidden" && gone) setGone(false);
  // The "!" holds a moment into the entrance before what Lumo says takes over.
  const [saying, setSaying] = useState(presence === "in");
  if (presence !== "in" && saying) setSaying(false);
  const spot = BUBBLES[place.bubble];
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
    if (presence !== "in" || saying) return;
    const timer = window.setTimeout(() => setSaying(true), STAGE_BEATS.say);
    return () => window.clearTimeout(timer);
  }, [presence, saying]);

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
  let pose: TargetAndTransition = STAND;
  let move: Transition = SOFT;
  if (presence === "hidden") [pose, move] = gone ? [HIDDEN, { duration: 0 }] : [EXIT, LEAVING];
  else if (presence === "peek") [pose, move] = [PEEK, PEEKING];
  else if (kind === "wrong" && step === 1) pose = DROOP;
  else if (kind === "wrong" && step === 2) [pose, move] = [HEAD_SHAKE, { default: SOFT, rotate: SHAKE }];
  else if (kind === "wrong" && step === 3) move = BOUNCE;
  else if (kind === "right" && step) [pose, move] = [HOP, CHEER];
  else if (!kind) [pose, move] = [ENTER, RISING];

  // One bubble at a time: the "!" of the cue, then what Lumo says; a new line crossfades in the same bubble.
  const line =
    presence === "peek" || (presence === "in" && !saying)
      ? { id: "cue", text: "!" }
      : presence === "in" && speech && said !== speech.id
        ? { id: String(speech.id), text: speech.text }
        : null;
  // The bubble grows out a beat after Lumo starts to move.
  const bubbleLead = presence === "peek" && !still ? s(STAGE_BEATS.bubble) : 0;
  // The bubble rides along with Lumo's head: low while it peeks, up with it as it rises, down with it as it leaves.
  const bubbleMove: Transition = still ? { duration: 0 } : presence === "in" ? RISE : SLIDE;
  const showChip = !still && presence === "in" && cheer !== null && cheered !== cheer;
  // Only while it moves, so the browser keeps no layer for it at rest.
  const moving = (on: boolean) => body.current?.style.setProperty("will-change", on ? "transform" : "auto");
  // The contact shadow follows Lumo's height above the floor, frame by frame: full on the floor, smaller and fainter as
  // it hops or bounces up, gone while its feet are below the floor.
  const shadow = useRef<HTMLSpanElement>(null);
  const seen = useRef({ y: 100, opacity: 0, squash: 1 });
  const follow = (latest: ResolvedValues) => {
    const now = seen.current;
    if (latest.y !== undefined) now.y = parseFloat(String(latest.y));
    if (latest.opacity !== undefined) now.opacity = Number(latest.opacity);
    if (latest.scaleX !== undefined) now.squash = Number(latest.scaleX);
    const lift = standDepth * 100 - now.y;
    const element = shadow.current;
    if (!element) return;
    element.style.opacity = lift < -1.5 ? "0" : String(now.opacity * Math.max(0.35, 1 - lift / 14));
    const grow = Math.min(1.08, Math.max(0.55, 1 - lift / 18));
    element.style.transform = `scale(${grow * now.squash}, ${grow})`;
  };
  const settle = () => {
    moving(false);
    if (presence === "hidden" && !gone) setGone(true);
  };
  // Reduced motion: Lumo and its bubble only fade, drifting up a little as they come and down as they go. The drift
  // stays inside the floor, so Lumo never dips into the controls.
  const drift = {
    initial: still ? { y: STAGE_BEATS.drift } : false,
    animate: { y: still && presence === "hidden" ? STAGE_BEATS.drift : 0 },
    transition: still ? FADE : { duration: 0 },
  } as const;

  return (
    <m.div
      aria-hidden="true"
      // Reduced motion: all of Lumo fades in and out here.
      initial={still ? { opacity: 0 } : false}
      animate={{ opacity: still && presence === "hidden" ? 0 : 1 }}
      transition={still ? FADE : { duration: 0 }}
      onAnimationComplete={settle}
      style={{ left: place.left, bottom: place.floor, width: place.size, height: place.size }}
      className={cn("pointer-events-none absolute", className)}
    >
      {/* Where Lumo touches the floor: a soft blurred ellipse under its feet, kept off the controls below. */}
      <span
        ref={shadow}
        aria-hidden="true"
        style={{ opacity: still ? 1 : 0 }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-[5%] w-[34%] -translate-x-1/2 translate-y-[30%] rounded-[50%] bg-black/50 blur-[3px]"
      />
      {/* The floor: Lumo rises out from below its bottom edge, and goes back under it, softly while it only peeks, as
          if from behind the controls. Standing, nothing of it is under the floor, so nothing is softened. */}
      <div
        className={cn(
          "size-full overflow-hidden",
          presence !== "in" && "[mask-image:linear-gradient(to_top,transparent,black_8px)]",
        )}
      >
        <m.div className="size-full" {...drift}>
          <m.div
            ref={body}
            // Squash, stretch and tilt are about its feet, 75% down the clip, so they stay planted on the floor.
            className="size-full origin-[50%_75%]"
            // Every appearance starts out of sight, the first one on the page too.
            initial={still ? STAND : HIDDEN}
            animate={still ? STAND : pose}
            transition={still ? { duration: 0 } : move}
            onAnimationStart={() => moving(true)}
            onAnimationComplete={settle}
            onUpdate={follow}
          >
            {/* A soft shadow and a faint lavender rim keep Lumo clear of busy video under it. */}
            <Lumo
              state={state}
              onDone={onDone}
              hidden={gone}
              className="size-full [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.45))_drop-shadow(0_0_1.5px_rgba(183,164,255,0.6))]"
            />
          </m.div>
        </m.div>
      </div>

      {/* Follows Lumo's head: low while it only peeks, so the bubble stays beside it. */}
      <m.div
        className="absolute inset-0"
        initial={false}
        animate={{ y: !still && presence !== "in" ? `${peekDepth * 100}%` : below(0) }}
        transition={bubbleMove}
      >
        <m.div className="absolute inset-0" {...drift}>
          <AnimatePresence>
            {line && (
              <m.span
                key="bubble"
                // Only its size follows a new line: tracking its place too would drag it about whenever the page scrolls.
                layout="size"
                initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={still ? { opacity: 0, transition: FADE } : { opacity: 0, scale: 0.2, transition: SHRINK }}
                transition={
                  still
                    ? FADE
                    : {
                        default: { ...POP, delay: bubbleLead },
                        opacity: { duration: 0.12, delay: bubbleLead },
                        layout: POP,
                      }
                }
                style={{ maxWidth: place.bubbleMax }}
                // The shadow is the bubble's and its tail's together, so the tail is never darkened by it.
                className={cn("absolute z-10 w-max [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.5))]", spot.bubble)}
              >
                <span className="border-accent/60 bg-surface text-foreground rounded-row relative block border px-2.5 py-1.5 text-xs leading-snug">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <m.span
                      key={line.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: still ? 0 : 0.15 }}
                      // Clamped inside the padding, so no cut line shows below the last one.
                      className={cn(
                        "line-clamp-3 block [overflow-wrap:anywhere]",
                        line.id === "cue" && "text-accent-soft px-0.5 text-sm font-bold",
                      )}
                    >
                      {line.text}
                    </m.span>
                  </AnimatePresence>
                </span>
                {/* Over the bubble's edge, clipped to its outer half: bubble and tail read as one outline. */}
                <span className={cn("border-accent/60 bg-surface absolute size-2.5 rotate-45 border", spot.tail)} />
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
                // From Lumo's face, starting where its body does (never off the film's edge); it fades before the bubble.
                className="bg-accent text-background absolute top-[55%] left-[29%] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
              >
                <SparkleIcon weight="fill" aria-hidden="true" className="size-3" />+{XP} XP
              </m.span>
            )}
          </AnimatePresence>
        </m.div>
      </m.div>
    </m.div>
  );
}

// A soft dark wash from the film's bottom-left corner, behind Lumo and its card, over the paused video, so they read
// clearly. It comes in with Lumo's entrance and goes with its exit. Wide when the card is over the video too.
export function LumoScrim({ on, wide }: { on: boolean; wide: boolean }) {
  const still = useReducedMotion() ?? false;
  return (
    <m.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={
        still ? FADE : { duration: s(on ? STAGE_BEATS.rise : STAGE_BEATS.exit), ease: on ? "easeOut" : "easeIn" }
      }
      className={cn(
        "pointer-events-none absolute inset-0",
        wide
          ? "bg-[radial-gradient(ellipse_75%_100%_at_0%_100%,rgba(0,0,0,0.5),rgba(0,0,0,0.3)_45%,transparent_80%)]"
          : "bg-[radial-gradient(ellipse_40%_75%_at_0%_100%,rgba(0,0,0,0.45),transparent_75%)]",
      )}
    />
  );
}
