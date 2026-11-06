import { CaretUpDown, Check, type Icon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

const GAP = 8;
const ITEM =
  "text-secondary-foreground hover:text-foreground focus-visible:text-foreground flex h-8 w-full cursor-pointer items-center justify-between gap-3 rounded-tile px-2.5 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-white/6 focus-visible:bg-white/6";

interface PickerProps<T extends string> {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onPick: (value: T) => void;
  // Up and down by default: the menu opens either way, by the room on screen.
  icon?: Icon;
}

// A label and a choice, in the site's own menu: the browser's list can't be styled on Windows.
export default function Picker<T extends string>({
  label,
  options,
  value,
  onPick,
  icon: TriggerIcon = CaretUpDown,
}: PickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  // Opens up when the dock, fixed to the bottom of the screen, or the screen's edge leaves no room below.
  const show = () => {
    const floor = document.querySelector("[data-dock]")?.getBoundingClientRect().top ?? window.innerHeight;
    const room = Math.min(floor, window.innerHeight) - trigger.current!.getBoundingClientRect().bottom;
    setUp(room < menu.current!.offsetHeight + GAP);
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("[aria-checked=true]")?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  // The menu pattern: arrows move between options, Esc closes and returns to the button, Tab leaves. No key reaches
  // the page, where a lesson's Space, arrows and letters control the video.
  const onKey = (event: KeyboardEvent) => {
    event.stopPropagation();
    const items = [...menu.current!.querySelectorAll("button")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[(at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    } else if (event.key === "Escape") close(true);
    else if (event.key === "Tab") close(false);
  };

  return (
    <div className="relative flex items-center gap-2 text-[13px] select-none">
      <span id={`${id}-label`} className="text-muted-foreground">
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          event.stopPropagation();
          show();
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        className={cn(
          "text-foreground focus-visible:ring-accent/60 flex h-8 cursor-pointer items-center gap-2 rounded-full bg-white/8 pr-3 pl-3.5 whitespace-nowrap transition-colors outline-none hover:bg-white/12 focus-visible:ring-2",
          open && "bg-white/12",
        )}
      >
        <span id={`${id}-value`}>{options.find(([option]) => option === value)![1]}</span>
        <TriggerIcon size={14} className="text-muted-foreground" />
      </button>

      <div
        ref={menu}
        role="menu"
        aria-label={label}
        inert={!open}
        onKeyDown={onKey}
        className={cn(
          "rounded-row absolute right-0 z-30 w-[200px] bg-[#12131b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.55)]",
          up ? "bottom-full mb-1.5 origin-bottom-right" : "top-full mt-1.5 origin-top-right",
          "transition-[opacity,scale] duration-[140ms] ease-out",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-[0.96] opacity-0",
        )}
      >
        {options.map(([option, text]) => (
          <button
            key={option}
            type="button"
            role="menuitemradio"
            aria-checked={value === option}
            onClick={() => {
              close(true);
              if (option !== value) onPick(option);
            }}
            className={cn(ITEM, value === option && "text-foreground")}
          >
            {text}
            {value === option && <Check size={14} className="text-accent-soft" />}
          </button>
        ))}
      </div>
    </div>
  );
}
