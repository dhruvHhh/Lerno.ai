import { useLenis } from "lenis/react";
import { animate, useMotionValue } from "motion/react";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

const WORDS_PER_MINUTE = 200;
// A section counts as being read once its heading passes this line, just under the sticky bars.
const READ_LINE = 140;
const USER_INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"];

// Tracks the section being read on a long page. `position` is the section number plus how far through it the reader is.
export default function useReading(ids: string[]) {
  const lenis = useLenis();
  const position = useMotionValue(0);
  const [active, setActive] = useState(() => ids.indexOf(window.location.hash.slice(1)));
  const [minutes, setMinutes] = useState<number | null>(null);
  // A section the reader picked stays marked until they scroll: a short one near the end can't reach the read line.
  const picked = useRef<number | null>(null);

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)!);
    const words = sections.map((section) => section.textContent.trim().split(/\s+/).length);
    const openFromAddress = () => {
      const opened = ids.indexOf(window.location.hash.slice(1));
      if (opened < 0) return;
      sections[opened].scrollIntoView();
      picked.current = opened;
      position.set(opened);
    };

    const read = () => {
      const tops = sections.map((section) => section.getBoundingClientRect().top);
      const height = window.innerHeight;
      const left = document.documentElement.scrollHeight - height - window.scrollY;
      // Near the end the line slides down the screen, so the last short sections get their turn too.
      const reach = height - READ_LINE;
      const line = READ_LINE + reach * Math.min(Math.max(1 - left / reach, 0), 1);

      const free = picked.current === null;
      const index = picked.current ?? tops.findLastIndex((top) => top <= line);
      const next = tops[index + 1];
      const share = free && index >= 0 && next !== undefined ? (line - tops[index]) / (next - tops[index]) : 0;
      if (free) position.set(Math.max(index, 0) + share);
      setActive(index);

      const after = words.slice(index + 1).reduce((sum, count) => sum + count, 0);
      const here = index >= 0 ? words[index] * (1 - share) : 0;
      setMinutes(free && left <= 1 ? 0 : Math.ceil((after + here) / WORDS_PER_MINUTE));
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    const release = () => {
      if (picked.current === null) return;
      picked.current = null;
      position.stop();
      schedule();
    };

    const onHashChange = () => {
      openFromAddress();
      schedule();
    };

    // This page loads after the browser looks for the address's section, so the browser can't find it by itself.
    openFromAddress();
    read();
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    for (const input of USER_INPUTS) window.addEventListener(input, release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      for (const input of USER_INPUTS) window.removeEventListener(input, release);
    };
  }, [ids, position]);

  // Replaces, never adds: a section is not a page, so one press of Back leaves. history.state is the router's own.
  useEffect(() => {
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", active < 0 ? pathname + search : `#${ids[active]}`);
  }, [active, ids]);

  const jump = useCallback(
    (event: MouseEvent, index: number) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      // Stops the browser adding to the history, and Lenis's own link handling, which ignores the sticky bars.
      event.preventDefault();
      event.stopPropagation();
      const section = document.getElementById(ids[index])!;
      picked.current = index;
      setActive(index);
      animate(position, index, { duration: prefersReducedMotion() ? 0 : 0.6, ease: EASE_EXPO });
      lenis?.scrollTo(section);
      section.querySelector("h2")?.focus({ preventScroll: true });
    },
    [ids, lenis, position],
  );

  return { active, minutes, position, jump };
}
