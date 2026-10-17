import { CornersOut, NotePencil, Pause, Play } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ICON_BUTTON } from "@/components/app/Sidebar";
import StillFrame from "@/components/app/StillFrame";
import Dock, { type CardName } from "@/components/watch/Dock";
import Notepad from "@/components/watch/Notepad";
import NotesCard from "@/components/watch/NotesCard";
import { CompleteOverlay, QuizOverlay } from "@/components/watch/Overlays";
import QuizCard from "@/components/watch/QuizCard";
import ScenesPanel from "@/components/watch/ScenesPanel";
import Scrub from "@/components/watch/Scrub";
import { SOLID, scoreOf } from "@/components/watch/shared";
import TutorCard from "@/components/watch/TutorCard";
import useNotes, { type Note } from "@/hooks/useNotes";
import useTutor from "@/hooks/useTutor";
import { LEVELS, type LessonWithScenes } from "@/lib/api";
import { saveProgress, saveScenesRail, savedProgress, savedScenesRail } from "@/lib/saved";
import { cn, formatTime } from "@/lib/utils";

const NOTES_LIMIT = 100;
const SKIP_SECONDS = 5;
// The server keeps note and tutor times under 10 minutes; scenes are far shorter.
const TIME_MAX = 600;

const subscribeOnline = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

interface LessonPageProps {
  lesson: LessonWithScenes;
  refresh: () => Promise<void>;
}

export default function LessonPage({ lesson, refresh }: LessonPageProps) {
  const scenes = lesson.scenes;
  const [start] = useState(() => savedProgress(lesson.id));
  const [scene, setScene] = useState(() =>
    start && scenes.some((s) => s.position === start.scene) ? start.scene : scenes[0].position,
  );
  const [watched, setWatched] = useState<number[]>(start?.watched ?? []);
  const [answers, setAnswers] = useState<Record<number, number>>(start?.answers ?? {});
  const [progress, setProgress] = useState<Record<number, number>>(() =>
    Object.fromEntries((start?.watched ?? []).map((position) => [position, 1])),
  );
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [time, setTime] = useState(start?.time ?? 0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<"quiz" | "complete" | null>(null);
  const [card, setCard] = useState<CardName | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [notepadAt, setNotepadAt] = useState<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [railRight, setRailRight] = useState(savedScenesRail);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);

  const notes = useNotes(lesson.id);
  const tutor = useTutor(lesson.id);
  const video = useRef<HTMLVideoElement>(null);
  const film = useRef<HTMLDivElement>(null);
  // What to do once the next video's details load: where to start, and whether to play.
  const pending = useRef({ at: start?.time ?? 0, play: false });
  const retried = useRef(false);
  const timeNow = useRef(start?.time ?? 0);

  const current = scenes.find((s) => s.position === scene)!;
  const index = scenes.indexOf(current);
  const sceneNotes = notes.notes.filter((note) => note.scene_position === scene);

  // Progress is saved whenever the scene, the ticks or the answers change, and on pause and on leaving.
  const save = useCallback(
    () => saveProgress(lesson.id, { scene, time: timeNow.current, watched, answers }),
    [lesson.id, scene, watched, answers],
  );
  useEffect(() => {
    save();
    return save;
  }, [save]);

  const go = useCallback(
    (position: number, at = 0, play = true) => {
      pending.current = { at, play };
      retried.current = false;
      timeNow.current = at;
      setTime(at);
      setVideoFailed(false);
      setOverlay(null);
      setNotepadAt(null);
      const v = video.current;
      if (position === scene && v && v.readyState > 0) {
        v.currentTime = at;
        if (play) v.play().catch(() => {});
      } else setScene(position);
    },
    [scene],
  );

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v || overlay) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [overlay]);

  const finishScene = () => {
    video.current?.pause();
    setWatched((list) => (list.includes(scene) ? list : [...list, scene]));
    setProgress((p) => ({ ...p, [scene]: 1 }));
    setOverlay("quiz");
  };

  const next = () => (scenes[index + 1] ? go(scenes[index + 1].position) : setOverlay("complete"));

  const openCard = useCallback((name: CardName) => {
    video.current?.pause();
    setNotepadAt(null);
    setDockOpen(true);
    setCard(name);
  }, []);
  const closeAll = useCallback(() => {
    setCard(null);
    setDockOpen(false);
    setNotepadAt(null);
  }, []);

  const openNotepad = () => {
    video.current?.pause();
    setCard(null);
    setNotepadAt(timeNow.current);
  };

  // A link that expired (they last an hour) is fetched once more, keeping the scene and the time.
  const reload = async () => {
    pending.current = { at: timeNow.current, play: !!video.current && !video.current.paused };
    try {
      await refresh();
    } catch {
      setVideoFailed(true);
    }
  };
  const onVideoError = () => {
    if (retried.current) return setVideoFailed(true);
    retried.current = true;
    void reload();
  };

  // A click outside the open card closes it.
  useEffect(() => {
    if (!card) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-card], [data-dock]")) setCard(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [card]);

  // Keys: Space plays, the arrows skip 5 seconds, Esc closes what is open. Nothing fires while the user types.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea")) {
        if (event.key === "Escape") {
          setNotepadAt(null);
          target.blur();
        }
        return;
      }
      const v = video.current;
      if (event.key === " " && !target.closest("button, a")) {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowRight" && v) v.currentTime = Math.min(v.duration, v.currentTime + SKIP_SECONDS);
      else if (event.key === "ArrowLeft" && v) v.currentTime = Math.max(0, v.currentTime - SKIP_SECONDS);
      else if (event.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, closeAll]);

  const seek = (fraction: number) => {
    const v = video.current;
    if (!v || !v.duration) return;
    // Dragging the bar to the end counts as finishing the scene.
    if (fraction >= 0.99) return finishScene();
    v.currentTime = fraction * v.duration;
  };

  const toggleRail = () => {
    saveScenesRail(!railRight);
    setRailRight(!railRight);
  };
  const right = railRight ? "lg:right-[94px]" : "lg:right-[334px]";
  const hasVideo = !!current.video_url && !videoFailed;
  const notesFull = notes.notes.length >= NOTES_LIMIT;
  const sentences = current.narration.match(/[^.?!]+[.?!]*/g) ?? [current.narration];
  const lit = Math.min(sentences.length - 1, Math.floor((duration ? time / duration : 0) * sentences.length));
  const stamp = Math.min(time, TIME_MAX);

  return (
    // The page fills the shell's main area edge to edge on desktop, with its own scroll and the scenes on the right.
    <div className="w-full lg:-mx-6 lg:-mb-12 lg:grid lg:h-svh lg:w-[calc(100%+3rem)] lg:grid-cols-[minmax(0,1fr)_auto]">
      <div
        data-lenis-prevent
        className="relative min-w-0 pb-2 lg:[scrollbar-width:thin] lg:overflow-y-auto lg:px-8 lg:pt-[22px] lg:pb-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(550px_350px_at_50%_40%,rgba(122,96,230,0.16),transparent)]" />
        {!online && <p className="text-muted-foreground relative mb-2 text-center text-xs">You're offline.</p>}
        <div className="relative mx-auto max-w-[min(1040px,max(440px,calc((100vh-330px)*16/9)))]">
          <small className="text-muted-foreground text-[13px]">{LEVELS[lesson.audience]}</small>
          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] lg:text-2xl">
            {lesson.title ?? lesson.topic}
          </h1>

          <div
            ref={film}
            className="relative mt-2.5 aspect-video overflow-hidden rounded-xl bg-black shadow-[0_40px_120px_-40px_rgba(120,90,230,0.6),0_0_0_1px_rgba(255,255,255,0.07)] lg:mt-4 lg:rounded-2xl"
          >
            {current.video_url && !videoFailed && (
              <video
                key={scene}
                ref={video}
                src={current.video_url}
                playsInline
                preload="metadata"
                onClick={toggle}
                onLoadedMetadata={(event) => {
                  const v = event.currentTarget;
                  const { at, play } = pending.current;
                  setDuration(v.duration);
                  if (at > 0 && at < v.duration) v.currentTime = at;
                  if (play) v.play().catch(() => {});
                }}
                onTimeUpdate={(event) => {
                  const v = event.currentTarget;
                  const fraction = v.duration ? v.currentTime / v.duration : 0;
                  timeNow.current = v.currentTime;
                  setTime(v.currentTime);
                  setProgress((p) => (fraction > (p[scene] ?? 0) + 0.01 ? { ...p, [scene]: fraction } : p));
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => {
                  setPlaying(false);
                  save();
                }}
                onEnded={finishScene}
                onError={onVideoError}
                className="absolute inset-0 block size-full object-cover"
              />
            )}

            {!current.video_url && (
              // A scene that could not be animated: its narration stands in for the video, and the quiz still works.
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_60%_at_50%_50%,#12111f,#07080c)] p-6 text-center sm:p-10">
                <div>
                  <small className="text-danger text-[13px]">Couldn't animate this scene</small>
                  <p className="text-secondary-foreground mt-2.5 max-w-[560px] text-sm leading-relaxed sm:text-lg">
                    {current.narration}
                  </p>
                  <button type="button" onClick={() => setOverlay("quiz")} className={`${SOLID} mt-[18px]`}>
                    Continue
                  </button>
                </div>
              </div>
            )}

            {videoFailed && (
              <div className="absolute inset-0 grid place-items-center bg-[#07080c] p-6 text-center">
                <div>
                  <p className="text-secondary-foreground text-sm">This video didn't load.</p>
                  <button
                    type="button"
                    onClick={() => {
                      retried.current = true;
                      setVideoFailed(false);
                      void reload();
                    }}
                    className={`${SOLID} mt-3`}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {hasVideo && (
              <>
                {/* A scene's first frame is dark while its title fades in, so a still stands in until it plays. */}
                {time === 0 && !playing && (
                  <StillFrame src={current.video_url!} className="pointer-events-none absolute inset-0" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-linear-to-b from-transparent to-black/75" />
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Play"
                  className={cn(
                    "ease-snappy absolute inset-0 m-auto grid size-[72px] place-items-center rounded-full bg-[#f5f5f7]/94 shadow-[0_0_60px_rgba(155,124,255,0.45)] transition-[opacity,scale] duration-[400ms] hover:scale-105",
                    (playing || overlay || notepadAt !== null) && "pointer-events-none scale-90 opacity-0",
                  )}
                >
                  <Play size={28} weight="fill" className="text-background ml-1" />
                </button>
                <div className="text-secondary-foreground absolute inset-x-2 bottom-1.5 flex items-center gap-1.5 text-xs tabular-nums sm:inset-x-4 sm:bottom-3.5 sm:gap-3.5">
                  <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className={CONTROL}>
                    {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                  </button>
                  <span className="hidden sm:inline">
                    {formatTime(time)} / {formatTime(duration)}
                  </span>
                  <Scrub
                    progress={duration ? time / duration : 0}
                    duration={duration}
                    noteTimes={sceneNotes.map((note) => note.time_seconds)}
                    onSeek={seek}
                  />
                  <button
                    type="button"
                    onClick={openNotepad}
                    disabled={notesFull}
                    aria-label="Add a note"
                    title={notesFull ? "This lesson has 100 notes. Delete one to add more." : undefined}
                    className={cn(CONTROL, "disabled:cursor-default disabled:opacity-40")}
                  >
                    <NotePencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => film.current?.requestFullscreen().catch(() => {})}
                    aria-label="Full screen"
                    className={CONTROL}
                  >
                    <CornersOut size={18} />
                  </button>
                </div>
              </>
            )}

            {notepadAt !== null && (
              <Notepad
                time={notepadAt}
                onCancel={() => setNotepadAt(null)}
                onSave={async (content) => {
                  await notes.add(scene, Math.min(notepadAt, TIME_MAX), content);
                  setNotepadAt(null);
                }}
              />
            )}

            {overlay === "quiz" && (
              <QuizOverlay
                scene={current}
                total={scenes.length}
                picked={answers[scene]}
                onPick={(choice) => setAnswers((a) => ({ ...a, [scene]: choice }))}
                onNext={next}
              />
            )}
            {overlay === "complete" && (
              <CompleteOverlay
                score={scoreOf(scenes, answers)}
                total={scenes.length}
                onAgain={() => go(scenes[0].position)}
                onAskTutor={() => {
                  setOverlay(null);
                  openCard("tutor");
                }}
              />
            )}
          </div>

          {/* The narration under the film, like subtitles; the sentence being spoken is lit. */}
          <p className="text-foreground/50 mx-auto mt-3.5 max-w-[720px] text-center text-base leading-relaxed tracking-[-0.01em] sm:mt-5 sm:min-h-[60px] sm:text-[19px]">
            {sentences.map((sentence, k) => (
              <span key={k} className={cn("transition-colors duration-[400ms]", k === lit && "text-foreground")}>
                {sentence.trim()}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>

      <ScenesPanel
        scenes={scenes}
        current={scene}
        watched={watched}
        progress={progress}
        durations={durations}
        onDuration={(position, seconds) => setDurations((d) => (d[position] ? d : { ...d, [position]: seconds }))}
        onSelect={(position) => go(position)}
        rail={railRight}
        onToggleRail={toggleRail}
      />

      <Dock
        open={dockOpen}
        card={card}
        onToggle={() => (dockOpen ? closeAll() : setDockOpen(true))}
        onOpenCard={openCard}
        className={cn("ease-snappy transition-[right] duration-[450ms]", right)}
      />
      <TutorCard
        open={card === "tutor"}
        onClose={() => setCard(null)}
        tutor={tutor}
        moment={`Scene ${scene} at ${formatTime(stamp)}`}
        onAsk={() => tutor.ask(scene, stamp)}
        className={right}
      />
      <NotesCard
        open={card === "notes"}
        onClose={() => setCard(null)}
        notes={notes.notes}
        scenes={scenes}
        onOpenNote={(note: Note) => {
          setCard(null);
          go(note.scene_position, note.time_seconds);
        }}
        onEdit={notes.edit}
        onDelete={notes.remove}
        className={right}
      />
      <QuizCard
        open={card === "quiz"}
        onClose={() => setCard(null)}
        scenes={scenes}
        answers={answers}
        onPick={(position, choice) => setAnswers((a) => ({ ...a, [position]: choice }))}
        className={right}
      />
    </div>
  );
}

const CONTROL = cn(ICON_BUTTON, "text-foreground size-[30px] rounded-[10px] hover:bg-white/10 sm:size-[34px]");
