import { useLayoutEffect, useRef, type PointerEvent } from "react";

import useVideoTime from "@/hooks/useVideoTime";
import { formatTime } from "@/lib/utils";

// Markers closer than this share of the bar would overlap, so they merge into one with a count.
const TOUCH = 0.025;

interface ScrubProps {
  video: HTMLVideoElement | null;
  playing: boolean;
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

export default function Scrub({ video, playing, duration, noteTimes, onSeek }: ScrubProps) {
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  // Painted straight onto the elements, as transforms so no frame needs a layout: a video reports its time
  // only about 4 times a second.
  const paint = (fraction: number) => {
    fill.current!.style.transform = `scaleX(${fraction})`;
    knob.current!.style.transform = `translateX(${fraction * 100}%)`;
  };

  const seconds = useVideoTime(video, (v) => Math.round(v.currentTime), 0);

  // Reads the video's own time, which is exact: the last reported one can be a quarter second behind. While
  // playing, the bar follows the playhead on every frame; paused, it moves when the video seeks.
  useLayoutEffect(() => {
    const repaint = () => {
      if (video?.duration && !dragging.current) paint(video.currentTime / video.duration);
      else if (!video?.duration) paint(0);
    };
    repaint();
    const events = ["seeked", "loadedmetadata", "emptied"];
    events.forEach((event) => video?.addEventListener(event, repaint));
    let frame = 0;
    const tick = () => {
      repaint();
      frame = requestAnimationFrame(tick);
    };
    if (playing) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((event) => video?.removeEventListener(event, repaint));
    };
  }, [video, playing]);

  // The knob stays under the pointer; the video catches up behind it.
  const seek = (event: PointerEvent) => {
    const box = bar.current!.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    paint(fraction);
    onSeek(fraction);
  };

  return (
    <div
      ref={bar}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={seconds}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = true;
        seek(event);
      }}
      onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && seek(event)}
      onLostPointerCapture={() => (dragging.current = false)}
      className="relative ml-1.5 h-[18px] flex-1 cursor-pointer touch-none"
    >
      <span className="absolute inset-x-0 top-[7px] h-1 rounded bg-white/18" />
      <span
        ref={fill}
        className="bg-foreground absolute inset-x-0 top-[7px] h-1 origin-left rounded will-change-transform"
      />
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
      {/* A full-width track that moves, so its percentage is a share of the bar, not of the knob. */}
      <span ref={knob} className="pointer-events-none absolute inset-x-0 top-[3px] will-change-transform">
        <span className="bg-foreground absolute left-0 size-3 -translate-x-1/2 rounded-full shadow-[0_0_0_4px_rgba(155,124,255,0.25)]" />
      </span>
    </div>
  );
}
