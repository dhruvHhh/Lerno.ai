import { CornersOutIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { useRef, useState, type MouseEvent } from "react";

import useAutoPlay from "@/hooks/useAutoPlay";

interface LessonPlayerProps {
  src: string;
  poster: string;
  label: string;
  autoPlay?: boolean;
}

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function LessonPlayer({ src, poster, label, autoPlay = false }: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useAutoPlay(videoRef, autoPlay);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration ? (time / duration) * 100 : 0;

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
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={label}
        width={1280}
        height={720}
        preload="metadata"
        muted
        loop={autoPlay}
        playsInline
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        className="aspect-video w-full cursor-pointer"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-3 text-xs">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseIcon weight="fill" className="size-4" /> : <PlayIcon weight="fill" className="size-4" />}
        </button>
        <button type="button" onClick={seek} aria-label="Seek" className="relative h-4 flex-1 cursor-pointer">
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
          <span
            className="bg-accent absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <span
            className="bg-accent absolute top-1/2 size-2.5 -translate-1/2 rounded-full"
            style={{ left: `${progress}%` }}
          />
        </button>
        <span className="text-secondary-foreground tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <button type="button" onClick={() => videoRef.current?.requestFullscreen()} aria-label="Full screen">
          <CornersOutIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
