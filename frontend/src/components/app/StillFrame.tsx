import { useEffect, useState } from "react";

import { useStill } from "@/lib/stills";
import { cn } from "@/lib/utils";

interface StillFrameProps {
  src: string;
  onDuration?: (seconds: number) => void;
  className?: string;
}

// A still from the video itself, shared as one image by every place that shows this scene.
export default function StillFrame({ src, onDuration, className }: StillFrameProps) {
  const still = useStill(src);
  // An image already made shows at once; a new one fades in.
  const [warm] = useState(still !== null);

  useEffect(() => {
    if (still) onDuration?.(still.duration);
  }, [still, onDuration]);

  if (!still) return null;
  return (
    <img
      src={still.url}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={cn("block size-full object-cover", !warm && "motion-safe:animate-fade-in", className)}
    />
  );
}
