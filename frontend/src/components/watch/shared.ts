import type { Scene } from "@/lib/api";

export const NOTE_MAX = 5000;

export const BUTTON =
  "text-secondary-foreground hover:text-foreground h-8 rounded-[9px] px-3.5 text-[13px] font-medium transition-[background-color,color,opacity] duration-250 hover:bg-white/6";
export const SOLID =
  "bg-foreground text-background h-8 rounded-[9px] px-3.5 text-[13px] font-semibold transition-opacity duration-250 disabled:cursor-default disabled:opacity-40";
export const STAMP =
  "text-accent-soft bg-accent/12 rounded-full px-2 py-0.5 text-[11px] tabular-nums shadow-[inset_0_0_0_1px_rgba(155,124,255,0.3)]";

export const scoreOf = (scenes: Scene[], answers: Record<number, number>) =>
  scenes.filter((scene) => answers[scene.position] === scene.mcq_correct_index).length;
