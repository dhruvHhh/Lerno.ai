import { useLayoutEffect, useRef, type PointerEvent } from "react";

import Stamp from "@/components/watch/Stamp";
import useVideoTime from "@/hooks/useVideoTime";
import type { Note } from "@/hooks/useNotes";
import { cn, formatTime } from "@/lib/utils";

// Markers closer than this share of the bar would overlap, so they merge into one with a count.
const TOUCH = 0.025;

interface ScrubProps {
  video: HTMLVideoElement | null;
  playing: boolean;
  duration: number;
  notes: Note[];
  onSeek: (fraction: number) => void;
  onOpenNotes: (ids: string[]) => void;
}

function mergeMarkers(notes: Note[], duration: number) {
  const groups: { at: number; notes: Note[] }[] = [];
  for (const note of [...notes].sort((a, b) => a.time_seconds - b.time_seconds)) {
    const at = note.time_seconds / duration;
    const last = groups[groups.length - 1];
    if (last && at - last.at < TOUCH) last.notes.push(note);
    else groups.push({ at, notes: [note] });
  }
  return groups;
}

export default function Scrub({ video, playing, duration, notes, onSeek, onOpenNotes }: ScrubProps) {
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
        mergeMarkers(notes, duration).map(({ at, notes: group }) => (
          // A marker opens its notes; it must not also seek the bar under it.
          <button
            key={group.map((note) => note.id).join()}
            type="button"
            aria-label={`Open ${group.length > 1 ? `${group.length} notes` : "note"} at ${formatTime(group[0].time_seconds)}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onOpenNotes(group.map((note) => note.id))}
            className="group absolute -top-0.5 grid size-[22px] -translate-x-1/2 place-items-center"
            style={{ left: `${at * 100}%` }}
          >
            <i className="bg-accent-soft ease-snappy size-[9px] rotate-45 rounded-[2px] shadow-[0_0_0_2px_#000,0_0_12px_rgba(183,164,255,0.6)] transition-[scale] duration-200 group-hover:scale-125" />
            {/* A preview of the note itself, the way a video site previews a chapter. Kept inside the film's edges. */}
            <span
              className={cn(
                "pointer-events-none absolute bottom-7 w-max max-w-[240px] rounded-[10px] bg-[rgba(16,15,26,0.96)] px-3 py-2 text-left opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_12px_30px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
                at < 0.2 ? "left-0" : at > 0.8 ? "right-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              <Stamp note>
                {formatTime(group[0].time_seconds)}
                {group.length > 1 && (
                  <span className="text-muted-foreground font-normal">+{group.length - 1} more</span>
                )}
              </Stamp>
              <span className="text-foreground mt-1 line-clamp-2 block text-[13px] leading-snug">
                {group[0].content}
              </span>
            </span>
          </button>
        ))}
      {/* A full-width track that moves, so its percentage is a share of the bar, not of the knob. */}
      <span ref={knob} className="pointer-events-none absolute inset-x-0 top-[3px] will-change-transform">
        <span className="bg-foreground absolute left-0 size-3 -translate-x-1/2 rounded-full shadow-[0_0_0_4px_rgba(155,124,255,0.25)]" />
      </span>
    </div>
  );
}
