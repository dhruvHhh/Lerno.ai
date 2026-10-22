import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, staticFile } from "remotion";

loadFont({
  family: "Geist",
  url: staticFile("geist.woff2"),
  weight: "100 900",
});

export const FONT = "Geist, sans-serif";

// The app's own tokens (frontend/src/index.css).
export const COLOR = {
  bg: "#050609",
  surface: "#0b0d14",
  fg: "#f5f5f7",
  secondary: "#a7aab8",
  muted: "#737789",
  accent: "#9b7cff",
  soft: "#b7a4ff",
  green: "#78dcaa",
};

export const BRAND_GRADIENT =
  "linear-gradient(90deg, #a996ff, #efeaff 50%, #e2b6ff)";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const progress = (
  frame: number,
  start: number,
  duration: number,
  easing = EASE,
) =>
  interpolate(frame, [start, start + duration], [0, 1], { ...CLAMP, easing });

// Headline text arrives out of a soft blur and leaves into one, like the reference video. Only for text: a blur on
// a whole panel is heavy to draw and makes playback stutter.
export const blurIn = (frame: number, start: number, duration = 24) => {
  const t = progress(frame, start, duration);
  return {
    opacity: t,
    filter: `blur(${(1 - t) * 10}px)`,
    translate: `0px ${(1 - t) * 18}px`,
  };
};

export const blurOut = (frame: number, start: number, duration = 18) => {
  const t = progress(frame, start, duration, Easing.in(Easing.cubic));
  return { opacity: 1 - t, filter: `blur(${t * 10}px)` };
};

// Panels open and close like the app's cards: a short scale from 0.94 with a fade, on the app's snappy curve.
export const popIn = (frame: number, start: number, duration = 24) => {
  const t = progress(frame, start, duration);
  return { opacity: t, scale: 0.94 + 0.06 * t };
};

export const popOut = (frame: number, start: number, duration = 16) => {
  const t = progress(frame, start, duration, Easing.in(Easing.cubic));
  return { opacity: 1 - t, scale: 1 - 0.06 * t };
};

// Open at `start`, close at `end` (never if `end` is undefined).
export const popInOut = (frame: number, start: number, end?: number) =>
  end !== undefined && frame >= end ? popOut(frame, end) : popIn(frame, start);

// A gentle fade for whole scenes: no blur, so playback stays smooth.
export const fadeOut = (frame: number, start: number, duration = 20) => ({
  opacity: 1 - progress(frame, start, duration),
});

// In at `start`, out at `end`.
export const blurInOut = (frame: number, start: number, end: number) => {
  const a = blurIn(frame, start);
  const b = blurOut(frame, end);
  return {
    opacity: a.opacity * b.opacity,
    filter: frame < end ? a.filter : b.filter,
    translate: a.translate,
  };
};

// Letters typed one by one between two frames.
export const typed = (
  text: string,
  frame: number,
  start: number,
  end: number,
) =>
  text.slice(
    0,
    Math.floor(interpolate(frame, [start, end], [0, text.length], CLAMP)),
  );

// The opacity of word `index` when words fade in one after another from `start`, `gap` frames apart.
export const wordOpacity = (
  frame: number,
  start: number,
  index: number,
  gap = 3,
) => progress(frame, start + index * gap, 10, Easing.out(Easing.cubic));
