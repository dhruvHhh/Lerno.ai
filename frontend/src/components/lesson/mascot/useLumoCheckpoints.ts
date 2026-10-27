import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { LumoState } from "@/components/lesson/mascot/Lumo";
import { playLumoSound } from "@/components/lesson/mascot/lumoSounds";
import useVideoTime from "@/hooks/useVideoTime";
import { saveLumo, savedLumo } from "@/lib/saved";

export type CheckPhase = "entrance" | "speaking" | "thinking" | "correct" | "wrong";

// Each scene's check lands somewhere in this share of it.
const FROM = 0.55;
const TO = 0.85;
export const XP = 10;
const REWIND_SECONDS = 10;
// Lumo hops and calls "!" for this long of plain playback just before the check, and the check waits for it: a check
// put off (a tool open, a pause, a seek) gets its full second once playback runs on.
const CUE_SECONDS = 1;
// The card comes this long into the entrance; Lumo finishes landing while it slides in.
const CARD_MS = 600;
// Lumo speaks this long once it has landed, then thinks while the learner chooses.
const SPEAK_MS = 2000;
// The wrong-answer reaction as one sequence, in ms from the pick. The card and Lumo both follow it, so tune it here.
export const WRONG_BEATS = {
  // The chosen option shakes at once; then Lumo droops, and shakes its head while it speaks.
  droop: 120,
  headShake: 350,
  // The right option turns mint, then the action buttons come in, a little apart.
  reveal: 650,
  buttons: 720,
  buttonGap: 60,
  // Lumo's bubble.
  bubble: 800,
  // Lumo bounces back, settles, and says something kind.
  recover: 2200,
} as const;
const FAST_AT = 3;

// Development only: `?lumo=fast` puts every check 3 seconds into its scene, and re-asks on every visit.
const isFast = () => import.meta.env.DEV && new URLSearchParams(window.location.search).get("lumo") === "fast";

// A wrong pick plays speaking until Lumo recovers; there is no sad clip.
const LUMO: Record<CheckPhase, LumoState> = {
  entrance: "entrance",
  speaking: "speaking",
  thinking: "thinking",
  correct: "found",
  wrong: "speaking",
};

// What Lumo says, in its speech bubble and in the question card's live region.
export type Line = "check" | "patience" | "right" | "wrong" | "cheer";

export const lineText = (line: Line, answer: string) =>
  ({
    check: "Quick check!",
    patience: "Take your time",
    right: `Nice one! +${XP} XP`,
    wrong: `Not quite — the answer was ${answer}`,
    cheer: "You'll get the next one!",
  })[line];

// FNV-1a over the lesson and scene, as a share from 0 to 1: a scene's check stays at the same moment across renders
// and reloads.
function seeded(key: string) {
  let hash = 0x811c9dc5;
  for (let k = 0; k < key.length; k++) hash = Math.imul(hash ^ key.charCodeAt(k), 0x01000193);
  return (hash >>> 0) / 2 ** 32;
}

// The scenes already asked this session, so seeking back past a check, or reloading, never asks it again. Storage can
// be blocked, and then this only lasts while the page is open.
const askedKey = (lessonId: string) => `lerno:lumo-asked:${lessonId}`;

function readAsked(lessonId: string): number[] {
  try {
    return JSON.parse(sessionStorage.getItem(askedKey(lessonId)) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function writeAsked(lessonId: string, asked: Set<number>) {
  try {
    sessionStorage.setItem(askedKey(lessonId), JSON.stringify([...asked]));
  } catch {
    // Asked again after a reload, nothing worse.
  }
}

interface Check {
  scene: number;
  phase: CheckPhase;
  // Where the video paused, in seconds.
  time: number;
  // Whether Lumo's entrance has finished; the question can already be showing before it does.
  settled: boolean;
  // After a wrong pick: whether Lumo has finished talking it through.
  calm: boolean;
  picked?: number;
}

interface LumoCheckpointsOptions {
  lessonId: string;
  // The current scene's position, and its video.
  scene: number;
  video: HTMLVideoElement | null;
  correct: number;
  // The right choice's text, for what Lumo says after a wrong pick.
  answer: string;
  // A scene already answered (here, at its end or in the quiz card) is not asked again.
  answered: boolean;
  // While the tutor, notes or another overlay is open, a check that comes due waits until the learner plays on.
  blocked: boolean;
  // Whether answers make a sound.
  sound: boolean;
  onAnswer: (choice: number) => void;
  // After the check closes: play on from `rewind` seconds back (0 is where it paused), with focus back on the player.
  onResume: (rewind: number) => void;
  // After a wrong pick, the learner can take the question to the tutor instead of playing on.
  onExplain?: () => void;
}

// One quick check per scene: Lumo pauses the video at its moment, if the learner played up to it, and asks the
// scene's question. Points and the streak stay in this browser.
export default function useLumoCheckpoints({
  lessonId,
  scene,
  video,
  correct,
  answer,
  answered,
  blocked,
  sound,
  onAnswer,
  onResume,
  onExplain,
}: LumoCheckpointsOptions) {
  const duration = useVideoTime(video, (v) => v.duration || 0, 0);
  const [fast] = useState(isFast);
  const still = useReducedMotion() ?? false;
  const [asked] = useState(() => new Set(fast ? [] : readAsked(lessonId)));
  const [check, setCheck] = useState<Check | null>(null);
  const [score, setScore] = useState(savedLumo);
  // The last thing Lumo said. It outlives the check, so "Nice one!" can finish as the video plays on.
  const [said, setSaid] = useState<{ line: Line; id: number } | null>(null);
  const say = (line: Line) => setSaid((s) => ({ line, id: (s?.id ?? 0) + 1 }));
  // A scene whose moment was played through before its check could fire: the check is owed.
  const owed = useRef<number | null>(null);
  // The scene whose "!" is showing, set from the playback loop below.
  const [cueing, setCueing] = useState<number | null>(null);
  // A check belongs to its scene: picking another one closes it.
  const active = check?.scene === scene ? check : null;

  let at = 0;
  if (duration)
    at = fast ? Math.min(FAST_AT, duration * TO) : duration * (FROM + seeded(`${lessonId}:${scene}`) * (TO - FROM));
  const waiting = !!video && at > 0 && !active && (fast || !answered) && !asked.has(scene);
  // Follows the playhead on every frame while it plays, and on time updates, which still come when the tab is hidden.
  // A seek clears the last time seen, so only playing across the moment counts, never jumping past it. The "!" shows
  // for a second of plain playback before the check fires: from a second before the moment, or, for a check that is
  // owed, as soon as playback runs on with nothing open. A pause, a seek or an open tool takes the "!" away and starts
  // its second again.
  useEffect(() => {
    if (!waiting || !video) return;
    let last = NaN;
    let frame = 0;
    // Where in the video the "!" came up, while it shows.
    let cueFrom: number | null = null;
    const hide = () => {
      if (cueFrom === null) return;
      cueFrom = null;
      setCueing(null);
    };
    const jumped = () => {
      last = NaN;
      hide();
    };
    const follow = () => {
      if (video.paused || video.seeking) return;
      const now = video.currentTime;
      if (last < at && now >= at) owed.current = scene;
      last = now;
      if (blocked) return hide();
      const owing = owed.current === scene && now >= at;
      if (cueFrom === null) {
        if (!owing && !(now >= at - CUE_SECONDS && now < at)) return;
        cueFrom = now;
        setCueing(scene);
      }
      if (now - cueFrom < CUE_SECONDS || !owing) return;
      hide();
      owed.current = null;
      asked.add(scene);
      if (!fast) writeAsked(lessonId, asked);
      video.pause();
      setCheck({ scene, phase: "entrance", time: now, settled: false, calm: false });
      say("check");
    };
    const tick = () => {
      follow();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      hide();
    };
    if (!video.paused) start();
    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("seeking", jumped);
    video.addEventListener("timeupdate", follow);
    return () => {
      stop();
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
      video.removeEventListener("seeking", jumped);
      video.removeEventListener("timeupdate", follow);
      setCueing(null);
    };
  }, [waiting, video, at, scene, lessonId, asked, fast, blocked]);

  const phase = active?.phase ?? null;
  const settled = active?.settled ?? false;
  const calm = active?.calm ?? false;

  // The question comes a beat into the entrance, then Lumo speaks once it has landed, then thinks.
  useEffect(() => {
    let after = 0;
    let next: Partial<Check> = {};
    if (phase === "entrance") [after, next] = [CARD_MS, { phase: "speaking" }];
    else if (phase === "speaking" && settled) [after, next] = [SPEAK_MS, { phase: "thinking" }];
    if (!after) return;
    const timer = window.setTimeout(() => {
      setCheck((c) => (c?.phase === phase ? { ...c, ...next } : c));
      if (next.phase === "thinking") say("patience");
    }, after);
    return () => window.clearTimeout(timer);
  }, [phase, settled]);

  // After a wrong pick: Lumo's bubble comes once the right answer shows, and when Lumo bounces back it settles and
  // says something kind. With reduced motion the bubble comes at once.
  useEffect(() => {
    if (phase !== "wrong") return;
    const timers = [
      window.setTimeout(() => say("wrong"), still ? 0 : WRONG_BEATS.bubble),
      window.setTimeout(() => {
        setCheck((c) => (c?.phase === "wrong" ? { ...c, calm: true } : c));
        say("cheer");
      }, WRONG_BEATS.recover),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, still]);

  // Until it lands, Lumo keeps playing its entrance under the question; an answer cuts straight to its reaction.
  const answering = phase === "entrance" || phase === "speaking" || phase === "thinking";
  let lumo: LumoState = "idle";
  if (active) lumo = answering && !settled ? "entrance" : calm ? "idle" : LUMO[active.phase];

  const close = (rewind = 0) => {
    setCheck(null);
    onResume(rewind);
  };

  const pick = (choice: number) => {
    if (!active || (active.phase !== "speaking" && active.phase !== "thinking")) return;
    const right = choice === correct;
    // Here, in the answer's click or key press, where browsers allow sound to start. It plays with the first beat of
    // either reaction.
    if (sound) playLumoSound(right ? "right" : "wrong");
    onAnswer(choice);
    setCheck({ ...active, phase: right ? "correct" : "wrong", settled: true, picked: choice });
    if (right) say("right");
    const next = right ? { xp: score.xp + XP, streak: score.streak + 1 } : { ...score, streak: 0 };
    setScore(next);
    saveLumo(next);
  };

  // Lumo's entrance landing lets it speak, and its happy hop closes the check.
  const lumoDone = () => {
    if (!active) return;
    if (lumo === "entrance") setCheck({ ...active, settled: true });
    else if (lumo === "found") close();
  };

  return {
    phase,
    // Lumo hops with a "!" for the second before the check fires.
    cue: waiting && !blocked && cueing === scene,
    // Lumo's reaction to the answer, with an id that is new for each check.
    reaction:
      active && (phase === "correct" || phase === "wrong")
        ? { kind: phase === "correct" ? ("right" as const) : ("wrong" as const), id: `${active.scene}:${active.time}` }
        : null,
    // What Lumo last said; `id` changes each time, even for the same words.
    speech: said && { id: said.id, line: said.line, text: lineText(said.line, answer) },
    time: active?.time ?? 0,
    picked: active?.picked,
    lumo,
    // The check's place on the scrub bar, as a share of the scene.
    marker: at ? at / duration : null,
    score,
    pick,
    skip: () => close(),
    rewind: () => close(REWIND_SECONDS),
    resume: () => close(),
    // Closes the check without playing on, and hands the question to the tutor.
    explain: onExplain
      ? () => {
          setCheck(null);
          onExplain();
        }
      : undefined,
    lumoDone,
  };
}
