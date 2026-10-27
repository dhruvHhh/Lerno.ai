import type { PointerEvent } from "react";

// The main-button look; render CtaReveal as the first child and spread CTA_POINTER on it.
export const CTA =
  "cta bg-foreground text-background relative isolate overflow-hidden shadow-[0_0_32px_rgba(155,124,255,0.3)]";

// Saves where the cursor crossed the edge, so the hover grows from there.
export const trackPointer = (event: PointerEvent<HTMLElement>) => {
  const target = event.currentTarget;
  const { left, top, width, height } = target.getBoundingClientRect();
  target.style.setProperty("--reveal-x", `${((event.clientX - left) / width) * 100}%`);
  target.style.setProperty("--reveal-y", `${((event.clientY - top) / height) * 100}%`);
};

// Touch lights the button the moment the finger lands; :active would wait until the browser rules out a scroll.
const press = (event: PointerEvent<HTMLElement>) => {
  if (event.pointerType !== "mouse") event.currentTarget.dataset.pressed = "";
};
const release = (event: PointerEvent<HTMLElement>) => delete event.currentTarget.dataset.pressed;

export const CTA_POINTER = {
  onPointerEnter: trackPointer,
  onPointerLeave: (event: PointerEvent<HTMLElement>) => {
    trackPointer(event);
    release(event);
  },
  onPointerDown: press,
  onPointerUp: release,
  // Sent when the touch turns into a scroll.
  onPointerCancel: release,
};
