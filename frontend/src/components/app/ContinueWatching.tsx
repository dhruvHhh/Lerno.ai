import { useEffect, useState } from "react";
import { Link } from "react-router";

import Placeholder from "@/components/app/Placeholder";
import StillFrame from "@/components/app/StillFrame";
import { LEVELS, type Lesson, type Scene } from "@/lib/api";
import { fetchLesson, storedLesson } from "@/lib/lessonStore";
import { savedCounts, savedProgress } from "@/lib/saved";
import { SETTLE_MS } from "@/lib/styles";
import { cn } from "@/lib/utils";

const CARDS = 3;
const ROW = "grid gap-2.5 [grid-area:1/1] lg:grid-cols-3 lg:gap-4";
const FRAME =
  "grid grid-cols-[112px_1fr] items-center gap-x-3 rounded-[14px] bg-white/2 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:block lg:pb-3.5";

export default function ContinueWatching({ lessons, failed }: { lessons: Lesson[] | null; failed: boolean }) {
  // Placeholders only on a cold load, for as many cards as the last visit showed.
  const [expected] = useState(() => (lessons ? 0 : Math.min(savedCounts().ready, CARDS)));
  const recent = lessons?.filter((lesson) => lesson.status === "ready").slice(0, CARDS) ?? [];
  if (lessons ? !recent.length : failed || !expected) return null;

  return (
    <section className="relative z-[1] mt-12 w-full max-w-[880px] lg:mt-[72px]">
      <h2 className="text-secondary-foreground text-sm font-medium">Continue watching</h2>
      {/* The cards and their placeholders share one cell, so they cross-fade in place. */}
      <div className="mt-3.5 grid">
        <div className={ROW}>
          {recent.map((lesson, index) => (
            <LessonCard key={lesson.id} lesson={lesson} enter={expected > 0} index={index} />
          ))}
        </div>
        {expected > 0 && (
          <Placeholder loading={!lessons} className={ROW}>
            {Array.from({ length: expected }, (_, index) => (
              <div key={index} className={FRAME}>
                <div className="row-span-2 aspect-video rounded-[9px] bg-white/4 motion-safe:animate-pulse" />
                <div className="flex h-5 items-center self-end lg:mx-1.5 lg:mt-3">
                  <i className="h-2.5 w-3/5 rounded-full bg-white/6 motion-safe:animate-pulse" />
                </div>
                <div className="flex h-4 items-center self-start lg:mx-1.5 lg:mt-0.5">
                  <i className="h-2 w-2/5 rounded-full bg-white/4 motion-safe:animate-pulse" />
                </div>
              </div>
            ))}
          </Placeholder>
        )}
      </div>
    </section>
  );
}

function LessonCard({ lesson, enter, index }: { lesson: Lesson; enter: boolean; index: number }) {
  // The full lesson is kept, so a click opens the player with no wait.
  const [scenes, setScenes] = useState<Scene[]>(() => storedLesson(lesson.id)?.scenes ?? []);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (storedLesson(lesson.id)) return;
    fetchLesson(lesson.id)
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
        FRAME,
        "group ease-snappy transition-[background-color,box-shadow,translate] duration-300",
        "hover:bg-accent/5 hover:shadow-[inset_0_0_0_1px_rgba(155,124,255,0.3)] lg:hover:-translate-y-0.5",
        enter && "motion-safe:animate-enter",
      )}
      style={{ animationDelay: `${SETTLE_MS + index * 70}ms` }}
    >
      <div className="relative row-span-2 aspect-video overflow-hidden rounded-[9px] bg-[#0a0b10]">
        {video && (
          <StillFrame
            src={video}
            onDuration={setDuration}
            className="opacity-85 transition-opacity duration-300 group-hover:opacity-100"
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
