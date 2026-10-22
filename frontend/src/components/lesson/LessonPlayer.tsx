import { CornersInIcon, CornersOutIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import LessonVideo from "@/components/lesson/LessonVideo";
import VideoControls, { BarButton, CloseButton, POPUP_WIDTH } from "@/components/lesson/VideoControls";
import type { Lesson } from "@/content/demo-lessons";
import useVideoControls from "@/hooks/useVideoControls";
import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/variants";

const ZOOM = { duration: 0.6, ease: EASE_EXPO };

interface LessonPlayerProps {
  lesson: Lesson;
  onSecond?: (second: number) => void;
}

export default function LessonPlayer({ lesson, onSecond }: LessonPlayerProps) {
  const { videoRef, videoProps, controls } = useVideoControls(onSecond);
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
            ? `fixed top-1/2 left-1/2 z-70 mt-[calc(var(--popup-w)*-9/32)] ml-[calc(var(--popup-w)/-2)] border border-white/10 ${POPUP_WIDTH}`
            : "absolute inset-0",
        )}
      >
        <LessonVideo
          ref={videoRef}
          lesson={lesson}
          preload="metadata"
          onClick={expanded ? controls.toggle : () => setExpanded(true)}
          {...videoProps}
          className="cursor-pointer"
        />
        {expanded && <CloseButton onClick={() => setExpanded(false)} className={cn(zooming && "opacity-0")} />}
        <VideoControls controls={controls} className={cn("transition-opacity duration-200", zooming && "opacity-0")}>
          <BarButton label={expanded ? "Shrink" : "Expand"} onClick={() => setExpanded((isExpanded) => !isExpanded)}>
            {expanded ? <CornersInIcon className="size-4" /> : <CornersOutIcon className="size-4" />}
          </BarButton>
        </VideoControls>
      </m.div>
    </div>
  );
}
