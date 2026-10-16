import { useEffect, useRef, type RefObject } from "react";

const SPECKS = 34;

interface Speck {
  x: number;
  y: number;
  r: number;
  a: number;
  v: number;
  d: number;
}

// A few slow specks rising inside the glow around the loader, fading towards its edge.
// `tilt` is the pointer's offset from the middle; nearer specks drift further the other way.
export default function Dust({
  around,
  tilt,
}: {
  around: RefObject<HTMLElement | null>;
  tilt: RefObject<{ x: number; y: number }>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current!;
    const context = el.getContext("2d")!;
    let width = 0;
    let height = 0;
    let radius = 0;
    let ox = 0;
    let oy = 0;
    let frame = 0;
    let last = performance.now();
    let specks: Speck[] = [];

    const spawn = (s: Speck, anywhere: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      s.x = ox + Math.cos(angle) * distance;
      s.y = anywhere ? oy + Math.sin(angle) * distance : oy + radius * 0.9;
      return s;
    };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const box = el.getBoundingClientRect();
      const stage = around.current!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      ox = stage.left - box.left + stage.width / 2;
      oy = stage.top - box.top + stage.height / 2;
      radius = Math.min(stage.width * 0.42, 300);
      el.width = width * dpr;
      el.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      specks = Array.from({ length: SPECKS }, () =>
        spawn(
          {
            x: 0,
            y: 0,
            r: 0.6 + Math.random() * 1.1,
            a: 0.15 + Math.random() * 0.35,
            v: 5 + Math.random() * 8,
            d: 0.3 + Math.random(),
          },
          true,
        ),
      );
    };
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#c9bcff";
      for (const s of specks) {
        s.y -= s.v * dt;
        const distance = Math.hypot(s.x - ox, s.y - oy) / radius;
        if (distance > 1) {
          spawn(s, false);
          continue;
        }
        context.globalAlpha = s.a * (1 - distance) ** 1.5;
        context.beginPath();
        context.arc(s.x - tilt.current.x * 20 * s.d, s.y - tilt.current.y * 14 * s.d, s.r, 0, 7);
        context.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [around, tilt]);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}
