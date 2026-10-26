import { Check, SidebarSimple, WarningCircle } from "@phosphor-icons/react";

import { ICON_BUTTON } from "@/components/app/Sidebar";
import Thumbnail from "@/components/app/Thumbnail";
import useMediaQuery, { DESKTOP } from "@/hooks/useMediaQuery";
import useVideoTime from "@/hooks/useVideoTime";
import type { Scene } from "@/lib/api";
import { cn, formatTime } from "@/lib/utils";

interface ScenesPanelProps {
  scenes: Scene[];
  current: number;
  watched: number[];
  progress: Record<number, number>;
  onSelect: (position: number) => void;
  rail: boolean;
  onToggleRail: () => void;
  video: HTMLVideoElement | null;
}

interface RingProps {
  kept: number;
  done: boolean;
  // The scene playing follows its video; the others show the furthest point kept.
  video: HTMLVideoElement | null;
  className: string;
}

// How far into a scene the user got, as a ring. When the scene ends the ring closes, fills green, and a tick draws in.
function SceneRing({ kept, done, video, className }: RingProps) {
  const live = useVideoTime(video, (v) => (v.duration ? Math.round((v.currentTime / v.duration) * 100) / 100 : 0), 0);
  const fraction = done ? 1 : Math.max(kept, live);
  return (
    <span aria-hidden="true" className={cn("absolute", className)}>
      <svg viewBox="0 0 20 20" className="size-full -rotate-90">
        <circle
          cx="10"
          cy="10"
          r="10"
          className={cn(
            "transition-[fill] duration-200 motion-reduce:transition-none",
            done ? "fill-[#78dcaa] delay-300" : "fill-[rgba(8,8,14,0.78)]",
          )}
        />
        <circle cx="10" cy="10" r="6.5" fill="none" strokeWidth="2.2" className="stroke-white/15" />
        <circle
          cx="10"
          cy="10"
          r="6.5"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - fraction}
          className={cn(
            "stroke-accent-soft transition-[stroke-dashoffset,opacity] duration-300 ease-linear motion-reduce:transition-none",
            done && "opacity-0 delay-300",
          )}
        />
      </svg>
      <svg viewBox="0 0 20 20" className="absolute inset-0 size-full">
        <path
          d="M6.2 10.4 8.8 13 13.8 7.4"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={done ? 0 : 1}
          className={cn(
            "stroke-[#0b2a1c] transition-[stroke-dashoffset] duration-[400ms] ease-out motion-reduce:transition-none",
            done && "delay-[450ms]",
          )}
        />
      </svg>
    </span>
  );
}

// The scenes of this lesson. Collapsed, it is a filmstrip of tiny frames, like the slide strip in Keynote.
export default function ScenesPanel(props: ScenesPanelProps) {
  const { scenes, rail, onToggleRail } = props;
  // On a phone the scenes are always a list under the video.
  const desktop = useMediaQuery(DESKTOP);
  const strip = rail && desktop;
  const total = scenes.reduce((sum, scene) => sum + (scene.duration_seconds ?? 0), 0);

  return (
    <aside
      aria-label="Scenes in this lesson"
      className={cn(
        "bg-surface rounded-panel mx-0 mt-2 mb-[110px] flex flex-col overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:m-2.5 lg:ml-0",
        "ease-snappy transition-[width] duration-[450ms]",
        strip ? "lg:w-[60px] lg:overflow-visible" : "lg:w-[300px]",
      )}
    >
      <div
        className={cn(
          "flex h-[60px] flex-none items-center gap-2.5 pr-3 pl-4 whitespace-nowrap",
          strip && "justify-center p-0",
        )}
      >
        {!strip && (
          <>
            <b className="text-[15px] font-semibold">Scenes</b>
            <span className="text-muted-foreground text-xs tabular-nums">
              {scenes.length} scenes{total > 0 && `, ${formatTime(total)}`}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={onToggleRail}
          aria-label={strip ? "Show scenes" : "Collapse scenes"}
          className={cn(ICON_BUTTON, "hidden lg:grid", !strip && "ml-auto")}
        >
          <SidebarSimple size={18} mirrored />
        </button>
      </div>
      {strip ? <Filmstrip {...props} /> : <SceneList {...props} />}
    </aside>
  );
}

function SceneList({ scenes, current, watched, progress, onSelect, video }: ScenesPanelProps) {
  return (
    // Scrolls on its own only on desktop. On phones it must not be a scroller: Lenis's overscroll containment would
    // keep a swipe here from scrolling the page.
    <ul data-lenis-prevent className="grid gap-1.5 px-2 py-1 pb-2 lg:overflow-y-auto">
      {scenes.map((scene) => {
        const on = scene.position === current;
        const done = watched.includes(scene.position);
        const length = scene.duration_seconds ?? 0;
        return (
          <li key={scene.position}>
            <button
              type="button"
              onClick={() => onSelect(scene.position)}
              className={cn(
                "group rounded-row grid w-full grid-cols-[104px_1fr] items-center gap-3 p-2 text-left transition-[background-color,box-shadow] duration-250",
                on
                  ? "from-accent/12 to-accent/4 bg-linear-to-b shadow-[inset_0_0_0_1px_rgba(155,124,255,0.35)]"
                  : "hover:bg-white/4",
              )}
            >
              <div
                className={cn(
                  "rounded-tight relative aspect-video overflow-hidden bg-[#0a0b10]",
                  !scene.video_url && "text-danger grid place-items-center",
                )}
              >
                {scene.video_url ? (
                  <>
                    {scene.thumbnail_url && (
                      <Thumbnail src={scene.thumbnail_url} className={on ? "" : "opacity-75"} />
                    )}
                    {(on || done || (progress[scene.position] ?? 0) > 0) && (
                      <SceneRing
                        kept={progress[scene.position] ?? 0}
                        done={done}
                        video={on ? video : null}
                        className="top-1 right-1 size-[18px]"
                      />
                    )}
                    {length > 0 && (
                      <span className="text-foreground rounded-tight absolute right-1 bottom-1 bg-black/75 px-[5px] py-px text-[10px] tabular-nums">
                        {formatTime(length)}
                      </span>
                    )}
                  </>
                ) : (
                  <WarningCircle size={20} />
                )}
              </div>
              <div>
                <p className={cn("text-sm leading-snug", on ? "text-foreground" : "text-secondary-foreground")}>
                  {scene.position}. {scene.title}
                </p>
                <small
                  className={cn(
                    "mt-[3px] flex items-center gap-[5px] text-xs",
                    !scene.video_url
                      ? "text-danger"
                      : on
                        ? "text-accent-soft"
                        : done
                          ? "text-[#8fe0ba]"
                          : "text-muted-foreground",
                  )}
                >
                  {!scene.video_url ? (
                    "Couldn't animate this scene"
                  ) : on ? (
                    "Now playing"
                  ) : done ? (
                    <>
                      <Check size={13} weight="bold" />
                      Watched
                    </>
                  ) : (
                    length > 0 && formatTime(length)
                  )}
                </small>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Filmstrip({ scenes, current, watched, progress, onSelect, video }: ScenesPanelProps) {
  return (
    <ul className="flex flex-col items-center gap-3.5 py-1.5">
      {scenes.map((scene) => {
        const on = scene.position === current;
        const done = watched.includes(scene.position);
        const state = !scene.video_url
          ? "couldn't animate"
          : on
            ? "playing"
            : done
              ? "watched"
              : formatTime(scene.duration_seconds ?? 0);
        const label = `${scene.position}. ${scene.title}, ${state}`;
        return (
          <li key={scene.position}>
            <button
              type="button"
              onClick={() => onSelect(scene.position)}
              aria-label={label}
              className={cn(
                "group relative block aspect-video w-10 rounded-md bg-[#0a0b10] transition-shadow duration-250",
                !scene.video_url
                  ? "text-danger grid place-items-center shadow-[0_0_0_1px_rgba(255,127,122,0.4)]"
                  : on
                    ? "shadow-[0_0_0_2px_#b7a4ff,0_0_14px_rgba(155,124,255,0.35)]"
                    : "shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
              )}
            >
              {scene.video_url ? (
                <>
                  {scene.thumbnail_url && (
                    <Thumbnail
                      src={scene.thumbnail_url}
                      className={cn(
                        "rounded-md transition-opacity duration-250 group-hover:opacity-100",
                        on ? "" : "opacity-60",
                      )}
                    />
                  )}
                  {(on || done || (progress[scene.position] ?? 0) > 0) && (
                    <SceneRing
                      kept={progress[scene.position] ?? 0}
                      done={done}
                      video={on ? video : null}
                      className="-top-[6px] -right-[6px] size-4 rounded-full shadow-[0_0_0_2px_var(--color-surface)]"
                    />
                  )}
                </>
              ) : (
                <WarningCircle size={14} />
              )}
              <span className="text-foreground pointer-events-none absolute top-1/2 right-[52px] -translate-y-1/2 rounded-[7px] bg-[#1a1b26] px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
