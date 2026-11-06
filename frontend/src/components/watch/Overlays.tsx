import { type ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router";

import Choices from "@/components/watch/Choices";
import { BUTTON, SOLID } from "@/components/watch/shared";
import type { Scene } from "@/lib/api";

// Over the video on larger screens; on a phone it takes the video's place and grows with its text.
const COVER = "absolute inset-0 z-20 bg-[rgba(5,6,9,0.93)] backdrop-blur-[14px] max-sm:relative max-sm:min-h-[56.25vw]";

function Overlay({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className={`${COVER} grid place-items-center overflow-y-auto p-4 max-sm:py-6 sm:p-6`}
    >
      <div className={`grid w-[min(520px,100%)] gap-3.5 ${className}`}>{children}</div>
    </div>
  );
}

interface QuizOverlayProps {
  scene: Scene;
  total: number;
  picked: number | undefined;
  onPick: (choice: number) => void;
  onNext: () => void;
}

// The quick check at the end of a scene: answer, or skip to the next scene. The bottom row never scrolls away, so the
// way on is always in sight; a long question scrolls above it, fading out to show there is more.
export function QuizOverlay({ scene, total, picked, onPick, onNext }: QuizOverlayProps) {
  const answered = picked !== undefined;
  const proceed = useRef<HTMLButtonElement>(null);
  // The picked answer locks, which would drop keyboard focus; Enter now goes on.
  useEffect(() => {
    if (answered) proceed.current?.focus({ preventScroll: true });
  }, [answered]);

  return (
    <div role="dialog" aria-label="Quick check" className={`${COVER} flex flex-col`}>
      <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)] p-4 pb-5 max-sm:overflow-visible max-sm:[mask-image:none] sm:px-6">
        <div className="mx-auto my-auto grid w-[min(640px,100%)] gap-3">
          <small className="text-accent-soft text-xs">
            Quick check, scene {scene.position} of {total}
          </small>
          <h2 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] sm:text-xl">
            {scene.mcq_question}
          </h2>
          <Choices choices={scene.mcq_choices} correct={scene.mcq_correct_index} picked={picked} onPick={onPick} wide />
        </div>
      </div>
      <div className="flex-none px-4 sm:px-6">
        <div className="mx-auto flex h-14 w-[min(640px,100%)] items-center justify-between gap-3">
          <p role="status" className="text-secondary-foreground min-w-0 text-sm">
            {answered &&
              (picked === scene.mcq_correct_index ? (
                <b className="text-foreground font-semibold">Right.</b>
              ) : (
                <>
                  <b className="text-foreground font-semibold">Not quite.</b> The answer is{" "}
                  {"ABCD"[scene.mcq_correct_index]}.
                </>
              ))}
          </p>
          <button ref={proceed} type="button" onClick={onNext} className={`${answered ? SOLID : BUTTON} flex-none`}>
            {answered ? "Continue" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CompleteOverlayProps {
  score: number;
  total: number;
  onAgain: () => void;
  onAskTutor: () => void;
}

export function CompleteOverlay({ score, total, onAgain, onAskTutor }: CompleteOverlayProps) {
  return (
    <Overlay label="Lesson complete" className="justify-items-center text-center">
      <h2 className="text-[17px] font-semibold tracking-[-0.015em] sm:text-[22px]">Lesson complete</h2>
      <p className="text-secondary-foreground text-sm">
        You got {score} of {total} quick checks right.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onAgain} className={BUTTON}>
          Watch again
        </button>
        <button type="button" onClick={onAskTutor} className={BUTTON}>
          Ask the tutor
        </button>
        <Link to="/new" className={`${SOLID} inline-grid place-items-center`}>
          New lesson
        </Link>
      </div>
    </Overlay>
  );
}
