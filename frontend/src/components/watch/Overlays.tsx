import type { ReactNode } from "react";
import { Link } from "react-router";

import Choices from "@/components/watch/Choices";
import { BUTTON, SOLID } from "@/components/watch/shared";
import type { Scene } from "@/lib/api";

function Overlay({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[rgba(5,6,9,0.93)] p-4 backdrop-blur-[14px] max-sm:relative max-sm:min-h-[56.25vw] max-sm:py-6 sm:p-6"
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

// The quick check at the end of a scene: answer, or skip to the next scene.
export function QuizOverlay({ scene, total, picked, onPick, onNext }: QuizOverlayProps) {
  const answered = picked !== undefined;
  return (
    <Overlay label="Quick check">
      <small className="text-accent-soft text-xs">
        Quick check, scene {scene.position} of {total}
      </small>
      <h2 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] sm:text-[22px]">
        {scene.mcq_question}
      </h2>
      <Choices choices={scene.mcq_choices} correct={scene.mcq_correct_index} picked={picked} onPick={onPick} />
      <p role="status" className="text-secondary-foreground min-h-[21px] text-sm">
        {answered &&
          (picked === scene.mcq_correct_index ? (
            <>
              <b className="text-foreground font-semibold">Right.</b> {scene.mcq_choices[picked]}.
            </>
          ) : (
            <>
              <b className="text-foreground font-semibold">Not quite.</b> The answer is "
              {scene.mcq_choices[scene.mcq_correct_index]}".
            </>
          ))}
      </p>
      <div className="flex items-center justify-between gap-2">
        {answered ? (
          <button type="button" onClick={onNext} className={`${SOLID} ml-auto`}>
            Continue
          </button>
        ) : (
          <button type="button" onClick={onNext} className={BUTTON}>
            Skip
          </button>
        )}
      </div>
    </Overlay>
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
