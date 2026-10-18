import { useState } from "react";

import { cn } from "@/lib/utils";

const STILL_AT = 0.6;

interface StillFrameProps {
  src: string;
  onDuration?: (seconds: number) => void;
  className?: string;
}

// A still from the video itself, 60% in, where the drawing is mostly done; the server makes no thumbnails.
export default function StillFrame({ src, onDuration, className }: StillFrameProps) {
  // Hidden until the seek lands, so the frame fades in instead of flashing the first frame.
  const [shown, setShown] = useState(false);

  return (
    <video
      src={src}
      preload="metadata"
      muted
      playsInline
      aria-hidden="true"
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        onDuration?.(video.duration);
        video.currentTime = video.duration * STILL_AT;
      }}
      onSeeked={() => setShown(true)}
      style={shown ? undefined : { opacity: 0 }}
      className={cn("block size-full object-cover transition-opacity duration-500", className)}
    />
  );
}
