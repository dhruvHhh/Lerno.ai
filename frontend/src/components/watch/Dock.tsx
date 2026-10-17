import { ChatCircle, CheckCircle, NotePencil, Plus } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type CardName = "tutor" | "notes" | "quiz";

const ITEMS = [
  { name: "tutor", label: "Tutor", Icon: ChatCircle },
  { name: "notes", label: "Notes", Icon: NotePencil },
  { name: "quiz", label: "Quiz", Icon: CheckCircle },
] as const;

interface DockProps {
  open: boolean;
  card: CardName | null;
  onToggle: () => void;
  onOpenCard: (card: CardName) => void;
  className?: string;
}

// One round button; it opens the three tools. The open tool's card shows above it.
export default function Dock({ open, card, onToggle, onOpenCard, className }: DockProps) {
  return (
    <div
      data-dock
      className={cn("fixed right-4 bottom-4 z-30 flex flex-row-reverse items-center gap-2 lg:bottom-[26px]", className)}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label="Open tools"
        aria-expanded={open}
        className={cn(
          "bg-foreground text-background ease-snappy grid size-[54px] place-items-center rounded-full shadow-[0_0_40px_rgba(155,124,255,0.45),0_10px_30px_rgba(0,0,0,0.5)] transition-[rotate,scale] duration-[450ms] active:scale-95",
          open && "rotate-45",
        )}
      >
        <Plus size={22} weight="bold" />
      </button>
      <div
        inert={!open}
        className={cn(
          "ease-snappy flex origin-right flex-row-reverse gap-2 rounded-full bg-[rgba(14,13,24,0.85)] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-[16px] transition-[opacity,scale,translate] duration-[400ms]",
          !open && "pointer-events-none translate-x-5 scale-70 opacity-0",
        )}
      >
        {ITEMS.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onOpenCard(name)}
            aria-label={label}
            aria-pressed={card === name}
            className={cn(
              "group text-secondary-foreground ease-spring relative grid size-[42px] place-items-center rounded-full bg-white/4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[scale,color,background-color] duration-300",
              "hover:text-foreground hover:bg-accent/18 hover:scale-112 hover:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.5)]",
              card === name && "text-foreground bg-accent/18 scale-112 shadow-[inset_0_0_0_1px_rgba(155,124,255,0.5)]",
            )}
          >
            <Icon size={19} />
            <span className="text-foreground pointer-events-none absolute bottom-[52px] left-1/2 -translate-x-1/2 rounded-[7px] bg-[#1a1b26] px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-opacity duration-200 group-hover:opacity-100">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
