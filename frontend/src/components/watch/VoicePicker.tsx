import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type useVoice from "@/hooks/useVoice";
import type { Language } from "@/lib/api";
import { cn } from "@/lib/utils";

// Each language in its own script, so a student finds theirs at a glance, and in English for everyone else.
const OPTIONS: [Language | "en", string][] = [
  ["en", "English"],
  ["hi", "हिन्दी (Hindi)"],
  ["ta", "தமிழ் (Tamil)"],
  ["bn", "বাংলা (Bengali)"],
];
export const LANGUAGE_NAMES: Record<Language, string> = { hi: "Hindi", ta: "Tamil", bn: "Bengali" };

const ITEM =
  "text-secondary-foreground hover:text-foreground focus-visible:text-foreground flex h-8 w-full cursor-pointer items-center justify-between gap-3 rounded-tile px-2.5 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-white/6 focus-visible:bg-white/6";

// The narration language, in the site's own menu: the browser's list can't be styled on Windows.
export default function VoicePicker({
  voice,
  onPick,
  className,
}: {
  voice: ReturnType<typeof useVoice>;
  onPick: (language: Language | "en") => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const label = OPTIONS.find(([code]) => code === voice.language)![1];
  const name = voice.language === "en" ? "" : LANGUAGE_NAMES[voice.language];

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

  // The menu pattern: arrows move between languages, Esc closes and returns to the button, Tab leaves. No key
  // reaches the page, whose Space, arrows and letters control the video.
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
    <div className={cn("relative mt-3 flex flex-col items-end gap-1.5 select-none sm:mt-4", className)}>
      <div className="flex items-center gap-2 text-[13px]">
        <span id="voice-label" className="text-muted-foreground">
          Voice
        </span>
        <button
          ref={trigger}
          type="button"
          onClick={() => (open ? close(false) : setOpen(true))}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-labelledby="voice-label voice-value"
          className={cn(
            "text-foreground focus-visible:ring-accent/60 flex h-8 cursor-pointer items-center gap-2 rounded-full bg-white/8 pr-3 pl-3.5 transition-colors outline-none hover:bg-white/12 focus-visible:ring-2",
            open && "bg-white/12",
          )}
        >
          <span id="voice-value">{label}</span>
          <CaretDown
            size={12}
            className={cn("text-muted-foreground transition-transform duration-150", open && "rotate-180")}
          />
        </button>
      </div>

      <div
        ref={menu}
        role="menu"
        aria-label="Voice"
        inert={!open}
        onKeyDown={onKey}
        className={cn(
          "rounded-row absolute top-full right-0 z-30 mt-1.5 w-[200px] origin-top-right bg-[#12131b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.55)]",
          "transition-[opacity,scale] duration-[140ms] ease-out",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-[0.96] opacity-0",
        )}
      >
        {OPTIONS.map(([code, text]) => (
          <button
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={voice.language === code}
            onClick={() => {
              close(true);
              if (code !== voice.language) onPick(code);
            }}
            className={cn(ITEM, voice.language === code && "text-foreground")}
          >
            {text}
            {voice.language === code && <Check size={14} className="text-accent-soft" />}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="text-muted-foreground text-xs empty:hidden">
        {voice.error ??
          (voice.failed && (
            <>
              Couldn't make the {name} voice.{" "}
              <button
                type="button"
                onClick={() => onPick(voice.language)}
                className="text-foreground cursor-pointer underline"
              >
                Try again
              </button>
            </>
          ))}
      </p>
    </div>
  );
}
