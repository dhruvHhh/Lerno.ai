import type { PointerEvent } from "react";

// Saves where the cursor crossed the edge, so the hover grows from there.
export const trackPointer = (event: PointerEvent<HTMLElement>) => {
  const target = event.currentTarget;
  const { left, top, width, height } = target.getBoundingClientRect();
  target.style.setProperty("--reveal-x", `${((event.clientX - left) / width) * 100}%`);
  target.style.setProperty("--reveal-y", `${((event.clientY - top) / height) * 100}%`);
};
