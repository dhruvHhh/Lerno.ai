import { useEffect, type RefObject } from "react";

import { afterPageLoad, prefersReducedMotion } from "@/lib/utils";

// Wait for page load, so videos don't slow the first paint.
export default function useAutoPlay(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion()) return;

    // A video the visitor paused stays paused when it scrolls back into view.
    let paused = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!paused) video.play().catch(() => {});
      } else {
        paused = video.paused && video.played.length > 0;
        video.pause();
      }
    });
    const cancelWait = afterPageLoad(() => observer.observe(video));
    return () => {
      cancelWait();
      observer.disconnect();
    };
  }, [videoRef]);
}
