import { cn } from "@/lib/utils";

const STILL_AT = 0.6;

interface StillFrameProps {
  src: string;
  onDuration?: (seconds: number) => void;
  className?: string;
}

// A still from the video itself, 60% in, where the drawing is mostly done; the server makes no thumbnails.
export default function StillFrame({ src, onDuration, className }: StillFrameProps) {
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
      className={cn("block size-full object-cover", className)}
    />
  );
}
