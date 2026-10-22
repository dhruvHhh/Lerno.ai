import { PauseIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import type { ReactNode, RefObject } from "react";

import type useVideoControls from "@/hooks/useVideoControls";
import { cn, formatTime } from "@/lib/utils";

// The popup player's size: as wide as fits, kept 16:9 and clear of the screen's top and bottom.
export const POPUP_WIDTH =
  "w-(--popup-w) [--popup-w:min(92vw,calc((100svh_-_6rem)*16/9))] sm:[--popup-w:min(80vw,1100px,calc((100svh_-_6rem)*16/9))]";

interface VideoControlsProps {
  controls: ReturnType<typeof useVideoControls>["controls"];
  // Goes at the end of the bar, after the time.
  children?: ReactNode;
  className?: string;
}

export default function VideoControls({
  controls: { playing, seconds, duration, seekBarRef, toggle, seek },
  children,
  className,
}: VideoControlsProps) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black to-transparent px-4 pt-10 pb-3 text-xs",
        className,
      )}
    >
      <BarButton label={playing ? "Pause" : "Play"} onClick={toggle}>
        {playing ? <PauseIcon weight="fill" className="size-4" /> : <PlayIcon weight="fill" className="size-4" />}
      </BarButton>
      <button ref={seekBarRef} type="button" onClick={seek} aria-label="Seek" className="relative h-6 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/18" />
        <span className="bg-foreground absolute top-1/2 left-0 h-1 w-(--progress,0%) -translate-y-1/2 rounded-full" />
        <span className="bg-foreground absolute top-1/2 left-(--progress,0%) size-3 -translate-1/2 rounded-full shadow-[0_0_0_4px_rgba(155,124,255,0.25)]" />
      </button>
      <span className="text-secondary-foreground tabular-nums">
        {formatTime(seconds)} / {formatTime(duration)}
      </span>
      {children}
    </div>
  );
}

interface BarButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

// An icon button in the bar, with a hit area bigger than its icon.
export function BarButton({ label, onClick, children }: BarButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="-m-2 p-2">
      {children}
    </button>
  );
}

interface CloseButtonProps {
  onClick: () => void;
  ref?: RefObject<HTMLButtonElement | null>;
  className?: string;
}

export function CloseButton({ onClick, ref, className }: CloseButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={cn(
        "absolute top-3 right-3 grid size-9 place-items-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
        className,
      )}
    >
      <XIcon className="size-4" />
    </button>
  );
}
