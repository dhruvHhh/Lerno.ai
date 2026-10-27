import {
  CornersIn,
  CornersOut,
  Fire,
  NotePencil,
  Pause,
  Sparkle,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ICON_BUTTON } from "@/components/app/Sidebar";
import LumoQuestionCard from "@/components/lesson/mascot/LumoQuestionCard";
import LumoStage from "@/components/lesson/mascot/LumoStage";
import useLumoCheckpoints from "@/components/lesson/mascot/useLumoCheckpoints";
import PlayIcon from "@/components/ui/play-icon";
import Dock, { type CardName } from "@/components/watch/Dock";
import Notepad from "@/components/watch/Notepad";
import NotesCard from "@/components/watch/NotesCard";
import { CompleteOverlay, QuizOverlay } from "@/components/watch/Overlays";
import QuizCard from "@/components/watch/QuizCard";
import ScenesPanel from "@/components/watch/ScenesPanel";
import Scrub from "@/components/watch/Scrub";
import { DOCK_KEYS, SOLID, scoreOf } from "@/components/watch/shared";
import TutorCard from "@/components/watch/TutorCard";
import useFullscreen from "@/hooks/useFullscreen";
import useNotes, { type Note } from "@/hooks/useNotes";
import useTutor from "@/hooks/useTutor";
import useVideoTime from "@/hooks/useVideoTime";
import { LEVELS, type LessonWithScenes } from "@/lib/api";
import {
  saveLumoSound,
  saveProgress,
  saveScenesRail,
  savedLumoSound,
  savedProgress,
  savedScenesRail,
} from "@/lib/saved";
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
  className?: string;
}

export default function LessonPage({ lesson, refresh, className }: LessonPageProps) {
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
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<"quiz" | "complete" | null>(null);
  const [card, setCard] = useState<CardName | null>(null);
  const [notesFocus, setNotesFocus] = useState<{ ids: string[]; at: number } | null>(null);
  const [notepadAt, setNotepadAt] = useState<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [railRight, setRailRight] = useState(savedScenesRail);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);
  const [lumoSound, setLumoSound] = useState(savedLumoSound);

  const notes = useNotes(lesson.id);
  const tutor = useTutor(lesson.id);
  const video = useRef<HTMLVideoElement>(null);
  // The element itself, for the small parts that follow its time; the ref is for handlers.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    video.current = element;
    setVideoEl(element);
  }, []);
  const film = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(film);
  const playButton = useRef<HTMLButtonElement>(null);
  // What to do once the next video's details load: where to start, and whether to play.
  const pending = useRef({ at: start?.time ?? 0, play: false });
  const retried = useRef(false);
  const timeNow = useRef(start?.time ?? 0);

  const current = scenes.find((s) => s.position === scene)!;
  const index = scenes.indexOf(current);
  const sceneNotes = notes.notes.filter((note) => note.scene_position === scene);

  // Lumo's quick check partway through the scene. Its answer is the scene's answer, so the end of the scene and the
  // quiz card show it too.
  const lumo = useLumoCheckpoints({
    lessonId: lesson.id,
    scene,
    video: videoEl,
    correct: current.mcq_correct_index,
    answer: current.mcq_choices[current.mcq_correct_index],
    answered: answers[scene] !== undefined,
    blocked: card !== null || notepadAt !== null || overlay !== null,
    sound: lumoSound,
    onAnswer: (choice) => setAnswers((a) => ({ ...a, [scene]: choice })),
    onResume: (rewind) => {
      const v = video.current;
      if (v) {
        if (rewind) v.currentTime = Math.max(0, v.currentTime - rewind);
        v.play().catch(() => {});
      }
      playButton.current?.focus({ preventScroll: true });
    },
    onExplain: () => {
      tutor.setDraft(
        `Can you explain this? "${current.mcq_question}" The answer is "${current.mcq_choices[current.mcq_correct_index]}".`,
      );
      openCard("tutor");
    },
  });
  // Lumo and its question stay outside the film, so they never cover the lesson; full screen has no outside, so there
  // they are inside it, bottom left, away from the mark burned into the bottom right.
  const cardOpen = lumo.phase !== null && lumo.phase !== "entrance";
  const lumoCard = (from: "top" | "bottom", className: string) =>
    lumo.phase !== null &&
    lumo.phase !== "entrance" && (
      <LumoQuestionCard
        key="lumo-card"
        scene={current}
        time={lumo.time}
        phase={lumo.phase}
        picked={lumo.picked}
        line={lumo.speech?.text ?? null}
        from={from}
        onPick={lumo.pick}
        onSkip={lumo.skip}
        onRewind={lumo.rewind}
        onContinue={lumo.resume}
        onExplain={lumo.explain}
        className={className}
      />
    );
  const lumoStage = (inFilm: boolean, className: string) => (
    <LumoStage
      state={lumo.lumo}
      onDone={lumo.lumoDone}
      inFilm={inFilm}
      checking={!!lumo.phase}
      cue={lumo.cue}
      reaction={lumo.reaction}
      speech={lumo.speech}
      className={className}
    />
  );
  const toggleSound = () => {
    saveLumoSound(!lumoSound);
    setLumoSound(!lumoSound);
  };

  // Progress is saved whenever the scene, the ticks or the answers change, and on pause and on leaving.
  const save = useCallback(
    () => saveProgress(lesson.id, { scene, time: timeNow.current, watched, answers }),
    [lesson.id, scene, watched, answers],
  );
  useEffect(() => {
    save();
    return save;
  }, [save]);

  // The furthest point reached in this scene, for its bar in the scenes list. Kept on pause and when leaving.
  const keepProgress = useCallback(() => {
    const v = video.current;
    if (!v?.duration) return;
    const fraction = v.currentTime / v.duration;
    setProgress((p) => (fraction > (p[scene] ?? 0) ? { ...p, [scene]: fraction } : p));
  }, [scene]);

  const go = useCallback(
    (position: number, at = 0, play = true) => {
      keepProgress();
      pending.current = { at, play };
      retried.current = false;
      timeNow.current = at;
      setVideoFailed(false);
      setOverlay(null);
      setNotepadAt(null);
      const v = video.current;
      if (position === scene && v && v.readyState > 0) {
        v.currentTime = at;
        if (play) v.play().catch(() => {});
      } else setScene(position);
    },
    [scene, keepProgress],
  );

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v || overlay || lumo.phase) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [overlay, lumo.phase]);

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
    setCard(name);
  }, []);
  // A tool's button opens its card, or closes it when it is the open one.
  const pickCard = useCallback((name: CardName) => (card === name ? setCard(null) : openCard(name)), [card, openCard]);
  const closeCard = () => setCard(null);
  const closeAll = useCallback(() => {
    setCard(null);
    setNotepadAt(null);
  }, []);
  const openNotes = (ids: string[]) => {
    setNotesFocus({ ids, at: Date.now() });
    openCard("notes");
  };

  const openNotepad = () => {
    video.current?.pause();
    setCard(null);
    setNotepadAt(video.current?.currentTime ?? timeNow.current);
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

  // Keys: Space plays, the arrows skip 5 seconds, T, N and Q open the tools, Esc closes what is open. Nothing fires
  // while the user types.
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
      else if (DOCK_KEYS[event.key.toLowerCase()] && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // The card focuses its input at once; without this the key's letter would land in it.
        event.preventDefault();
        pickCard(DOCK_KEYS[event.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, closeAll, pickCard]);

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
  const hasVideo = !!current.video_url && !videoFailed;
  const notesFull = notes.notes.length >= NOTES_LIMIT;

  return (
    // The page fills the shell's main area edge to edge on desktop, with its own scroll and the scenes on the right.
    <div
      className={cn(
        // On phones the bottom padding keeps the last scene clear of the floating dock.
        "w-full pb-8 lg:-mx-6 lg:-mb-12 lg:grid lg:h-svh lg:w-[calc(100%+3rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:pb-0",
        // Where the scenes panel ends on desktop; the dock and the cards sit beside it.
        railRight ? "[--rail-edge:94px]" : "[--rail-edge:334px]",
        className,
      )}
    >
      <div
        data-lenis-prevent
        className="@container relative min-w-0 pb-2 lg:[scrollbar-width:thin] lg:[scrollbar-gutter:stable] lg:overflow-y-auto lg:px-8 lg:pt-[22px] lg:pb-10"
      >
        <div className="pointer-events-none absolute -inset-x-4 inset-y-0 bg-[radial-gradient(550px_350px_at_50%_40%,rgba(122,96,230,0.16),transparent)] lg:inset-x-0" />
        {!online && <p className="text-muted-foreground relative mb-2 text-center text-xs">You're offline.</p>}
        {/* When the column is wide enough to spare it, Lumo gets a gutter left of the film, reserved even at rest so
            nothing shifts. Narrower, Lumo stands under the film rather than taking width from it. */}
        <div className="relative mx-auto max-w-[min(1040px,max(440px,calc((100vh-330px)*16/9)))] @6xl:max-w-[min(1208px,max(608px,calc((100vh-330px)*16/9+168px)))] @6xl:pl-[168px]">
          <small className="text-muted-foreground text-[13px]">{LEVELS[lesson.audience]}</small>
          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] lg:text-2xl">
            {lesson.title ?? lesson.topic}
          </h1>

          {/* On phones the film runs edge to edge, like a video app; the main area's 16px gutter is undone here. A quiz
              is too tall for a 16:9 phone film, so there the film grows to hold it. */}
          <div
            ref={film}
            data-overlay={overlay ? "" : undefined}
            className="relative -mx-4 mt-2.5 aspect-video overflow-hidden bg-black shadow-[0_40px_120px_-40px_rgba(120,90,230,0.6),0_0_0_1px_rgba(255,255,255,0.07)] max-sm:data-overlay:aspect-auto sm:mx-0 sm:rounded-xl lg:mt-4 lg:rounded-2xl"
          >
            {current.video_url && !videoFailed && (
              <video
                key={scene}
                ref={attachVideo}
                src={current.video_url}
                // A scene's first frame is dark while its title fades in, so its thumbnail stands in until it plays.
                poster={current.thumbnail_url ?? undefined}
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
                onTimeUpdate={(event) => (timeNow.current = event.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={(event) => {
                  // The last time update can be a quarter second old; notes and saved progress use the exact moment.
                  timeNow.current = event.currentTarget.currentTime;
                  keepProgress();
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-linear-to-b from-transparent to-black/75" />
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Play"
                  className={cn(
                    "ease-snappy absolute inset-0 m-auto grid size-[72px] place-items-center rounded-full bg-[#f5f5f7]/94 shadow-[0_0_60px_rgba(155,124,255,0.45)] transition-[opacity,scale] duration-[400ms] hover:scale-105",
                    (playing || overlay || lumo.phase || notepadAt !== null) &&
                      "pointer-events-none scale-90 opacity-0",
                  )}
                >
                  <PlayIcon size={28} className="text-background" />
                </button>
                <div className="text-secondary-foreground absolute inset-x-2 bottom-1.5 flex items-center gap-1.5 text-xs tabular-nums sm:inset-x-4 sm:bottom-3.5 sm:gap-3.5">
                  <button
                    ref={playButton}
                    type="button"
                    onClick={toggle}
                    aria-label={playing ? "Pause" : "Play"}
                    className={CONTROL}
                  >
                    {playing ? <Pause size={18} weight="fill" /> : <PlayIcon size={16} />}
                  </button>
                  <TimeLabel video={videoEl} duration={duration} />
                  <Scrub
                    video={videoEl}
                    playing={playing}
                    duration={duration}
                    notes={sceneNotes}
                    onSeek={seek}
                    onOpenNotes={openNotes}
                    checkpoint={
                      lumo.marker === null ? undefined : { at: lumo.marker, done: answers[scene] !== undefined }
                    }
                  />
                  <button
                    type="button"
                    onClick={openNotepad}
                    // The notepad opens where Lumo and its question sit.
                    disabled={notesFull || !!lumo.phase}
                    aria-label="Add a note"
                    title={notesFull ? "This lesson has 100 notes. Delete one to add more." : undefined}
                    className={cn(CONTROL, "disabled:cursor-default disabled:opacity-40")}
                  >
                    <NotePencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={fullscreen.toggle}
                    aria-label={fullscreen.full ? "Exit full screen" : "Full screen"}
                    className={CONTROL}
                  >
                    {fullscreen.full ? <CornersIn size={18} /> : <CornersOut size={18} />}
                  </button>
                </div>

                {/* On a phone the open check needs this corner. */}
                <p
                  className={cn(
                    "text-foreground absolute top-2 right-2 flex h-7 items-center gap-2.5 rounded-full border border-white/10 bg-black/55 px-2.5 text-xs font-medium tabular-nums backdrop-blur-sm sm:top-3 sm:right-3",
                    lumo.phase && "max-sm:hidden",
                  )}
                >
                  <span className="sr-only">
                    {lumo.score.xp} XP, {lumo.score.streak} right in a row
                  </span>
                  <span aria-hidden="true" className="inline-flex items-center gap-1">
                    <Sparkle size={13} weight="fill" className="text-accent-soft" />
                    {lumo.score.xp} XP
                  </span>
                  <span aria-hidden="true" className="inline-flex items-center gap-1">
                    <Fire
                      size={13}
                      weight="fill"
                      className={lumo.score.streak ? "text-danger" : "text-muted-foreground"}
                    />
                    {lumo.score.streak}
                  </span>
                </p>

                {/* In full screen: beside Lumo, and short of the right tenth, where Lerno's mark is burned in. On a phone
                    held upright there is no room beside Lumo, so the card sits above Lumo and its bubble. */}
                <AnimatePresence>
                  {fullscreen.full &&
                    lumoCard(
                      "bottom",
                      "absolute inset-x-2 bottom-[300px] z-10 max-h-[calc(100%-312px)] sm:right-auto sm:bottom-[52px] sm:left-[256px] sm:max-h-[calc(100%-64px)] sm:w-[min(330px,calc(90%-256px))]",
                    )}
                </AnimatePresence>
              </>
            )}

            {fullscreen.full && lumoStage(true, "absolute bottom-[50px] left-3 z-10 size-43 sm:size-58")}

            {notepadAt !== null && (
              <Notepad
                time={notepadAt}
                onCancel={() => setNotepadAt(null)}
                onSave={async (content) => {
                  await notes.add(scene, Math.min(notepadAt, TIME_MAX), content);
                  setNotepadAt(video.current?.currentTime ?? notepadAt);
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

          {/* Lumo's row, under the film: Lumo and its sound switch, then the narration, or Lumo's question in its place. In
              the wide layout Lumo leaves the row for the gutter, its feet on the film's bottom edge. On a phone the
              question drops below Lumo, at full width. */}
          <div className="relative flex flex-wrap items-start gap-x-3 @6xl:block">
            {!fullscreen.full && (
              <div className="mt-3.5 flex flex-none flex-col items-center gap-1 sm:mt-5 @6xl:contents">
                {lumoStage(false, "size-35 @6xl:absolute @6xl:right-full @6xl:bottom-full @6xl:mr-4 @6xl:size-46")}
                {/* Centred under Lumo's feet, in the row or in the gutter. */}
                <div className="flex justify-center @6xl:absolute @6xl:top-2 @6xl:right-full @6xl:mr-4 @6xl:w-46">
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label="Lumo's sounds"
                    aria-pressed={lumoSound}
                    title={lumoSound ? "Turn Lumo's sounds off" : "Turn Lumo's sounds on"}
                    className="text-muted-foreground hover:text-foreground rounded-tile grid size-7 place-items-center transition-colors duration-200"
                  >
                    {lumoSound ? (
                      <SpeakerHigh size={14} aria-hidden="true" />
                    ) : (
                      <SpeakerSlash size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {/* The question waits for the narration to leave, and the narration for the question, so they never stack. */}
            {/* In the row, the question drops below Lumo at full width, leaving the bubble room beside Lumo. */}
            <div className={cn("min-w-0 flex-1", cardOpen && "basis-full")}>
              <AnimatePresence mode="wait" initial={false}>
                {cardOpen && !fullscreen.full ? (
                  // Room below, so the card can scroll up clear of the floating dock.
                  lumoCard("top", "mt-3.5 mb-20 sm:mt-5")
                ) : (
                  <Narration
                    key="narration"
                    video={videoEl}
                    text={current.narration}
                    // On phones the quiz fills the film, so the finished scene's narration steps aside for it.
                    className={cn(overlay && "max-sm:hidden")}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <ScenesPanel
        scenes={scenes}
        current={scene}
        watched={watched}
        progress={progress}
        video={videoEl}
        onSelect={go}
        rail={railRight}
        onToggleRail={toggleRail}
      />

      <Dock card={card} onPick={pickCard} />
      <TutorCard
        open={card === "tutor"}
        onClose={closeCard}
        tutor={tutor}
        moment={<Moment video={videoEl} scene={scene} />}
        onAsk={() => tutor.ask(scene, stampOf(video.current))}
      />
      <NotesCard
        open={card === "notes"}
        onClose={closeCard}
        notes={notes.notes}
        scenes={scenes}
        onOpenNote={(note: Note) => {
          setCard(null);
          go(note.scene_position, note.time_seconds);
        }}
        onEdit={notes.edit}
        onDelete={notes.remove}
        onDropped={notes.drop}
        focus={notesFocus}
      />
      <QuizCard
        open={card === "quiz"}
        onClose={closeCard}
        scenes={scenes}
        answers={answers}
        onPick={(position, choice) => setAnswers((a) => ({ ...a, [position]: choice }))}
      />
    </div>
  );
}

const CONTROL = cn(ICON_BUTTON, "text-foreground size-[30px] rounded-tile hover:bg-white/10 sm:size-[34px]");

const stampOf = (video: HTMLVideoElement | null) => Math.min(video?.currentTime ?? 0, TIME_MAX);

// The parts below follow the video's time on their own, so the page does not re-render as it plays.

function TimeLabel({ video, duration }: { video: HTMLVideoElement | null; duration: number }) {
  const seconds = useVideoTime(video, (v) => Math.floor(v.currentTime), 0);
  return (
    <span className="hidden sm:inline">
      {formatTime(seconds)} / {formatTime(duration)}
    </span>
  );
}

// The narration under the film, like subtitles; the sentence being spoken is lit.
function Narration({ video, text, className }: { video: HTMLVideoElement | null; text: string; className?: string }) {
  const sentences = text.match(/[^.?!]+[.?!]*/g) ?? [text];
  const lit = useVideoTime(
    video,
    (v) =>
      v.duration ? Math.min(sentences.length - 1, Math.floor((v.currentTime / v.duration) * sentences.length)) : 0,
    0,
  );
  return (
    <p
      className={cn(
        "text-foreground/50 mx-auto mt-3.5 max-w-[720px] text-center text-base leading-relaxed tracking-[-0.01em] sm:mt-5 sm:min-h-[60px] sm:text-[19px]",
        className,
      )}
    >
      {sentences.map((sentence, k) => (
        <span key={k} className={cn("transition-colors duration-[400ms]", k === lit && "text-foreground")}>
          {sentence.trim()}{" "}
        </span>
      ))}
    </p>
  );
}

function Moment({ video, scene }: { video: HTMLVideoElement | null; scene: number }) {
  const seconds = useVideoTime(video, (v) => Math.floor(stampOf(v)), 0);
  return `Scene ${scene} · ${formatTime(seconds)}`;
}
