import { useEffect, type RefObject } from "react";

import { afterPageLoad, prefersReducedMotion } from "@/lib/utils";

// Waits for the page load so the video never competes with the hero's font and scripts.
export default function useAutoPlay(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    const cancelWait = afterPageLoad(() => observer.observe(video));
    return () => {
      cancelWait();
      observer.disconnect();
    };
  }, [videoRef]);
}
