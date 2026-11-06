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

// The three tools, always in view, one tap each: a floating bar from a tablet up, a full-width bar along a phone's edge.
export default function Dock({ card, onPick }: DockProps) {
  return (
    <div
      data-dock
      className={cn(
        "fixed right-4 bottom-4 z-30 flex lg:bottom-[26px]",
        "sm:rounded-surface sm:gap-1 sm:bg-[rgba(14,13,24,0.86)] sm:p-1 sm:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_12px_32px_rgba(0,0,0,0.5)]",
        "max-sm:bg-surface max-sm:right-0 max-sm:bottom-0 max-sm:left-0 max-sm:border-t max-sm:border-white/8",
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
            "max-sm:h-14 max-sm:flex-1 max-sm:flex-col max-sm:justify-center max-sm:gap-0.5 max-sm:rounded-none max-sm:px-0 max-sm:text-xs",
            card === name
              ? "sm:bg-accent/16 text-foreground max-sm:text-accent-soft sm:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.35)]"
              : "text-secondary-foreground hover:text-foreground sm:hover:bg-white/6",
          )}
        >
          <Icon size={17} weight={card === name ? "fill" : "regular"} />
          {label}
          {/* Shows after a short wait, so passing over the bar stays quiet. */}
          <span className="text-muted-foreground pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 rounded-[7px] bg-[#16171f] px-2 py-1 text-[11px] font-normal whitespace-nowrap opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-500 max-sm:hidden">
            Press <kbd className="text-foreground font-sans">{key}</kbd>
          </span>
        </button>
      ))}
    </div>
  );
}
