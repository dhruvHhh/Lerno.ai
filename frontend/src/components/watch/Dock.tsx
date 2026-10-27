import { ChatCircle, CheckCircle, NotePencil, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type CardName = "tutor" | "notes" | "quiz";

// `rise` staggers the tools as they open from the phone button, nearest first.
const ITEMS = [
  { name: "tutor", label: "Tutor", key: "T", Icon: ChatCircle, rise: "max-sm:delay-[80ms]" },
  { name: "notes", label: "Notes", key: "N", Icon: NotePencil, rise: "max-sm:delay-[40ms]" },
  { name: "quiz", label: "Quiz", key: "Q", Icon: CheckCircle, rise: "max-sm:delay-0" },
] as const;

interface DockProps {
  card: CardName | null;
  onPick: (card: CardName) => void;
}

// The three tools. From a tablet up they sit in a bar, always in view, one click each. On a phone a bar would cover
// the page, so one round button opens them above it.
export default function Dock({ card, onPick }: DockProps) {
  const [open, setOpen] = useState(false);
  const dock = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => !dock.current?.contains(event.target as Node) && setOpen(false);
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div
      ref={dock}
      data-dock
      className={cn(
        "fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2 lg:bottom-[26px]",
        "sm:rounded-surface sm:flex-row sm:gap-1 sm:bg-[rgba(14,13,24,0.86)] sm:p-1 sm:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_12px_32px_rgba(0,0,0,0.5)]",
        "ease-snappy transition-[right] duration-[450ms] lg:right-(--rail-edge)",
      )}
    >
      {ITEMS.map(({ name, label, key, Icon, rise }) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            onPick(name);
            setOpen(false);
          }}
          aria-label={label}
          aria-pressed={card === name}
          aria-keyshortcuts={key}
          className={cn(
            "group rounded-row relative flex h-9 items-center gap-2 px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200",
            card === name
              ? "bg-accent/16 text-foreground shadow-[inset_0_0_0_1px_rgba(155,124,255,0.35)]"
              : "text-secondary-foreground hover:text-foreground hover:bg-white/6",
            // On a phone each tool is its own pill that rises out of the button; closed, it is hidden from taps and keys.
            "max-sm:ease-snappy max-sm:h-11 max-sm:rounded-full max-sm:px-4 max-sm:text-sm max-sm:transition-[opacity,translate,visibility] max-sm:duration-300",
            card !== name &&
              "max-sm:bg-[rgba(14,13,24,0.9)] max-sm:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_12px_32px_rgba(0,0,0,0.5)]",
            open ? rise : "max-sm:invisible max-sm:translate-y-3 max-sm:opacity-0",
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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close lesson tools" : "Lesson tools"}
        aria-expanded={open}
        className="text-foreground grid size-[52px] place-items-center rounded-full bg-[rgba(14,13,24,0.9)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_12px_32px_rgba(0,0,0,0.5)] sm:hidden"
      >
        <Plus
          size={20}
          weight="bold"
          className={cn("ease-snappy transition-[rotate] duration-300", open && "rotate-45")}
        />
      </button>
    </div>
  );
}
