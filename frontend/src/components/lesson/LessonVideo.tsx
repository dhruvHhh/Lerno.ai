import { useRef, type ComponentProps, type RefObject } from "react";

import type { Lesson } from "@/content/demo-lessons";
import useAutoPlay from "@/hooks/useAutoPlay";
import { cn } from "@/lib/utils";

interface LessonVideoProps extends Omit<ComponentProps<"video">, "ref"> {
  lesson: Lesson;
  ref?: RefObject<HTMLVideoElement | null>;
}

export default function LessonVideo({ lesson, ref, className, ...props }: LessonVideoProps) {
  const ownRef = useRef<HTMLVideoElement>(null);
  const videoRef = ref ?? ownRef;
  useAutoPlay(videoRef);

  return (
    <video
      ref={videoRef}
      src={`${lesson.src}#t=${lesson.start}`}
      poster={lesson.poster}
      aria-label={lesson.label}
      width={1280}
      height={720}
      preload="none"
      muted
      loop
      playsInline
      className={cn("aspect-video w-full", className)}
      {...props}
    />
  );
}
