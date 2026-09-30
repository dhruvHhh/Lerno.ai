import { CornersOutIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { useRef, useState, type MouseEvent, type SyntheticEvent } from "react";

import LessonVideo from "@/components/LessonVideo";
import type { Lesson } from "@/lib/demo-lesson";

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);

  // The bar moves through a CSS variable; state only changes once a second, for the clock.
  const updateProgress = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    seekBarRef.current?.style.setProperty("--progress", `${(video.currentTime / video.duration) * 100 || 0}%`);
    setSeconds(Math.floor(video.currentTime));
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <LessonVideo
        ref={videoRef}
        lesson={lesson}
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={updateProgress}
        onSeeking={updateProgress}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        className="cursor-pointer"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-3 text-xs">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseIcon weight="fill" className="size-4" /> : <PlayIcon weight="fill" className="size-4" />}
        </button>
        <button
          ref={seekBarRef}
          type="button"
          onClick={seek}
          aria-label="Seek"
          className="relative h-4 flex-1 cursor-pointer"
        >
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
          <span className="bg-accent absolute top-1/2 left-0 h-1 w-(--progress,0%) -translate-y-1/2 rounded-full" />
          <span className="bg-accent absolute top-1/2 left-(--progress,0%) size-2.5 -translate-1/2 rounded-full" />
        </button>
        <span className="text-secondary-foreground tabular-nums">
          {formatTime(seconds)} / {formatTime(duration)}
        </span>
        <button type="button" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Full screen">
          <CornersOutIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
