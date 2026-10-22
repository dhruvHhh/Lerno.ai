import { ChatCircle, CheckCircle, NotePencil } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export type CardName = "tutor" | "notes" | "quiz";

const ITEMS = [
  { name: "tutor", label: "Tutor", key: "T", Icon: ChatCircle },
  { name: "notes", label: "Notes", key: "N", Icon: NotePencil },
  { name: "quiz", label: "Quiz", key: "Q", Icon: CheckCircle },
] as const;

interface DockProps {
  card: CardName | null;
  onPick: (card: CardName) => void;
}

// The three tools, always in view, one click each. The open tool's card shows above the bar.
export default function Dock({ card, onPick }: DockProps) {
  return (
    <div
      data-dock
      className={cn(
        "rounded-surface fixed right-4 bottom-4 z-30 flex gap-1 bg-[rgba(14,13,24,0.86)] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-[16px] lg:bottom-[26px]",
        "ease-snappy transition-[right] duration-[450ms] lg:right-(--rail-edge)",
      )}
    >
      {ITEMS.map(({ name, label, key, Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          aria-label={label}
          aria-pressed={card === name}
          aria-keyshortcuts={key}
          className={cn(
            "group rounded-row relative flex h-9 items-center gap-2 px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200",
            card === name
              ? "bg-accent/16 text-foreground shadow-[inset_0_0_0_1px_rgba(155,124,255,0.35)]"
              : "text-secondary-foreground hover:text-foreground hover:bg-white/6",
          )}
        >
          <Icon size={17} weight={card === name ? "fill" : "regular"} />
          {label}
          {/* Shows after a short wait, so passing over the bar stays quiet. */}
          <span className="text-muted-foreground pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 rounded-[7px] bg-[#16171f] px-2 py-1 text-[11px] font-normal whitespace-nowrap opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-500">
            Press <kbd className="text-foreground font-sans">{key}</kbd>
          </span>
        </button>
      ))}
    </div>
  );
}
