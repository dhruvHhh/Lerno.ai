import {
  ArrowCounterClockwiseIcon,
  ChatCircleIcon,
  CheckIcon,
  SparkleIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { WRONG_BEATS, type CheckPhase } from "@/components/lesson/mascot/useLumoCheckpoints";
import { BUTTON, SOLID } from "@/components/watch/shared";
import Stamp from "@/components/watch/Stamp";
import type { Scene } from "@/lib/api";
import { cn, formatTime } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

const POP: Transition = { type: "spring", stiffness: 420, damping: 34 };
const OUT: Transition = { duration: 0.15 };
const TICK: Transition = { type: "spring", stiffness: 520, damping: 22 };
// The chosen wrong option: two small swings, done in about 300ms.
const NUDGE = { x: [0, -4, 4, -4, 4, 0] };
const NUDGE_TIME: Transition = { duration: 0.3, ease: "easeInOut" };
// The right option's glow: one soft pulse.
const PULSE: Transition = { duration: 0.7, ease: EASE_EXPO };
// After a wrong pick, the two choices left move up together as the others step out.
const REFLOW: Transition = { type: "spring", stiffness: 420, damping: 38 };
// Buttons drawn 32px tall still take a 44px tap: their hit area reaches 6px above and below, into the gaps around them.
const TAP = "relative after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']";
// Text buttons in the card: their label lines up with the card's left edge, their hover and focus stay in its padding.
const TEXT_BUTTON = "-ml-2 px-2";
// Long words, formulas and links wrap rather than run out of the card.
const WRAP = "min-w-0 [overflow-wrap:anywhere]";

// The card's spacing, one system in three steps. Regular: 20px around, 16px between header, question, choices and foot,
// 10px between choices. Compact (tight room over the video): 16 / 12 / 8, choices two by two, text a step smaller.
// Dense: compact tightened, only when the card would not otherwise fit over the video.
const SPACE = {
  regular: {
    body: "gap-4 p-5",
    title: "text-[13px]",
    question: "text-sm leading-[1.45]",
    choices: "gap-2.5",
    choice: "gap-3 px-3 py-2.5 text-[13px] leading-[1.35]",
    status: "text-[13px] leading-[1.4]",
  },
  compact: {
    body: "gap-3 p-4",
    title: "text-xs",
    question: "text-[13px] leading-[1.45]",
    choices: "gap-2",
    choice: "gap-2.5 px-2.5 py-2 text-xs leading-[1.35]",
    status: "text-xs leading-[1.4]",
  },
  dense: {
    body: "gap-2 p-2.5",
    title: "text-xs",
    question: "text-[13px] leading-[1.35]",
    choices: "gap-1.5",
    choice: "gap-2 px-2 py-1.5 text-xs leading-[1.3]",
    status: "text-xs leading-[1.35]",
  },
};

// The card is Lumo speaking, so it grows out of a notch that points at Lumo, from the side Lumo is on: Lumo to its
// left or below it, over the video, or above it, when the card is under the film. The notch sits along that edge at
// Lumo, from the card's bottom (left) or its left edge (below, above).
const FROM = {
  left: {
    origin: "origin-bottom-left",
    notch:
      "left-0 -translate-x-1/2 translate-y-1/2 [clip-path:polygon(0_0,2px_0,100%_calc(100%_-_2px),100%_100%,0_100%)]",
    along: "bottom",
    enter: { x: -8 },
  },
  below: {
    origin: "origin-bottom-left",
    notch:
      "bottom-0 -translate-x-1/2 translate-y-1/2 [clip-path:polygon(100%_0,100%_100%,0_100%,0_calc(100%_-_2px),calc(100%_-_2px)_0)]",
    along: "left",
    enter: { y: 8 },
  },
  above: {
    origin: "origin-top-left",
    notch: "top-0 -translate-x-1/2 -translate-y-1/2 [clip-path:polygon(0_0,100%_0,100%_2px,2px_100%,0_100%)]",
    along: "left",
    enter: { y: -8 },
  },
} as const;

interface LumoQuestionCardProps {
  scene: Scene;
  // Where the video paused, in seconds.
  time: number;
  phase: Exclude<CheckPhase, "entrance">;
  picked: number | undefined;
  // What Lumo is saying now. Its bubble is hidden from screen readers, so this card reads it instead, once.
  line: string | null;
  // Where Lumo is, seen from the card, so the card grows out of that side; and how far along it Lumo is, in px.
  from: keyof typeof FROM;
  notch: number;
  // Lumo's sounds, switched here, where they are heard.
  sound: boolean;
  onSound: () => void;
  onPick: (choice: number) => void;
  onSkip: () => void;
  onRewind: () => void;
  onContinue: () => void;
  // Takes the question to the tutor, after a wrong pick.
  onExplain?: () => void;
  // Over the video: where the card goes and how big it may be.
  style?: CSSProperties;
  // Tight room over the video: choices two by two, tighter spacing, text a step smaller. If even that would not fit,
  // the card tightens once more by itself.
  compact?: boolean;
  className?: string;
}

// Lumo's question, over the paused video beside Lumo, or under the film where the video is too short for it. Keys 1 to
// 4 pick a choice, Esc skips. A wrong pick shows the right answer and offers another look, one step at a time
// (WRONG_BEATS), in the room the choices took, so the card never grows; nothing in it is a penalty.
export default function LumoQuestionCard({
  scene,
  time,
  phase,
  picked,
  line,
  from,
  notch,
  sound,
  onSound,
  onPick,
  onSkip,
  onRewind,
  onContinue,
  onExplain,
  style,
  compact = false,
  className,
}: LumoQuestionCardProps) {
  const card = useRef<HTMLElement>(null);
  const explain = useRef<HTMLButtonElement>(null);
  const resume = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const still = useReducedMotion() ?? false;
  // After a wrong pick, whether the right answer is showing yet, and the card's height until then: it keeps it, so the
  // card neither grows nor jumps. The room the dropped choices leave takes up a longer status line.
  const [shown, setShown] = useState(false);
  const [held, setHeld] = useState<number | null>(null);
  // A compact card that would still have to scroll over the video tightens to dense, once, as it opens.
  const [dense, setDense] = useState(false);
  const space = SPACE[compact ? (dense ? "dense" : "compact") : "regular"];
  // Measured as the card's body lands in the page, before it is painted, so the change never shows.
  const attachBody = (element: HTMLDivElement | null) => {
    body.current = element;
    if (element && compact && !dense && element.scrollHeight > element.clientHeight + 1) setDense(true);
  };
  const answering = phase === "speaking" || phase === "thinking";
  const correct = scene.mcq_correct_index;
  const revealed = phase === "correct" || (phase === "wrong" && shown);
  // After a wrong pick, only the picked choice and the right one stay, with the next steps under them.
  const settled = phase === "wrong" && shown;

  useEffect(() => {
    if (phase !== "wrong") return;
    const timer = window.setTimeout(
      () => {
        setHeld(body.current?.offsetHeight ?? null);
        setShown(true);
      },
      still ? 0 : WRONG_BEATS.reveal,
    );
    return () => window.clearTimeout(timer);
  }, [phase, still]);

  // Focus comes in when the card opens. A picked choice locks, so focus moves to the card with it rather than drop to
  // the page, and after a wrong pick on to "Explain this" once it shows. What gets focus is scrolled into view too,
  // inside the card if it scrolls: a short card can hide its buttons.
  useEffect(() => {
    const target =
      phase === "thinking" ? null : phase === "wrong" && shown ? (explain.current ?? resume.current) : card.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  }, [phase, shown]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea") || event.ctrlKey || event.metaKey || event.altKey) return;
      const choice = Number(event.key) - 1;
      if (answering && Number.isInteger(choice) && choice >= 0 && choice < scene.mcq_choices.length) {
        event.preventDefault();
        onPick(choice);
      } else if (event.key === "Escape") {
        if (answering) onSkip();
        else if (phase === "wrong") onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answering, phase, scene, onPick, onSkip, onContinue]);

  // The action buttons after a wrong pick come in a little apart, once the right answer shows.
  const arrive = (k: number) =>
    still
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { ...POP, delay: (WRONG_BEATS.buttons - WRONG_BEATS.reveal + k * WRONG_BEATS.buttonGap) / 1000 },
        };

  const side = FROM[from];
  return (
    <m.section
      ref={card}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-lenis-prevent
      initial={still ? false : { opacity: 0, ...side.enter, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.98, transition: OUT }}
      transition={still ? { duration: 0 } : POP}
      // The scroll margin keeps what scrolls into view clear of the floating dock.
      style={style}
      // The shadow is the whole card's, notch and all, so it never darkens the notch the way a box shadow would.
      className={cn(
        "relative flex scroll-mb-24 flex-col [filter:drop-shadow(0_16px_24px_rgba(0,0,0,0.55))] outline-none",
        side.origin,
        className,
      )}
    >
      <div
        ref={attachBody}
        style={settled && held ? { minHeight: held } : undefined}
        // Any height it is held to beyond its content goes to the choices' row, so the status line stays at the foot.
        className={cn(
          "rounded-surface border-border bg-surface @container relative grid min-h-0 [scrollbar-width:thin] grid-rows-[auto_auto_1fr_auto] overflow-x-hidden overflow-y-auto border",
          space.body,
        )}
      >
        <header className="flex items-center gap-2.5">
          <span id={titleId} className={cn("font-medium", space.title)}>
            Lumo's quick check
          </span>
          <Stamp>{formatTime(time)}</Stamp>
          <button
            type="button"
            onClick={onSound}
            aria-label="Lumo's sounds"
            aria-pressed={sound}
            title={sound ? "Turn Lumo's sounds off" : "Turn Lumo's sounds on"}
            // 28px drawn, a 44px tap.
            className="text-muted-foreground hover:text-foreground rounded-tile relative -my-1 -mr-0.5 ml-auto grid size-7 place-items-center transition-colors duration-200 after:absolute after:-inset-2 after:content-['']"
          >
            {sound ? (
              <SpeakerHighIcon size={14} aria-hidden="true" />
            ) : (
              <SpeakerSlashIcon size={14} aria-hidden="true" />
            )}
          </button>
        </header>
        <p className={cn("font-medium", space.question, WRAP)}>{scene.mcq_question}</p>

        {/* The choices, two by two when the card is compact or wide. After a wrong pick the picked choice and the right
            one stay, and the next steps take the second row, in the same room. */}
        <div className={cn("grid content-start", space.choices)}>
          <div className={cn("grid", space.choices, compact ? "grid-cols-2" : "@lg:grid-cols-2")}>
            <AnimatePresence initial={false} mode="popLayout">
              {scene.mcq_choices.map((choice, k) => {
                const right = revealed && k === correct;
                const wrong = phase === "wrong" && k === picked;
                if (settled && !right && !wrong) return null;
                return (
                  <m.button
                    key={k}
                    type="button"
                    disabled={!answering}
                    onClick={() => onPick(k)}
                    aria-keyshortcuts={String(k + 1)}
                    layout={still ? false : "position"}
                    initial={false}
                    animate={wrong && !still ? NUDGE : { x: 0 }}
                    exit={
                      still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.96, transition: OUT }
                    }
                    transition={{ ...NUDGE_TIME, layout: REFLOW }}
                    className={cn(
                      "rounded-tight text-foreground relative flex min-h-11 min-w-0 items-center border border-white/10 bg-white/4 text-left transition-[background-color,border-color,opacity] duration-200",
                      space.choice,
                      answering && "hover:border-accent hover:bg-accent/8 focus-visible:border-accent",
                      right && "border-success/60 bg-success/10",
                      wrong && "border-danger/60 bg-danger/8",
                      !answering && !right && !wrong && "opacity-50",
                    )}
                  >
                    {right && !still && (
                      <m.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0, 0.9, 0], scale: [1, 1.015, 1] }}
                        transition={PULSE}
                        className="rounded-tight ring-success/70 pointer-events-none absolute -inset-px ring-2"
                      />
                    )}
                    {/* The right answer's tick takes its key's place, so its text never wraps anew and the card keeps
                        its height; once answered, the keys do nothing. */}
                    {right ? (
                      <m.span
                        initial={still ? false : { scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={TICK}
                        className="grid size-5 flex-none place-items-center"
                      >
                        <CheckIcon weight="bold" aria-hidden="true" className="text-success size-4" />
                      </m.span>
                    ) : (
                      <kbd className="rounded-tight text-secondary-foreground grid size-5 flex-none place-items-center font-sans text-[11px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                        {k + 1}
                      </kbd>
                    )}
                    <span className={WRAP}>{choice}</span>
                  </m.button>
                );
              })}
            </AnimatePresence>
          </div>

          {settled && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {onExplain && (
                <m.button
                  ref={explain}
                  type="button"
                  onClick={onExplain}
                  {...arrive(0)}
                  className={cn(BUTTON, TAP, TEXT_BUTTON, "inline-flex scroll-mb-24 items-center gap-1.5")}
                >
                  <ChatCircleIcon aria-hidden="true" className="size-3.5" />
                  Explain this
                </m.button>
              )}
              <m.button
                type="button"
                onClick={onRewind}
                {...arrive(onExplain ? 1 : 0)}
                className={cn(BUTTON, TAP, "inline-flex scroll-mb-24 items-center gap-1.5 px-2", !onExplain && "-ml-2")}
              >
                <ArrowCounterClockwiseIcon aria-hidden="true" className="size-3.5" />
                Rewind 10s
              </m.button>
              <m.button
                ref={resume}
                type="button"
                onClick={onContinue}
                {...arrive(onExplain ? 2 : 1)}
                className={cn(SOLID, TAP, "ml-auto scroll-mb-24")}
              >
                Continue
              </m.button>
            </div>
          )}
        </div>

        {/* The status line sits where Skip and the XP were, so an answer never adds a row. Always in the page, even
            empty: a live region that appears with its text is often not read out. It reads one line per answer; Lumo's
            kind words after a wrong pick stay in its bubble. Before an answer, Lumo's words are only read out. */}
        <div className="flex min-h-8 items-center gap-x-3">
          {answering && (
            <button type="button" onClick={onSkip} className={cn(BUTTON, TAP, TEXT_BUTTON, "flex-none")}>
              Skip for now
            </button>
          )}
          <p role="status" aria-live="polite" className={cn("text-secondary-foreground flex-1", space.status, WRAP)}>
            {phase === "correct" && <b className="text-success font-semibold">{line}</b>}
            {phase === "wrong" && shown && (
              <>
                <b className="text-foreground font-semibold">Not quite.</b> The answer was "{scene.mcq_choices[correct]}
                ".
              </>
            )}
            {answering && <span className="sr-only">{line}</span>}
          </p>
          {phase !== "wrong" && (
            <span className="text-accent-soft inline-flex h-8 flex-none items-center gap-1 text-xs font-medium">
              <SparkleIcon weight="fill" aria-hidden="true" className="size-3.5" />
              {phase === "correct" ? "+10 XP earned" : "+10 XP"}
            </span>
          )}
        </div>
      </div>
      {/* Over the card's edge and clipped to its outer half, with a sliver past it that covers the edge's border: the
          card and its point read as one outline. */}
      <span
        aria-hidden="true"
        style={{ [side.along]: notch }}
        className={cn("border-border bg-surface absolute size-3 rotate-45 border", side.notch)}
      />
    </m.section>
  );
}
