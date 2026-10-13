import { useEffect, type RefObject } from "react";

import { afterPageLoad, prefersReducedMotion } from "@/lib/utils";

// Wait for page load, so videos don't slow the first paint.
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
