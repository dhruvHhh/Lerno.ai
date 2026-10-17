import { useRef, type PointerEvent } from "react";

import { formatTime } from "@/lib/utils";

// Markers closer than this share of the bar would overlap, so they merge into one with a count.
const TOUCH = 0.025;

interface ScrubProps {
  progress: number;
  duration: number;
  noteTimes: number[];
  onSeek: (fraction: number) => void;
}

function mergeMarkers(times: number[], duration: number) {
  const groups: { at: number; times: number[] }[] = [];
  for (const t of [...times].sort((a, b) => a - b)) {
    const at = t / duration;
    const last = groups[groups.length - 1];
    if (last && at - last.at < TOUCH) last.times.push(t);
    else groups.push({ at, times: [t] });
  }
  return groups;
}

export default function Scrub({ progress, duration, noteTimes, onSeek }: ScrubProps) {
  const bar = useRef<HTMLDivElement>(null);
  const seek = (event: PointerEvent) => {
    const box = bar.current!.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)));
  };

  return (
    <div
      ref={bar}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(progress * duration)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        seek(event);
      }}
      onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && seek(event)}
      className="relative ml-1.5 h-[18px] flex-1 cursor-pointer touch-none"
    >
      <span className="absolute inset-x-0 top-[7px] h-1 rounded bg-white/18" />
      <span className="bg-foreground absolute top-[7px] left-0 h-1 rounded" style={{ width: `${progress * 100}%` }} />
      {duration > 0 &&
        mergeMarkers(noteTimes, duration).map(({ at, times }) => (
          <span
            key={times.join()}
            className="group absolute top-0.5 h-3.5 w-3 -translate-x-1/2"
            style={{ left: `${at * 100}%` }}
          >
            <i className="bg-accent-soft absolute inset-x-px inset-y-0.5 rotate-45 rounded-[3px] shadow-[0_0_0_2px_#000,0_0_12px_rgba(183,164,255,0.6)]" />
            <span className="text-foreground pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-md bg-[#1a1b26] px-1.5 py-0.5 whitespace-nowrap group-hover:block">
              {times.length > 1 ? `${times.length} notes at ${formatTime(times[0])}` : formatTime(times[0])}
            </span>
          </span>
        ))}
      <span
        className="bg-foreground absolute top-[3px] size-3 -translate-x-1/2 rounded-full shadow-[0_0_0_4px_rgba(155,124,255,0.25)]"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
}
