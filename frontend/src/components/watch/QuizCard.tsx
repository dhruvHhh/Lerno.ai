import { useState } from "react";

import Card from "@/components/watch/Card";
import Choices from "@/components/watch/Choices";
import { scoreOf } from "@/components/watch/shared";
import type { Scene } from "@/lib/api";

interface QuizCardProps {
  open: boolean;
  onClose: () => void;
  scenes: Scene[];
  answers: Record<number, number>;
  onPick: (position: number, choice: number) => void;
}

// Every scene's question, and its written question, which shows only here and never in the overlay.
export default function QuizCard({ open, onClose, scenes, answers, onPick }: QuizCardProps) {
  const [shown, setShown] = useState<number[]>([]);
  return (
    <Card
      title="Quiz"
      open={open}
      onClose={onClose}
      chip={
        <span className="text-accent-soft text-xs">{`${scoreOf(scenes, answers)} of ${scenes.length} correct`}</span>
      }
    >
      {scenes.map((scene) => (
        <div key={scene.position} className="grid gap-2 border-b border-white/6 pb-3.5 last:border-0">
          <small className="text-muted-foreground text-xs">
            Scene {scene.position}: {scene.title}
          </small>
          <p className="text-sm leading-snug">{scene.mcq_question}</p>
          <Choices
            choices={scene.mcq_choices}
            correct={scene.mcq_correct_index}
            picked={answers[scene.position]}
            onPick={(choice) => onPick(scene.position, choice)}
            small
          />
          <div className="rounded-tight mt-1 bg-white/3 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <p className="text-secondary-foreground text-sm">{scene.fr_question}</p>
            {shown.includes(scene.position) ? (
              <p className="mt-1.5 text-sm">{scene.fr_answer}</p>
            ) : (
              <button
                type="button"
                onClick={() => setShown([...shown, scene.position])}
                className="text-accent-soft mt-1.5 text-[13px]"
              >
                Show answer
              </button>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
