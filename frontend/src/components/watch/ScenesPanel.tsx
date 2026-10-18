import { Check, SidebarSimple, WarningCircle } from "@phosphor-icons/react";

import { ICON_BUTTON } from "@/components/app/Sidebar";
import StillFrame from "@/components/app/StillFrame";
import useMediaQuery, { DESKTOP } from "@/hooks/useMediaQuery";
import useVideoTime from "@/hooks/useVideoTime";
import type { Scene } from "@/lib/api";
import { cn, formatTime } from "@/lib/utils";

interface ScenesPanelProps {
  scenes: Scene[];
  current: number;
  watched: number[];
  progress: Record<number, number>;
  durations: Record<number, number>;
  onDuration: (position: number, seconds: number) => void;
  onSelect: (position: number) => void;
  rail: boolean;
  onToggleRail: () => void;
  video: HTMLVideoElement | null;
}

function DoneTick({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("absolute grid size-4 place-items-center rounded-full bg-[#78dcaa] text-[#0b2a1c]", className)}
    >
      <Check size={10} weight="bold" />
    </span>
  );
}

// The scenes of this lesson. Collapsed, it is a filmstrip of tiny frames, like the slide strip in Keynote.
export default function ScenesPanel(props: ScenesPanelProps) {
  const { scenes, durations, rail, onToggleRail } = props;
  // On a phone the scenes are always a list under the video.
  const desktop = useMediaQuery(DESKTOP);
  const strip = rail && desktop;
  const total = scenes.reduce((sum, scene) => sum + (durations[scene.position] ?? 0), 0);

  return (
    <aside
      aria-label="Scenes in this lesson"
      className={cn(
        "bg-surface mx-0 mt-2 mb-[110px] flex flex-col overflow-hidden rounded-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:m-2.5 lg:ml-0",
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

// How far into a scene the user got. The scene playing follows its video; the others show what was kept.
function Watched({ kept, video, className }: { kept: number; video: HTMLVideoElement | null; className: string }) {
  const live = useVideoTime(video, (v) => (v.duration ? Math.round((v.currentTime / v.duration) * 100) / 100 : 0), 0);
  return <i className={className} style={{ width: `${Math.max(kept, live) * 100}%` }} />;
}

function SceneList({ scenes, current, watched, progress, durations, onDuration, onSelect, video }: ScenesPanelProps) {
  return (
    <ul data-lenis-prevent className="grid gap-1.5 overflow-y-auto px-2.5 py-1 pb-2.5">
      {scenes.map((scene) => {
        const on = scene.position === current;
        const done = watched.includes(scene.position);
        const length = durations[scene.position];
        return (
          <li key={scene.position}>
            <button
              type="button"
              onClick={() => onSelect(scene.position)}
              className={cn(
                "group grid w-full grid-cols-[104px_1fr] items-center gap-3 rounded-xl p-2 text-left transition-[background-color,box-shadow] duration-250",
                on
                  ? "from-accent/12 to-accent/4 bg-linear-to-b shadow-[inset_0_0_0_1px_rgba(155,124,255,0.35)]"
                  : "hover:bg-white/4",
              )}
            >
              <div
                className={cn(
                  "relative aspect-video overflow-hidden rounded-lg bg-[#0a0b10]",
                  !scene.video_url && "text-danger grid place-items-center",
                )}
              >
                {scene.video_url ? (
                  <>
                    <StillFrame
                      src={scene.video_url}
                      onDuration={(d) => onDuration(scene.position, d)}
                      className={on ? "" : "opacity-75"}
                    />
                    {done && !on && <DoneTick className="top-1 right-1 shadow-[0_0_0_2px_rgba(0,0,0,0.6)]" />}
                    {length > 0 && (
                      <span className="text-foreground absolute right-1 bottom-1 rounded-[5px] bg-black/75 px-[5px] py-px text-[10px] tabular-nums">
                        {formatTime(length)}
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
                      <Watched
                        kept={progress[scene.position] ?? 0}
                        video={on ? video : null}
                        className="bg-accent-soft block h-full"
                      />
                    </span>
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

function Filmstrip({ scenes, current, watched, progress, durations, onDuration, onSelect, video }: ScenesPanelProps) {
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
              : formatTime(durations[scene.position] ?? 0);
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
                  <StillFrame
                    src={scene.video_url}
                    onDuration={(d) => onDuration(scene.position, d)}
                    className={cn(
                      "rounded-md transition-opacity duration-250 group-hover:opacity-100",
                      on ? "" : "opacity-60",
                    )}
                  />
                  <span className="absolute inset-x-[3px] -bottom-[5px] h-0.5 rounded-sm bg-white/10">
                    <Watched
                      kept={progress[scene.position] ?? 0}
                      video={on ? video : null}
                      className="bg-accent-soft block h-full rounded-sm"
                    />
                  </span>
                  {done && <DoneTick className="-top-[5px] -right-[5px] shadow-[0_0_0_2px_var(--color-surface)]" />}
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
