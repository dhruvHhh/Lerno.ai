import { CaretUpDown, CircleNotch, Keyboard, SignOut } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import Avatar from "@/components/app/Avatar";
import ShortcutsDialog from "@/components/app/ShortcutsDialog";
import { FADE } from "@/components/app/Sidebar";
import useAuth from "@/hooks/useAuth";
import { userName } from "@/lib/auth";
import signOut from "@/lib/signOut";
import { cn } from "@/lib/utils";

const GAP = 8;
const WIDE = 1024;
const ITEM =
  "text-secondary-foreground hover:text-foreground focus-visible:text-foreground flex h-8 w-full items-center gap-2.5 rounded-tile px-2.5 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-white/6 focus-visible:bg-white/6";

// The account row and its menu. The menu is drawn over the page, since the sidebar clips what leaves its edges.
export default function AccountMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [place, setPlace] = useState<{ style: CSSProperties; side: "right" | "top" }>({ style: {}, side: "top" });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // On a wide screen it opens beside the sidebar, bottom edges aligned; in the phone drawer, above the row.
  const show = () => {
    const row = trigger.current!.getBoundingClientRect();
    const sidebar = trigger.current!.closest("aside")!.getBoundingClientRect();
    setPlace(
      window.innerWidth >= WIDE
        ? { side: "right", style: { left: sidebar.right + GAP, bottom: window.innerHeight - row.bottom } }
        : { side: "top", style: { left: row.left, bottom: window.innerHeight - row.top + 6, width: row.width } },
    );
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector("button")?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  // The menu pattern: arrows move between items, Esc closes and returns to the row, Tab leaves.
  const onKey = (event: KeyboardEvent) => {
    const items = [...menu.current!.querySelectorAll("button")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[(at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") close(false);
  };

  if (!user) return null;
  const name = userName(user);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => (open ? close(false) : show())}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className={cn(
          "rounded-tile flex w-full items-center gap-2.5 px-1 py-1.5 text-left whitespace-nowrap transition-colors duration-150 hover:bg-white/4",
          open && "bg-white/4",
          "lg:group-data-rail/sidebar:px-[5px]",
        )}
      >
        <Avatar name={name} />
        <span className={cn("min-w-0 flex-1", FADE)}>
          <b className="block text-[13px] font-medium">{name}</b>
          <small className="text-muted-foreground block truncate text-[11px]">{user.email}</small>
        </span>
        <CaretUpDown size={14} className={cn("text-muted-foreground mr-1 flex-none", FADE)} />
      </button>

      {createPortal(
        <div
          ref={menu}
          role="menu"
          aria-label="Account"
          inert={!open}
          onKeyDown={onKey}
          style={place.style}
          className={cn(
            "rounded-row fixed z-50 bg-[#12131b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.55)]",
            place.side === "right" ? "w-[248px] origin-bottom-left" : "origin-bottom",
            "transition-[opacity,scale] duration-[140ms] ease-out",
            open ? "scale-100 opacity-100" : "pointer-events-none scale-[0.96] opacity-0",
          )}
        >
          <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2.5">
            <Avatar name={name} />
            <span className="min-w-0">
              <b className="block truncate text-[13px] font-medium">{name}</b>
              <small className="text-muted-foreground block truncate text-[11px]" title={user.email}>
                {user.email}
              </small>
            </span>
          </div>
          <div className="mx-1 mb-1 h-px bg-white/7" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close(false);
              setShortcuts(true);
            }}
            className={ITEM}
          >
            <Keyboard size={15} />
            Keyboard shortcuts
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={leaving}
            onClick={() => {
              setLeaving(true);
              void signOut();
            }}
            className={ITEM}
          >
            {leaving ? <CircleNotch size={15} className="motion-safe:animate-spin" /> : <SignOut size={15} />}
            {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>,
        document.body,
      )}

      <ShortcutsDialog open={shortcuts} onClose={() => setShortcuts(false)} />
    </>
  );
}
