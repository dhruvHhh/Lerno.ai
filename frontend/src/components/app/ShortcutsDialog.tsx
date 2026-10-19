import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { ICON_BUTTON } from "@/components/app/Sidebar";

const KEYS = [
  { keys: ["Space"], does: "Play or pause" },
  { keys: ["←", "→"], does: "Skip back or ahead 5 seconds" },
  { keys: ["T"], does: "Open the tutor" },
  { keys: ["N"], does: "Open your notes" },
  { keys: ["Q"], does: "Open the quiz" },
  { keys: ["Esc"], does: "Close what is open" },
];

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

// The lesson page's keys, so people can find them.
export default function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Esc closes only this dialog, not a card on the page below it.
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, onClose]);

  // Only on the page while open: a hidden full-screen layer still costs the browser work on every frame.
  if (!open) return null;
  return createPortal(
    <div
      onPointerDown={(event) => event.target === event.currentTarget && onClose()}
      className="motion-safe:animate-pop-in fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="rounded-surface w-full max-w-[380px] bg-[#12131b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <header className="flex items-center justify-between py-2 pr-2 pl-4">
          <h2 className="text-[15px] font-semibold">Keyboard shortcuts</h2>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close" className={ICON_BUTTON}>
            <X size={16} />
          </button>
        </header>
        <p className="text-muted-foreground px-4 pb-2 text-xs">On a lesson page, when you are not typing.</p>
        <dl className="grid px-1 pb-1">
          {KEYS.map(({ keys, does }) => (
            <div key={does} className="rounded-tile flex h-10 items-center justify-between px-3 odd:bg-white/2">
              <dt className="text-secondary-foreground text-[13px]">{does}</dt>
              <dd className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="text-foreground rounded-tight grid h-6 min-w-6 place-items-center bg-white/6 px-1.5 font-sans text-[11px] font-medium shadow-[inset_0_-1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  >
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>,
    document.body,
  );
}
