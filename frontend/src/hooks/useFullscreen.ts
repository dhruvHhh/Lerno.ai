import { useSyncExternalStore, type RefObject } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
};

// Follows the browser, so the button stays right when Esc or the browser's own controls leave full screen.
export default function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const full = useSyncExternalStore(subscribe, () => !!ref.current && document.fullscreenElement === ref.current);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else ref.current?.requestFullscreen().catch(() => {});
  };
  return { full, toggle };
}
