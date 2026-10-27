import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type LumoState = "idle" | "entrance" | "speaking" | "thinking" | "found";

// Lengths and loops are from public/lumo/lumo-all/manifest.json, where the entrance is the "elastic" clip. The entrance
// runs a little fast, so the question isn't kept waiting.
const CLIPS: Record<LumoState, { file: string; seconds: number; loop: boolean; rate: number }> = {
  idle: { file: "idle", seconds: 4.11, loop: true, rate: 0.8 },
  entrance: { file: "elastic", seconds: 4, loop: false, rate: 1.3 },
  speaking: { file: "speaking", seconds: 2.89, loop: true, rate: 1 },
  thinking: { file: "thinking", seconds: 2, loop: true, rate: 1 },
  found: { file: "found", seconds: 1.24, loop: false, rate: 1.1 },
};

const STATES = Object.keys(CLIPS) as LumoState[];

// A clip that plays once but never reports its end still finishes this long after it should have.
const LATE_MS = 1000;
const STILL_MS = 1000;
// The clip coming in fades in over 180ms (the classes below), and the one going out fades a beat behind it; after
// this long the one behind is stopped.
const SWAP_MS = 300;

// The clips are VP9 with alpha. Safari answers "probably" for VP9 WebM but drops its alpha, which draws a box behind
// Lumo, so every WebKit browser (all of them on iOS) gets the drawn Lumo, as does any browser without VP9 WebM.
const playsClearWebm = () => {
  const agent = navigator.userAgent;
  const webkit = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(agent) || /iP(hone|ad|od)/.test(agent);
  return !webkit && document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
};

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

interface LumoProps {
  state: LumoState;
  // Called once when a clip that plays once (entrance, found) ends.
  onDone?: () => void;
  className?: string;
}

// Every clip stays mounted and loaded. A new clip starts from its first frame behind the current one and fades in only
// once it is playing, so a change never cuts, flashes or shows a stale frame. Off screen or in a hidden tab, nothing
// plays.
export default function Lumo({ state, onDone, className }: LumoProps) {
  const [clear] = useState(playsClearWebm);
  const [failed, setFailed] = useState(false);
  const still = useReducedMotion() ?? false;
  const box = useRef<HTMLDivElement>(null);
  const videos = useRef<Partial<Record<LumoState, HTMLVideoElement | null>>>({});
  const done = useRef(onDone);
  // The clip in front, and the one fading out behind it.
  const [layers, setLayers] = useState<{ front: LumoState; back: LumoState | null }>({ front: "idle", back: null });
  const [onScreen, setOnScreen] = useState(true);
  const tabShown = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible");
  const drawn = !clear || failed;
  const awake = onScreen && tabShown && !still && !drawn;
  // Reduced motion: Lumo stays on the idle clip's first frame, whatever the state.
  const target = still ? "idle" : state;

  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const incoming = videos.current[target];
    if (!incoming) return;
    if (!awake) {
      for (const video of Object.values(videos.current)) video?.pause();
      return;
    }
    if (target === layers.front) {
      incoming.play().catch(() => {});
      return;
    }
    const show = () => setLayers((l) => (l.front === target ? l : { front: target, back: l.front }));
    incoming.playbackRate = CLIPS[target].rate;
    incoming.currentTime = 0;
    // Still fading out from a moment ago, it is already playing.
    if (!incoming.paused) return show();
    incoming.addEventListener("playing", show, { once: true });
    incoming.play().catch(() => {});
    return () => incoming.removeEventListener("playing", show);
  }, [target, layers.front, awake]);

  useEffect(() => {
    const back = layers.back;
    if (!back) return;
    const timer = window.setTimeout(() => {
      videos.current[back]?.pause();
      setLayers((l) => (l.back === back ? { ...l, back: null } : l));
    }, SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [layers.back]);

  useEffect(() => {
    const clip = CLIPS[state];
    if (clip.loop) return;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done.current?.();
    };
    // Still or drawn, nothing plays, so a short beat stands in for the clip: long enough to see, never a wait.
    const plays = !still && !drawn;
    const length = (clip.seconds / clip.rate) * 1000;
    const timer = window.setTimeout(finish, plays ? length + LATE_MS : Math.min(length, STILL_MS));
    const video = plays ? videos.current[state] : undefined;
    video?.addEventListener("ended", finish);
    return () => {
      window.clearTimeout(timer);
      video?.removeEventListener("ended", finish);
    };
  }, [state, still, drawn]);

  return (
    <div ref={box} className={cn("relative", className)}>
      {drawn ? (
        <DrawnLumo />
      ) : (
        STATES.map((name) => (
          <video
            key={name}
            ref={(element) => {
              videos.current[name] = element;
              if (element) element.defaultPlaybackRate = CLIPS[name].rate;
            }}
            src={`/lumo/lumo-all/${CLIPS[name].file}.webm`}
            aria-hidden="true"
            muted
            playsInline
            autoPlay={name === layers.front && awake}
            loop={CLIPS[name].loop}
            preload="auto"
            onError={() => setFailed(true)}
            className={cn(
              "ease-snappy absolute inset-0 size-full transition-opacity motion-reduce:transition-none",
              name === layers.front && "z-[1] opacity-100 duration-[180ms]",
              name === layers.back && "opacity-0 delay-[60ms] duration-[180ms]",
              name !== layers.front && name !== layers.back && "opacity-0 duration-0",
            )}
          />
        ))
      )}
    </div>
  );
}

// Where the clips can't play clear: a lavender blob with two dark pill eyes, never a box.
function DrawnLumo() {
  return (
    <span aria-hidden="true" className="bg-accent-soft absolute inset-[22%] rounded-full">
      <span className="bg-background absolute top-[34%] left-[30%] h-[24%] w-[11%] rounded-full" />
      <span className="bg-background absolute top-[34%] right-[30%] h-[24%] w-[11%] rounded-full" />
    </span>
  );
}
