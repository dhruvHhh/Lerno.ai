import { CaretDown } from "@phosphor-icons/react";
import { m, type MotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { type MouseEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface IndexProps {
  sections: { id: string; title: string }[];
  active: number;
  minutes: number | null;
  position: MotionValue<number>;
  onJump: (event: MouseEvent, index: number) => void;
}

const LINE_X = 12;
const BEND_MIN = 2;
const BEND_MAX = 7;

const timeLeft = (minutes: number | null) => {
  if (minutes === null) return "";
  return minutes === 0 ? "Finished" : `${minutes} min left`;
};

// A wave down the list: the longer a section, the wider its bend, so the shape shows what is long before it is read.
function drawWave(rows: number[], lengths: number[]) {
  const longest = Math.max(...lengths);
  const peaks = rows.slice(0, -1).map((row, i) => ({
    x: LINE_X + (BEND_MIN + (BEND_MAX - BEND_MIN) * (lengths[i] / longest)) * (i % 2 ? -1 : 1),
    y: (row + rows[i + 1]) / 2,
  }));
  const points = [{ x: peaks[0].x, y: rows[0] }, ...peaks, { x: peaks.at(-1)!.x, y: rows.at(-1)! }];
  // The line runs straight down through every point, so each curve meets the next without a corner.
  return points.reduce((path, point, i) => {
    if (i === 0) return `M${point.x} ${point.y}`;
    const before = points[i - 1];
    const middle = (before.y + point.y) / 2;
    return `${path} C${before.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`;
  }, "");
}

export function RailIndex({ sections, active, minutes, position, onJump }: IndexProps) {
  const list = useRef<HTMLOListElement>(null);
  const wave = useRef<SVGPathElement>(null);
  const read = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const [shape, setShape] = useState<{ path: string; rows: number[]; height: number } | null>(null);

  useLayoutEffect(() => {
    const element = list.current!;
    const measure = () => {
      // Hidden on small screens, where there is nothing to measure.
      if (!element.offsetHeight) return;
      const rows = [...element.children].map((child) => {
        const row = child as HTMLElement;
        return row.offsetTop + row.offsetHeight / 2;
      });
      const lengths = sections.map(({ id }) => document.getElementById(id)!.offsetHeight);
      setShape({ path: drawWave(rows, lengths), rows, height: element.offsetHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [sections]);

  const draw = useCallback(
    (at: number) => {
      if (!shape || !wave.current) return;
      const index = Math.min(Math.floor(at), shape.rows.length - 1);
      const next = shape.rows[index + 1] ?? shape.rows[index];
      const y = shape.rows[index] + (next - shape.rows[index]) * (at - index);
      // The wave only ever moves down, so the point at this height can be searched for.
      const total = wave.current.getTotalLength();
      let low = 0;
      let high = total;
      for (let i = 0; i < 16; i++) {
        const middle = (low + high) / 2;
        if (wave.current.getPointAtLength(middle).y < y) low = middle;
        else high = middle;
      }
      const point = wave.current.getPointAtLength(high);
      read.current!.style.strokeDasharray = `${high} ${total}`;
      dot.current!.setAttribute("cx", String(point.x));
      dot.current!.setAttribute("cy", String(point.y));
    },
    [shape],
  );
  useEffect(() => draw(position.get()), [draw, position]);
  useMotionValueEvent(position, "change", draw);

  return (
    <nav aria-label="On this page" className="sticky top-24 hidden self-start lg:block">
      <div className="flex items-baseline justify-between gap-4 text-[13px]">
        <p className="text-foreground font-medium">On this page</p>
        <p className="text-muted-foreground whitespace-nowrap tabular-nums">{timeLeft(minutes)}</p>
      </div>
      <div className="relative mt-4">
        {shape && (
          <svg aria-hidden width={LINE_X * 2} height={shape.height} className="absolute top-0 left-0" fill="none">
            <path ref={wave} d={shape.path} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
            <path ref={read} d={shape.path} stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
            <circle
              ref={dot}
              r={3.5}
              fill="var(--color-accent-soft)"
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          </svg>
        )}
        <ol ref={list} className="relative">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => onJump(event, index)}
                aria-current={index === active ? "location" : undefined}
                className={cn(
                  "block py-1.5 pl-8 text-[13px] leading-5 transition-colors duration-200",
                  index === active && "text-foreground",
                  index < active && "text-secondary-foreground hover:text-foreground",
                  index > active && "text-muted-foreground hover:text-foreground",
                )}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

// No room beside the text on a small screen, so the index folds into a bar that stays under the top bar.
export function PhoneIndex({ sections, active, minutes, position, onJump }: IndexProps) {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const progress = useTransform(position, (at) => Math.min(at / (sections.length - 1), 1));

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!bar.current!.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <nav
      ref={bar}
      aria-label="On this page"
      className="bg-background sticky top-14 z-10 -mx-6 mt-8 border-y border-white/6 sm:-mx-12 lg:hidden"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center gap-2.5 px-6 text-left text-[13px] sm:px-12"
      >
        <span className="text-muted-foreground flex-none tabular-nums">
          {active < 0 ? `${sections.length} sections` : `${active + 1} of ${sections.length}`}
        </span>
        <span className="text-foreground min-w-0 flex-1 truncate">
          {active < 0 ? "On this page" : sections[active].title}
        </span>
        <span className="text-muted-foreground flex-none tabular-nums">{timeLeft(minutes)}</span>
        <CaretDown
          size={13}
          className={cn("text-muted-foreground flex-none transition-transform", open && "rotate-180")}
        />
      </button>
      <m.span
        aria-hidden
        style={{ scaleX: progress }}
        className="bg-accent absolute inset-x-0 -bottom-px block h-px origin-left"
      />
      {open && (
        <ol
          data-lenis-prevent
          className="bg-surface absolute inset-x-0 top-full max-h-[60vh] overflow-y-auto border-b border-white/6 px-3 py-2 sm:px-9"
        >
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(event) => {
                  setOpen(false);
                  onJump(event, index);
                }}
                aria-current={index === active ? "location" : undefined}
                className={cn(
                  "rounded-row block px-3 py-2 text-sm",
                  index === active ? "text-foreground bg-white/4" : "text-secondary-foreground",
                )}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
