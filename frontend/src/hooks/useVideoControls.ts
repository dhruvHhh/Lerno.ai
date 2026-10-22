import { useRef, useState, type MouseEvent, type SyntheticEvent } from "react";

// State and handlers for the home page's video controls; spread `videoProps` on the video.
export default function useVideoControls(onSecond?: (second: number) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(0);

  // A CSS variable moves the bar; state updates once a second.
  const updateProgress = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    seekBarRef.current?.style.setProperty("--progress", `${(video.currentTime / video.duration) * 100 || 0}%`);
    const second = Math.floor(video.currentTime);
    if (second === seconds) return;
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

  return {
    videoRef,
    videoProps: {
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      onTimeUpdate: updateProgress,
      onSeeking: updateProgress,
      onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => setDuration(event.currentTarget.duration),
    },
    controls: { playing, seconds, duration, seekBarRef, toggle, seek },
  };
}
