import { ArrowRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { cn, prefersReducedMotion } from "@/lib/utils";

const CANVAS_SIZE = 800;

const TEXT_X = 16;

const TEXT_BASELINE = 40;

interface Particle {
  x: number;
  y: number;
  r: number;
  color: string;
}

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onSubmit: (value: string) => void;
}

function textToParticles(ctx: CanvasRenderingContext2D, input: HTMLInputElement, text: string) {
  const style = getComputedStyle(input);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.font = `${parseFloat(style.fontSize) * 2}px ${style.fontFamily}`;
  ctx.fillStyle = "#f5f5f7";
  ctx.fillText(text, TEXT_X, TEXT_BASELINE);

  // Only scan the box the text was drawn in, not the whole canvas.
  const metrics = ctx.measureText(text);
  const width = Math.min(CANVAS_SIZE, Math.ceil(TEXT_X + metrics.width));
  const height = Math.ceil(TEXT_BASELINE + metrics.actualBoundingBoxDescent);
  const { data } = ctx.getImageData(0, 0, width, height);
  const particles: Particle[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = 4 * (y * width + x);
      if (data[i] && data[i + 1] && data[i + 2]) {
        particles.push({ x, y, r: 1, color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3] / 255})` });
      }
    }
  }
  return particles;
}

export function PlaceholdersAndVanishInput({ placeholders, onSubmit }: PlaceholdersAndVanishInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const form = formRef.current;
    if (!form || prefersReducedMotion()) return;

    let timer = 0;
    const stop = () => window.clearInterval(timer);
    const observer = new IntersectionObserver(([entry]) => {
      stop();
      if (entry.isIntersecting) {
        timer = window.setInterval(() => setPlaceholderIndex((index) => (index + 1) % placeholders.length), 3000);
      }
    });
    observer.observe(form);
    return () => {
      stop();
      observer.disconnect();
    };
  }, [placeholders.length]);

  const vanish = (text: string) => {
    const canvas = canvasRef.current;
    const input = inputRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !input || !ctx) return onSubmit(text);

    canvas.width = canvas.height = CANVAS_SIZE;
    let particles = textToParticles(ctx, input, text);
    let edge = particles.reduce((max, particle) => Math.max(max, particle.x), 0);
    setAnimating(true);

    const step = () => {
      particles = particles.filter((particle) => {
        if (particle.x < edge) return true;
        particle.x += Math.random() > 0.5 ? 1 : -1;
        particle.y += Math.random() > 0.5 ? 1 : -1;
        particle.r -= 0.05 * Math.random();
        return particle.r > 0;
      });
      ctx.clearRect(edge, 0, CANVAS_SIZE, CANVAS_SIZE);
      for (const particle of particles) {
        if (particle.x > edge) {
          ctx.fillStyle = particle.color;
          ctx.fillRect(particle.x, particle.y, particle.r, particle.r);
        }
      }
      edge -= 8;

      if (particles.length) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setValue("");
        setAnimating(false);
        onSubmit(text);
      }
    };
    frameRef.current = requestAnimationFrame(step);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || animating) return;
    if (prefersReducedMotion()) onSubmit(text);
    else vanish(text);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-surface focus-within:border-accent/50 relative h-12 w-full overflow-hidden rounded-full border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "pointer-events-none absolute top-[20%] left-3 origin-top-left scale-50",
          !animating && "opacity-0",
        )}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => !animating && setValue(event.target.value)}
        aria-label="What do you want to learn?"
        className={cn(
          "text-foreground relative z-10 h-full w-full rounded-full bg-transparent pr-14 pl-5 text-sm outline-none sm:text-base",
          animating && "text-transparent",
        )}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="Create lesson"
        className="bg-accent disabled:bg-accent/30 absolute top-1/2 right-2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white disabled:text-white/60"
      >
        <ArrowRightIcon weight="bold" className="size-4" />
      </button>

      <div className="pointer-events-none absolute inset-0 flex items-center">
        <AnimatePresence mode="wait">
          {!value && (
            <m.p
              key={placeholderIndex}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="text-muted-foreground truncate pr-14 pl-5 text-sm sm:text-base"
            >
              {placeholders[placeholderIndex]}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
