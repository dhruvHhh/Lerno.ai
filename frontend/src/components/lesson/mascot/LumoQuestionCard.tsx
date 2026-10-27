import { ArrowCounterClockwiseIcon, ChatCircleIcon, CheckIcon, SparkleIcon } from "@phosphor-icons/react";
import { m, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

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

interface LumoQuestionCardProps {
  scene: Scene;
  // Where the video paused, in seconds.
  time: number;
  phase: Exclude<CheckPhase, "entrance">;
  picked: number | undefined;
  // What Lumo is saying now. Its bubble is hidden from screen readers, so this card reads it instead, once.
  line: string | null;
  // Where Lumo stands, so the card grows out of its side: above the card, or beside its bottom in the full screen film.
  from: "top" | "bottom";
  onPick: (choice: number) => void;
  onSkip: () => void;
  onRewind: () => void;
  onContinue: () => void;
  // Takes the question to the tutor, after a wrong pick.
  onExplain?: () => void;
  className?: string;
}

// Lumo's question, beside Lumo and outside the video, except in full screen. Keys 1 to 4 pick a choice, Esc skips. A
// wrong pick shows the right answer and offers another look, one step at a time (WRONG_BEATS); nothing in it is a
// penalty.
export default function LumoQuestionCard({
  scene,
  time,
  phase,
  picked,
  line,
  from,
  onPick,
  onSkip,
  onRewind,
  onContinue,
  onExplain,
  className,
}: LumoQuestionCardProps) {
  const card = useRef<HTMLElement>(null);
  const explain = useRef<HTMLButtonElement>(null);
  const resume = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const still = useReducedMotion() ?? false;
  // After a wrong pick, whether the right answer is showing yet.
  const [shown, setShown] = useState(false);
  const answering = phase === "speaking" || phase === "thinking";
  const correct = scene.mcq_correct_index;
  const revealed = phase === "correct" || (phase === "wrong" && shown);

  useEffect(() => {
    if (phase !== "wrong") return;
    const timer = window.setTimeout(() => setShown(true), still ? 0 : WRONG_BEATS.reveal);
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

  const offset = from === "top" ? -8 : 8;
  return (
    <m.section
      ref={card}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-lenis-prevent
      initial={still ? false : { opacity: 0, y: offset, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        still
          ? { opacity: 0, transition: { duration: 0 } }
          : { opacity: 0, y: offset / 2, scale: 0.98, transition: OUT }
      }
      transition={still ? { duration: 0 } : POP}
      className={cn(
        // The scroll margin keeps what scrolls into view clear of the floating dock.
        "rounded-surface border-border bg-surface/95 @container grid scroll-mb-24 [scrollbar-width:thin] content-start gap-2.5 overflow-x-hidden overflow-y-auto border p-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] outline-none",
        from === "top" ? "origin-top-left" : "origin-bottom-left",
        className,
      )}
    >
      <header className="flex items-center gap-2.5">
        <span id={titleId} className="text-[13px] font-medium">
          Lumo's quick check
        </span>
        <Stamp>{formatTime(time)}</Stamp>
      </header>
      <p className="text-sm leading-snug font-medium">{scene.mcq_question}</p>

      {/* Two up when the card is wide, so it stays short under the film. */}
      <div className="grid gap-1.5 @lg:grid-cols-2">
        {scene.mcq_choices.map((choice, k) => {
          const right = revealed && k === correct;
          const wrong = phase === "wrong" && k === picked;
          return (
            <m.button
              key={k}
              type="button"
              disabled={!answering}
              onClick={() => onPick(k)}
              aria-keyshortcuts={String(k + 1)}
              initial={false}
              animate={wrong && !still ? NUDGE : { x: 0 }}
              transition={NUDGE_TIME}
              className={cn(
                "rounded-tight text-foreground relative flex min-h-11 items-center gap-2.5 border border-white/10 bg-white/4 px-2.5 py-2 text-left text-[13px] leading-snug transition-[background-color,border-color,opacity] duration-200",
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
              <kbd className="rounded-tight text-secondary-foreground grid size-5 flex-none place-items-center font-sans text-[11px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                {k + 1}
              </kbd>
              {choice}
              {right && (
                <m.span
                  initial={still ? false : { scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={TICK}
                  className="ml-auto flex-none"
                >
                  <CheckIcon weight="bold" aria-hidden="true" className="text-success size-4" />
                </m.span>
              )}
            </m.button>
          );
        })}
      </div>

      {/* Always in the page, even empty: a live region that appears with its text is often not read out. It reads one
          line per answer; Lumo's kind words after a wrong pick stay in its bubble. Before an answer, Lumo's words are
          only read out. */}
      <p role="status" aria-live="polite" className="text-secondary-foreground -my-1 text-[13px] leading-snug">
        {phase === "correct" && <b className="text-success font-semibold">{line}</b>}
        {phase === "wrong" && shown && (
          <>
            <b className="text-foreground font-semibold">Not quite.</b> The answer was "{scene.mcq_choices[correct]}".
          </>
        )}
        {answering && <span className="sr-only">{line}</span>}
      </p>

      <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
        {phase === "wrong" ? (
          shown && (
            <>
              {onExplain && (
                <m.button
                  ref={explain}
                  type="button"
                  onClick={onExplain}
                  {...arrive(0)}
                  className={cn(BUTTON, "-ml-2 inline-flex scroll-mb-24 items-center gap-1.5")}
                >
                  <ChatCircleIcon aria-hidden="true" className="size-3.5" />
                  Explain this
                </m.button>
              )}
              <m.button
                type="button"
                onClick={onRewind}
                {...arrive(onExplain ? 1 : 0)}
                className={cn(BUTTON, "inline-flex scroll-mb-24 items-center gap-1.5", !onExplain && "-ml-2")}
              >
                <ArrowCounterClockwiseIcon aria-hidden="true" className="size-3.5" />
                Rewind 10s
              </m.button>
              <m.button
                ref={resume}
                type="button"
                onClick={onContinue}
                {...arrive(onExplain ? 2 : 1)}
                className={cn(SOLID, "ml-auto scroll-mb-24")}
              >
                Continue
              </m.button>
            </>
          )
        ) : (
          <>
            {answering && (
              <button type="button" onClick={onSkip} className={cn(BUTTON, "-ml-2")}>
                Skip for now
              </button>
            )}
            <span className="text-accent-soft ml-auto inline-flex h-8 items-center gap-1 text-xs font-medium">
              <SparkleIcon weight="fill" aria-hidden="true" className="size-3.5" />
              {phase === "correct" ? "+10 XP earned" : "+10 XP"}
            </span>
          </>
        )}
      </div>
    </m.section>
  );
}
