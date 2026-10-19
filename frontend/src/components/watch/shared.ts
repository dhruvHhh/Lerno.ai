import type { CardName } from "@/components/watch/Dock";
import type { Scene } from "@/lib/api";

export const NOTE_MAX = 5000;

// How long a button's tick stays, and how long a deleted note takes to fold away.
export const DONE_MS = 700;
export const FOLD_MS = 350;

export const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Folds an element away in FOLD_MS: it fades first, then closes, so its text is never squashed while it shows.
// In a flex column, its negative margin (the gap) takes the gap away too.
export const FOLD =
  "grid min-h-0 grid-rows-[1fr] [transition:opacity_150ms_ease-out,grid-template-rows_250ms_cubic-bezier(0.22,1,0.36,1)_100ms,margin_250ms_cubic-bezier(0.22,1,0.36,1)_100ms] motion-reduce:transition-none";
export const FOLDED = "grid-rows-[0fr] opacity-0";

export const DOCK_KEYS: Record<string, CardName> = { t: "tutor", n: "notes", q: "quiz" };

export const BUTTON =
  "text-secondary-foreground hover:text-foreground h-8 rounded-tile px-3.5 text-[13px] font-medium transition-[background-color,color,opacity] duration-250 hover:bg-white/6";
export const SOLID =
  "bg-foreground text-background h-8 rounded-tile px-3.5 text-[13px] font-semibold transition-opacity duration-250 disabled:cursor-default disabled:opacity-40";

export const scoreOf = (scenes: Scene[], answers: Record<number, number>) =>
  scenes.filter((scene) => answers[scene.position] === scene.mcq_correct_index).length;
