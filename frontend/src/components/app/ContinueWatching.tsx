import { useEffect, useState } from "react";
import { Link } from "react-router";

import { api, LEVELS, type Lesson, type Scene } from "@/lib/api";
import { savedProgress } from "@/lib/saved";
import { cn } from "@/lib/utils";

const CARDS = 3;
const STILL_AT = 0.6;

export default function ContinueWatching({ lessons }: { lessons: Lesson[] }) {
  const recent = lessons.filter((lesson) => lesson.status === "ready").slice(0, CARDS);
  if (!recent.length) return null;

  return (
    <section className="relative z-[1] mt-12 w-full max-w-[880px] lg:mt-[72px]">
      <h2 className="text-secondary-foreground text-sm font-medium">Continue watching</h2>
      <div className="mt-3.5 grid gap-2.5 lg:grid-cols-3 lg:gap-4">
        {recent.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    api<{ scenes: Scene[] }>(`/lessons/${lesson.id}`)
      .then((full) => setScenes(full.scenes))
      .catch(() => setScenes([]));
  }, [lesson.id]);

  const progress = savedProgress(lesson.id);
  const current = progress?.scene ?? 1;
  const video =
    scenes.find((scene) => scene.position === current)?.video_url ?? scenes.find((scene) => scene.video_url)?.video_url;
  const watched =
    progress && scenes.length ? (current - 1 + (duration && Math.min(progress.time / duration, 1))) / scenes.length : 0;

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className={cn(
        "group grid grid-cols-[112px_1fr] items-center gap-x-3 rounded-[14px] bg-white/2 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        "ease-snappy transition-[background-color,box-shadow,translate] duration-300",
        "hover:bg-accent/5 hover:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.3)]",
        "lg:block lg:pb-3.5 lg:hover:-translate-y-0.5",
      )}
    >
      <div className="relative row-span-2 aspect-video overflow-hidden rounded-[9px] bg-[#0a0b10]">
        {/* The still frame comes from the video itself, 60% in, where the drawing is mostly done. */}
        {video && (
          <video
            src={video}
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={(event) => {
              setDuration(event.currentTarget.duration);
              event.currentTarget.currentTime = event.currentTarget.duration * STILL_AT;
            }}
            className="block size-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        <span className="ease-snappy absolute inset-0 m-auto grid size-10 scale-90 place-items-center rounded-full bg-[#f5f5f7]/92 opacity-0 transition-[opacity,scale] duration-[400ms] group-hover:scale-100 group-hover:opacity-100">
          <span className="border-l-background ml-[3px] border-y-[7px] border-l-[11px] border-y-transparent" />
        </span>
        {progress && (
          <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
            <i className="bg-accent-soft block h-full" style={{ width: `${watched * 100}%` }} />
          </span>
        )}
      </div>
      <b className="self-end truncate text-sm font-medium lg:mx-1.5 lg:mt-3 lg:block">{lesson.title ?? lesson.topic}</b>
      <small className="text-muted-foreground self-start text-xs lg:mx-1.5 lg:mt-0.5 lg:block">
        {LEVELS[lesson.audience]}
        {scenes.length > 0 && ` · Scene ${current} of ${scenes.length}`}
      </small>
    </Link>
  );
}
