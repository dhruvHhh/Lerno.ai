import { ArrowRight } from "@phosphor-icons/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { EASE_EXPO } from "@/lib/variants";
import { cn } from "@/lib/utils";

export const MAX_QUESTION = 200;
const CYCLE_MS = 3000;

interface AskBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  examples: string[];
  locked: boolean;
  vanishing: boolean;
  onVanished: () => void;
}

// Based on Aceternity's "Placeholders and Vanish Input", in Lerno's field style.
export default function AskBox({ value, onChange, onSubmit, examples, locked, vanishing, onVanished }: AskBoxProps) {
  const reduceMotion = useReducedMotion();
  const [example, setExample] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduceMotion || value) return;
    const timer = setInterval(() => setExample((index) => (index + 1) % examples.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, value, examples.length]);

  useEffect(() => {
    if (!vanishing) return;
    if (reduceMotion) return onVanished();
    return vanish(canvas.current!, input.current!, onVanished);
  }, [vanishing, reduceMotion, onVanished]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={submit}
      autoComplete="off"
      className={cn(
        "relative h-[52px] overflow-hidden rounded-full bg-[#05060a] sm:h-14",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)]",
        "hover:not-focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_2px_rgba(155,124,255,0.55),0_0_0_3px_rgba(155,124,255,0.12)]",
        "focus-within:bg-[#08090f] focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_0_0_2px_rgba(155,124,255,0.8),0_0_0_6px_rgba(155,124,255,0.22),0_20px_60px_-20px_rgba(122,96,230,0.5)]",
        "ease-spring transition-[box-shadow,background-color,opacity] duration-[400ms]",
        locked && "pointer-events-none opacity-55",
      )}
    >
      {!value && (
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-16 left-5 flex items-center overflow-hidden text-[15px] whitespace-nowrap sm:left-[26px] sm:text-base">
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={example}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: EASE_EXPO }}
              className="truncate"
            >
              {examples[example]}
            </m.span>
          </AnimatePresence>
        </div>
      )}
      <input
        ref={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_QUESTION}
        disabled={locked}
        aria-label="Your question"
        className={cn(
          "caret-accent-soft text-foreground relative z-[2] size-full bg-transparent pr-16 pl-5 text-[15px] outline-none sm:pl-[26px] sm:text-base",
          vanishing && "text-transparent",
        )}
      />
      <canvas ref={canvas} className="pointer-events-none absolute top-0 left-0 z-[3]" />
      <button
        type="submit"
        aria-label="Make lesson"
        className={cn(
          "group/send absolute top-2 right-2 z-[4] grid size-9 place-items-center rounded-full sm:size-10",
          "ease-snappy transition-[background-color,color,box-shadow,scale] duration-300 active:scale-94",
          value
            ? "bg-foreground text-background shadow-[0_0_28px_rgba(155,124,255,0.35)]"
            : "text-muted-foreground bg-[#1a1c26]",
        )}
      >
        <ArrowRight
          size={18}
          weight="bold"
          className={cn(
            "ease-snappy transition-transform duration-[350ms]",
            value && "group-hover/send:translate-x-0.5",
          )}
        />
      </button>
    </form>
  );
}

// Draws the text onto a canvas, turns its pixels into dots, and sweeps them away from right to left.
function vanish(canvas: HTMLCanvasElement, input: HTMLInputElement, done: () => void) {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.parentElement!.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d")!;
  context.scale(dpr, dpr);
  const style = getComputedStyle(input);
  const left = parseFloat(style.paddingLeft);
  context.font = `${style.fontSize} ${style.fontFamily}`;
  context.fillStyle = "#f5f5f7";
  context.textBaseline = "middle";
  context.fillText(input.value, left, height / 2);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const dots: { x: number; y: number; r: number; a: number }[] = [];
  for (let y = 0; y < canvas.height; y += 2)
    for (let x = 0; x < canvas.width; x += 2) {
      const alpha = pixels[(y * canvas.width + x) * 4 + 3];
      if (alpha > 40) dots.push({ x: x / dpr, y: y / dpr, r: 1, a: alpha / 255 });
    }

  let edge = Math.max(left, ...dots.map((dot) => dot.x));
  let frame = 0;
  const step = () => {
    context.clearRect(0, 0, width, height);
    edge -= 8;
    let alive = 0;
    for (const dot of dots) {
      if (dot.x > edge) {
        dot.x += Math.random() > 0.5 ? 1.2 : -1.2;
        dot.y += Math.random() > 0.5 ? 1.2 : -1.2;
        dot.r -= 0.05 * Math.random();
      }
      if (dot.r <= 0) continue;
      alive++;
      context.globalAlpha = dot.a * dot.r;
      context.fillStyle = dot.x > edge ? "#b7a4ff" : "#f5f5f7";
      context.fillRect(dot.x, dot.y, dot.r * 2, dot.r * 2);
    }
    if (alive) frame = requestAnimationFrame(step);
    else {
      context.clearRect(0, 0, width, height);
      done();
    }
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
