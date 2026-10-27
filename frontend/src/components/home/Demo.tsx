import { CaretDownIcon } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import LessonVideo from "@/components/lesson/LessonVideo";
import { DEMO_LESSONS, type Lesson } from "@/content/demo-lessons";
import { KEY } from "@/lib/styles";
import { afterPageLoad, cn } from "@/lib/utils";
import { EASE } from "@/lib/variants";

const SLIDE = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const;

const FADE = { duration: 0.7, ease: EASE };

const HIDDEN = { opacity: 0, scale: 1.02, filter: "blur(8px)" };

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const HINT_MS = 2500;

const INSTANT = { duration: 0 };

export default function Demo() {
  const [lesson, setLesson] = useState(DEMO_LESSONS[0]);
  const [outgoing, setOutgoing] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [scene, setScene] = useState(0);
  const [hinting, setHinting] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.6) return;
        observer.disconnect();
        setHinting(true);
        timer = window.setTimeout(() => setHinting(false), HINT_MS);
      },
      { threshold: 0.6 },
    );
    const cancelWait = afterPageLoad(() => observer.observe(dock));
    return () => {
      cancelWait();
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Keep the old clip until the new one plays, so there's no blank frame.
  const choose = (next: Lesson) => {
    if (next.id === lesson.id) return;
    setLesson(next);
    setScene(0);
    setHinting(false);
    if (reduceMotion) return setOutgoing(null);
    if (!loading) setOutgoing(lesson);
    setLoading(next.id !== outgoing?.id);
  };

  const followScene = (time: number) => setScene(lesson.scenes.findLastIndex(({ at }) => at <= time));

  return (
    <section id="demo" className="relative mx-auto -mt-20 max-w-5xl px-4 md:-mt-28 2xl:max-w-6xl">
      <p className="text-center text-lg font-medium sm:text-xl">
        See a real lesson. <span className="text-muted-foreground">Made by Lerno in about a minute.</span>
      </p>

      <div className="relative isolate mt-8">
        {/* A gradient, not a blur filter: iOS Safari drew the 100px blur so slowly the hero above stayed black. */}
        <div
          aria-hidden="true"
          className="absolute -inset-x-[127px] -inset-y-[143px] -z-10 bg-[radial-gradient(closest-side,rgba(155,124,255,0.25),rgba(155,124,255,0.2)_25%,rgba(155,124,255,0.11)_50%,rgba(155,124,255,0.04)_75%,transparent)]"
        />
        <div className="rounded-[28px] border border-white/10 bg-white/3 p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-xs">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="hidden shrink-0 gap-1.5 sm:flex">
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                  <span className="size-2.5 rounded-full bg-white/15" />
                </span>
                {/* On phones the title is the lesson picker: the phone's own list opens over it. */}
                <label className="text-muted-foreground relative flex min-w-0 items-center gap-1.5">
                  <span className="truncate">
                    Lerno · <span className="text-foreground">{lesson.title}</span>
                  </span>
                  <CaretDownIcon weight="bold" className="text-foreground size-3 flex-none sm:hidden" />
                  <select
                    aria-label="Example lesson"
                    value={lesson.id}
                    onChange={(event) => choose(DEMO_LESSONS.find(({ id }) => id === event.target.value)!)}
                    className="absolute inset-0 cursor-pointer opacity-0 sm:hidden"
                  >
                    {DEMO_LESSONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                Scene {scene + 1} of {lesson.scenes.length}
              </span>
            </div>

            <div className="relative">
              <div className="relative aspect-video">
                {DEMO_LESSONS.filter(({ id }) => id === lesson.id || id === outgoing?.id).map((item) => {
                  const incoming = item.id === lesson.id;
                  return (
                    <m.div
                      key={item.id}
                      initial={false}
                      animate={incoming && loading ? HIDDEN : SHOWN}
                      transition={reduceMotion ? INSTANT : FADE}
                      onAnimationComplete={() => incoming && !loading && setOutgoing(null)}
                      className={cn("absolute inset-0", incoming && "z-10")}
                    >
                      <LessonVideo
                        lesson={item}
                        onPlaying={incoming ? () => setLoading(false) : undefined}
                        onTimeUpdate={incoming ? (event) => followScene(event.currentTarget.currentTime) : undefined}
                      />
                    </m.div>
                  );
                })}
              </div>

              <div
                ref={dockRef}
                role="group"
                aria-label="Example lessons"
                className="group/dock border-foreground/10 bg-foreground/5 absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 flex-col gap-2 rounded-[20px] border p-2 backdrop-blur-lg sm:flex"
              >
                {DEMO_LESSONS.map((option) => {
                  const selected = option.id === lesson.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.topic}
                      aria-pressed={selected}
                      onClick={() => choose(option)}
                      className={cn(
                        "group/tab relative grid size-11 place-items-center rounded-[10px] transition-colors duration-300",
                        KEY,
                        selected ? "text-white" : "text-secondary-foreground hover:text-foreground",
                      )}
                    >
                      {selected && (
                        <m.span
                          layoutId="active-lesson"
                          transition={reduceMotion ? INSTANT : SLIDE}
                          style={{ borderRadius: 10 }}
                          className="border-accent/40 absolute -inset-px border bg-[radial-gradient(120%_90%_at_50%_0%,#7a6aa8_0%,#463c6b_45%,#2a2440_100%)] shadow-[0_8px_20px_rgba(0,0,0,0.6),0_0_18px_rgba(155,124,255,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]"
                        />
                      )}
                      <option.icon className="relative size-[18px]" />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 rounded-lg border border-white/10 bg-[#101219] px-2.5 py-1 text-[13px] font-medium whitespace-nowrap text-white opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-opacity duration-300 group-hover/tab:opacity-100!",
                          (selected || hinting) && "opacity-100 group-hover/dock:opacity-0",
                        )}
                      >
                        {option.topic}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4 sm:px-8">
              <m.p
                key={`${lesson.id}-${scene}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? INSTANT : { duration: 0.5, ease: FADE.ease }}
                className="text-secondary-foreground mx-auto min-h-[5lh] max-w-2xl text-center text-sm leading-relaxed sm:min-h-[3lh] sm:text-[15px]"
              >
                {lesson.scenes[scene].narration}
              </m.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
