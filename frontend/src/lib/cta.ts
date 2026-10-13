import type { PointerEvent } from "react";

// Records where the cursor entered or left a main button, so its hover gradient grows from that point.
export const trackPointer = (event: PointerEvent<HTMLElement>) => {
  const target = event.currentTarget;
  const { left, top, width, height } = target.getBoundingClientRect();
  target.style.setProperty("--reveal-x", `${((event.clientX - left) / width) * 100}%`);
  target.style.setProperty("--reveal-y", `${((event.clientY - top) / height) * 100}%`);
};
