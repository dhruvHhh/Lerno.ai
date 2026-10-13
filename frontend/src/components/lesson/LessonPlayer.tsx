import { CornersInIcon, CornersOutIcon, PauseIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";

import LessonVideo from "@/components/lesson/LessonVideo";
import type { Lesson } from "@/content/demo-lessons";
import { cn, formatTime } from "@/lib/utils";

const ZOOM = { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as const;

interface LessonPlayerProps {
  lesson: Lesson;
  onSecond?: (second: number) => void;
}

export default function LessonPlayer({ lesson, onSecond }: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zooming, setZooming] = useState(false);
  const lenis = useLenis();
  const transition = useReducedMotion() ? { duration: 0 } : ZOOM;

  useEffect(() => {
    if (!expanded) return;
    lenis?.stop();
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded, lenis]);

  // A CSS variable moves the bar; state updates once a second.
  const updateProgress = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    seekBarRef.current?.style.setProperty("--progress", `${(video.currentTime / video.duration) * 100 || 0}%`);
    const second = Math.floor(video.currentTime);
    setSeconds(second);
    onSecond?.(second);
  };

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const seek = (event: MouseEvent<HTMLButtonElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    video.currentTime = ((event.clientX - left) / width) * duration;
  };

  return (
    <div className="relative aspect-video w-full">
      <AnimatePresence>
        {expanded && (
          <m.div
            aria-hidden="true"
            onClick={() => setExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <m.div
        layout
        transition={transition}
        onLayoutAnimationStart={() => setZooming(true)}
        onLayoutAnimationComplete={() => setZooming(false)}
        style={{ borderRadius: 16 }}
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded || undefined}
        aria-label={expanded ? lesson.title : undefined}
        className={cn(
          "overflow-hidden bg-black",
          expanded
            ? "fixed top-1/2 left-1/2 z-70 mt-[calc(var(--popup-w)*-9/32)] ml-[calc(var(--popup-w)/-2)] w-(--popup-w) border border-white/10 [--popup-w:min(92vw,calc((100svh_-_6rem)*16/9))] sm:[--popup-w:min(80vw,1100px,calc((100svh_-_6rem)*16/9))]"
            : "absolute inset-0",
        )}
      >
        <LessonVideo
          ref={videoRef}
          lesson={lesson}
          preload="metadata"
          onClick={expanded ? toggle : () => setExpanded(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={updateProgress}
          onSeeking={updateProgress}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          className="cursor-pointer"
        />
        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close"
            className={cn(
              "absolute top-3 right-3 grid size-9 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
              zooming && "opacity-0",
            )}
          >
            <XIcon className="size-4" />
          </button>
        )}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-3 text-xs transition-opacity duration-200",
            zooming && "opacity-0",
          )}
        >
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="-m-2 p-2">
            {playing ? <PauseIcon weight="fill" className="size-4" /> : <PlayIcon weight="fill" className="size-4" />}
          </button>
          <button ref={seekBarRef} type="button" onClick={seek} aria-label="Seek" className="relative h-6 flex-1">
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
            <span className="bg-accent absolute top-1/2 left-0 h-1 w-(--progress,0%) -translate-y-1/2 rounded-full" />
            <span className="bg-accent absolute top-1/2 left-(--progress,0%) size-2.5 -translate-1/2 rounded-full" />
          </button>
          <span className="text-secondary-foreground tabular-nums">
            {formatTime(seconds)} / {formatTime(duration)}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((isExpanded) => !isExpanded)}
            aria-label={expanded ? "Shrink" : "Expand"}
            className="-m-2 p-2"
          >
            {expanded ? <CornersInIcon className="size-4" /> : <CornersOutIcon className="size-4" />}
          </button>
        </div>
      </m.div>
    </div>
  );
}
