import { useCallback, useMemo, useSyncExternalStore } from "react";

// Whether a CSS media query matches right now, updating when it changes.
export default function useMediaQuery(query: string) {
  const list = useMemo(() => window.matchMedia(query), [query]);
  const subscribe = useCallback(
    (onChange: () => void) => {
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [list],
  );
  return useSyncExternalStore(subscribe, () => list.matches);
}
