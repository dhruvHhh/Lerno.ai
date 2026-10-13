import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import type { CSSProperties, RefObject } from "react";

import { cn, formatTime } from "@/lib/utils";

interface PlayerBarProps {
  playing: boolean;
  progress: number;
  time: number;
  duration: number;
  ref?: RefObject<HTMLDivElement | null>;
  className?: string;
}

// The lesson player's control bar as a still picture, for mock-ups of the product. `progress` runs from 0 to 1;
// a caller animating it every frame can set the `--progress` property on `ref` instead of re-rendering.
export default function PlayerBar({ playing, progress, time, duration, ref, className }: PlayerBarProps) {
  const StateIcon = playing ? PauseIcon : PlayIcon;
  return (
    <div
      ref={ref}
      style={{ "--progress": `${progress * 100}%` } as CSSProperties}
      className={cn("flex items-center gap-3 text-xs", className)}
    >
      <StateIcon weight="fill" className="size-3.5 shrink-0" />
      <span className="relative h-1 flex-1 rounded-full bg-white/15">
        <span className="bg-accent absolute inset-y-0 left-0 w-(--progress) rounded-full" />
        <span className="bg-accent absolute top-1/2 left-(--progress) size-2.5 -translate-1/2 rounded-full" />
      </span>
      <span className="text-secondary-foreground tabular-nums">
        {formatTime(time)} / {formatTime(duration)}
      </span>
    </div>
  );
}
