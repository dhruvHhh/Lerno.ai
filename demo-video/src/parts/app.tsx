// Copies of the real Lerno app's pieces (frontend/src/components), at the app's own pixel sizes.
// Scenes scale them up as a group, so they keep the app's exact proportions.
import {
  ArrowRight,
  Check,
  CircleNotch,
  CornersOut,
  NotePencil,
  Pause,
  SidebarSimple,
  X,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Img, interpolate, staticFile } from "remotion";

import { CLAMP, COLOR, EASE } from "../theme";

export const RAISED_KEY: React.CSSProperties = {
  backgroundImage: "linear-gradient(#1d2030, #141723)",
  boxShadow:
    "0 1px 3px rgba(0,0,0,0.5), 0 0 14px rgba(155,124,255,0.12), inset 0 1px 0 rgba(183,164,255,0.22), 0 0 0 1px rgba(255,255,255,0.07)",
  borderRadius: 8,
};

export const INPUT_SHADOW =
  "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)";
export const INPUT_FOCUS =
  "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 2px rgba(155,124,255,0.8), 0 0 0 6px rgba(155,124,255,0.22)";

// shared.ts: the two button styles of the watch page.
const BUTTON: React.CSSProperties = {
  height: 32,
  padding: "0 14px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  color: COLOR.secondary,
  display: "grid",
  placeItems: "center",
};
const SOLID: React.CSSProperties = {
  ...BUTTON,
  fontWeight: 600,
  color: COLOR.bg,
  backgroundColor: COLOR.fg,
};

// Card.tsx: the floating panel the dock opens.
export const Card: React.FC<{
  title: string;
  chip?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}> = ({ title, chip, footer, children }) => (
  <section
    style={{
      width: 380,
      height: 540,
      borderRadius: 18,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backgroundImage:
        "linear-gradient(rgba(20,18,33,0.985), rgba(10,10,18,0.99))",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px -20px rgba(0,0,0,0.8)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 12px 12px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <b style={{ fontSize: 15, fontWeight: 600, color: COLOR.fg }}>{title}</b>
      {chip}
      <span
        style={{
          marginLeft: "auto",
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          color: COLOR.muted,
        }}
      >
        <X size={18} />
      </span>
    </div>
    <div
      style={{
        flex: 1,
        display: "grid",
        alignContent: "start",
        gap: 14,
        padding: "16px 18px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
    {footer}
  </section>
);

// Stamp.tsx: a moment in the lesson, set like a timecode; with `note`, the diamond of the note marker.
export const Stamp: React.FC<{ children: ReactNode; note?: boolean }> = ({
  children,
  note,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      fontWeight: 500,
      color: COLOR.soft,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {note && (
      <i
        style={{
          width: 7,
          height: 7,
          flex: "none",
          rotate: "45deg",
          borderRadius: 2,
          backgroundColor: COLOR.soft,
          boxShadow: "0 0 8px rgba(183,164,255,0.55)",
        }}
      />
    )}
    {children}
  </span>
);

// Choices.tsx: once picked, the right one turns green. `big` is the quick check over the video, otherwise the Quiz card.
// `glow` (0 to 1) eases the green in, as the app's 250ms transition does.
export const Choices: React.FC<{
  choices: string[];
  correct: number;
  glow: number;
  big?: boolean;
}> = ({ choices, correct, glow, big }) => (
  <div style={{ display: "grid", gap: 8 }}>
    {choices.map((choice, k) => {
      const g = k === correct ? glow : 0;
      return (
        <div
          key={choice}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: big ? "11px 14px" : "8px 10px",
            borderRadius: 4,
            fontSize: big ? 15 : 13,
            color: COLOR.fg,
            backgroundColor: `rgba(${Math.round(255 - 135 * g)},${Math.round(255 - 35 * g)},${Math.round(255 - 85 * g)},${0.04 + 0.06 * g})`,
            boxShadow: `inset 0 0 0 1px rgba(${Math.round(255 - 135 * g)},${Math.round(255 - 35 * g)},${Math.round(255 - 85 * g)},${0.1 + 0.45 * g})`,
          }}
        >
          <span
            style={{
              width: big ? 24 : 20,
              height: big ? 24 : 20,
              flex: "none",
              display: "grid",
              placeItems: "center",
              borderRadius: 4,
              fontSize: big ? 12 : 11,
              color: COLOR.secondary,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
            }}
          >
            {"ABCD"[k]}
          </span>
          {choice}
        </div>
      );
    })}
  </div>
);

// ScenesPanel.tsx's SceneRing: progress as a ring; when done it closes, fills green and a tick draws in.
// `doneAt` is the frame the scene ends; the fill and the tick follow with the app's own delays.
export const SceneRing: React.FC<{
  frame: number;
  fraction: number;
  doneAt?: number;
  size: number;
}> = ({ frame, fraction, doneAt, size }) => {
  const after = (delay: number, length: number) =>
    doneAt === undefined
      ? 0
      : interpolate(frame, [doneAt + delay, doneAt + delay + length], [0, 1], {
          ...CLAMP,
          easing: EASE,
        });
  const fill = after(18, 12);
  const tick = after(27, 24);

  return (
    <svg viewBox="0 0 20 20" width={size} height={size}>
      <circle cx={10} cy={10} r={10} fill="rgba(8,8,14,0.78)" />
      <circle cx={10} cy={10} r={10} fill={COLOR.green} opacity={fill} />
      <g
        style={{
          rotate: "-90deg",
          transformOrigin: "10px 10px",
          opacity: 1 - fill,
        }}
      >
        <circle
          cx={10}
          cy={10}
          r={6.5}
          fill="none"
          strokeWidth={2.2}
          stroke="rgba(255,255,255,0.15)"
        />
        <circle
          cx={10}
          cy={10}
          r={6.5}
          fill="none"
          strokeWidth={2.2}
          strokeLinecap="round"
          stroke={COLOR.soft}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - fraction}
        />
      </g>
      <path
        d="M6.2 10.4 8.8 13 13.8 7.4"
        fill="none"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#0b2a1c"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - tick}
      />
    </svg>
  );
};

// AskBox.tsx and TutorCard.tsx's send button.
export const SendButton: React.FC<{
  active: boolean;
  size: number;
  glow?: boolean;
}> = ({ active, size, glow }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      display: "grid",
      placeItems: "center",
      color: active ? COLOR.bg : COLOR.muted,
      backgroundColor: active ? COLOR.fg : "#1a1c26",
      boxShadow: glow ? "0 0 28px rgba(155,124,255,0.35)" : "none",
    }}
  >
    <ArrowRight size={size * 0.42} weight="bold" />
  </span>
);

const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

export type ScenesRow = { title: string; seconds: number; still: string };

// ScenesPanel.tsx: the list of scenes beside the video, with each scene's ring.
export const ScenesPanel: React.FC<{
  frame: number;
  scenes: ScenesRow[];
  current: number;
  fraction: number;
  doneAt: number;
}> = ({ frame, scenes, current, fraction, doneAt }) => (
  <aside
    style={{
      width: 380,
      height: 540,
      borderRadius: 18,
      backgroundColor: COLOR.surface,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    }}
  >
    <div
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 12px 0 16px",
      }}
    >
      <b style={{ fontSize: 15, fontWeight: 600, color: COLOR.fg }}>Scenes</b>
      <span style={{ fontSize: 12, color: COLOR.muted }}>3 scenes, 0:37</span>
      <span style={{ marginLeft: "auto", color: COLOR.muted, display: "grid" }}>
        <SidebarSimple size={18} mirrored />
      </span>
    </div>
    <div style={{ display: "grid", gap: 6, padding: "4px 8px 8px" }}>
      {scenes.map((scene, i) => {
        const on = i === current;
        const done = i < current || (i === 0 && frame >= doneAt);
        return (
          <div
            key={scene.title}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              alignItems: "center",
              gap: 12,
              padding: 8,
              borderRadius: 10,
              backgroundImage: on
                ? "linear-gradient(rgba(155,124,255,0.12), rgba(155,124,255,0.04))"
                : "none",
              boxShadow: on ? "inset 0 0 0 1px rgba(155,124,255,0.35)" : "none",
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "16 / 9",
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: "#0a0b10",
              }}
            >
              <Img
                src={staticFile(scene.still)}
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: on ? 1 : 0.75,
                }}
              />
              {(on || i === 0) && (
                <span style={{ position: "absolute", top: 4, right: 4 }}>
                  <SceneRing
                    frame={frame}
                    size={18}
                    fraction={
                      i === 0
                        ? Math.min(1, i < current ? 1 : fraction)
                        : fraction
                    }
                    doneAt={i === 0 ? doneAt : undefined}
                  />
                </span>
              )}
              <span
                style={{
                  position: "absolute",
                  right: 4,
                  bottom: 4,
                  padding: "1px 5px",
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.75)",
                  fontSize: 10,
                  color: COLOR.fg,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {clock(scene.seconds)}
              </span>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.375,
                  color: on ? COLOR.fg : COLOR.secondary,
                }}
              >
                {i + 1}. {scene.title}
              </p>
              <small
                style={{
                  marginTop: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: on ? COLOR.soft : done ? "#8fe0ba" : COLOR.muted,
                }}
              >
                {on ? (
                  "Now playing"
                ) : done ? (
                  <>
                    <Check size={13} weight="bold" />
                    Watched
                  </>
                ) : (
                  clock(scene.seconds)
                )}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  </aside>
);

export const PLAYER = {
  width: 680,
  videoTop: 62,
  videoHeight: 383,
  scrubLeft: 154,
  scrubRight: 568,
  controlsY: 414,
};

type PlayerProps = {
  video: ReactNode;
  // How far through the scene the bar is (0 to 1), and the time shown beside it.
  progress: number;
  time: string;
  playing: boolean;
  // Note markers on the bar: where they sit (0 to 1) and how far they have popped in (0 to 1).
  markers: { at: number; shown: number }[];
  narration: string[];
  sentence: number;
  // Shown over the video: the New note box or the quick check.
  children?: ReactNode;
};

// LessonPage.tsx's left side: the title, the film with its controls, and the narration under it.
// `chrome` (0 to 1) fades everything but the film itself: the film can open alone, then become the page.
export const Player: React.FC<
  PlayerProps & { bigPlay: number; chrome?: number }
> = ({
  video,
  progress,
  time,
  playing,
  markers,
  narration,
  sentence,
  children,
  bigPlay,
  chrome = 1,
}) => {
  return (
    <div style={{ width: PLAYER.width }}>
      <div
        style={{
          fontSize: 12,
          lineHeight: "16px",
          color: COLOR.secondary,
          opacity: chrome,
        }}
      >
        High school
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 26,
          lineHeight: "32px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: COLOR.fg,
          opacity: chrome,
        }}
      >
        Area under y = x²
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 12,
          height: PLAYER.videoHeight,
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: `0 40px 120px -40px rgba(120,90,230,${0.6 * chrome}), 0 0 0 1px rgba(255,255,255,${0.07 * chrome})`,
          borderRadius: 21 * chrome,
        }}
      >
        {video}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "30%",
            background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
            opacity: chrome,
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 72,
            height: 72,
            borderRadius: 36,
            display: "grid",
            placeItems: "center",
            backgroundColor: "rgba(245,245,247,0.94)",
            boxShadow: "0 0 60px rgba(155,124,255,0.45)",
            opacity: bigPlay,
            scale: 0.9 + 0.1 * bigPlay,
          }}
        >
          <PlayTriangle size={28} color={COLOR.bg} />
        </span>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 14,
            height: 34,
            opacity: chrome,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12,
            color: COLOR.secondary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              color: COLOR.fg,
            }}
          >
            {playing ? (
              <Pause size={18} weight="fill" />
            ) : (
              <PlayTriangle size={16} color={COLOR.fg} />
            )}
          </span>
          <span style={{ width: 70 }}>{time}</span>
          <div
            style={{ position: "relative", flex: 1, height: 18, marginLeft: 6 }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 7,
                height: 4,
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 7,
                height: 4,
                width: `${progress * 100}%`,
                borderRadius: 4,
                backgroundColor: COLOR.fg,
              }}
            />
            <span
              style={{
                position: "absolute",
                top: 3,
                left: `calc(${progress * 100}% - 6px)`,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: COLOR.fg,
                boxShadow: "0 0 0 4px rgba(155,124,255,0.25)",
              }}
            />
            {markers.map((m) => (
              <i
                key={m.at}
                style={{
                  position: "absolute",
                  top: 4.5,
                  left: `calc(${m.at * 100}% - 4.5px)`,
                  width: 9,
                  height: 9,
                  rotate: "45deg",
                  borderRadius: 2,
                  backgroundColor: COLOR.soft,
                  boxShadow: "0 0 0 2px #000, 0 0 12px rgba(183,164,255,0.6)",
                  opacity: m.shown,
                  scale: 0.4 + 0.6 * m.shown,
                }}
              />
            ))}
          </div>
          <span
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              color: COLOR.fg,
            }}
          >
            <NotePencil size={18} />
          </span>
          <span
            style={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              color: COLOR.fg,
            }}
          >
            <CornersOut size={18} />
          </span>
        </div>
        {children}
      </div>
      <p
        style={{
          margin: "14px 40px 0",
          opacity: chrome,
          textAlign: "center",
          fontSize: 17,
          lineHeight: "26px",
        }}
      >
        {narration.map((line, i) => (
          <span
            key={line}
            style={{ color: i === sentence ? COLOR.fg : COLOR.muted }}
          >
            {line}{" "}
          </span>
        ))}
      </p>
    </div>
  );
};

// play-icon.tsx: the triangle with its centroid centred.
const PlayTriangle: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M6.67 3.5 22.67 12 6.67 20.5Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

export const NOTEPAD = { left: 16, bottom: 60, width: 340, height: 170 };

// Notepad.tsx: the New note box over the video. `state` is the Save button's: idle, busy (Saving…), done (Saved).
export const Notepad: React.FC<{
  text: string;
  time: string;
  state: "idle" | "busy" | "done";
  focused: boolean;
}> = ({ text, time, state, focused }) => (
  <div
    style={{
      position: "absolute",
      left: NOTEPAD.left,
      bottom: NOTEPAD.bottom,
      width: NOTEPAD.width,
      display: "grid",
      gap: 10,
      padding: 12,
      borderRadius: 6,
      backgroundColor: "rgba(14,13,24,0.94)",
      boxShadow:
        "inset 0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.6)",
    }}
  >
    <header
      style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: COLOR.fg }}>
        New note
      </span>
      <Stamp note>{time}</Stamp>
    </header>
    <div
      style={{
        height: 76,
        padding: "10px 12px",
        borderRadius: 4,
        backgroundColor: "#05060a",
        fontSize: 14,
        lineHeight: 1.45,
        color: text ? COLOR.fg : COLOR.muted,
        boxShadow: focused
          ? "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 2px rgba(155,124,255,0.7)"
          : "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      {text || "What do you want to remember?"}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <span style={BUTTON}>Cancel</span>
      <span
        style={{
          ...SOLID,
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: !text && state === "idle" ? 0.4 : 1,
        }}
      >
        {state === "busy" && <CircleNotch size={14} />}
        {state === "done" && <Check size={14} weight="bold" />}
        {state === "idle" ? "Save" : state === "busy" ? "Saving…" : "Saved"}
      </span>
    </div>
  </div>
);

// Overlays.tsx's QuizOverlay: the quick check at the end of a scene.
export const QuizOverlay: React.FC<{
  question: string;
  choices: string[];
  correct: number;
  glow: number;
  answered: boolean;
}> = ({ question, choices, correct, glow, answered }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      backgroundColor: "rgba(5,6,9,0.93)",
    }}
  >
    <div style={{ width: 520, display: "grid", gap: 10 }}>
      <small style={{ fontSize: 12, color: COLOR.soft }}>
        Quick check, scene 2 of 3
      </small>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          lineHeight: 1.3,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          color: COLOR.fg,
        }}
      >
        {question}
      </h2>
      <Choices choices={choices} correct={correct} glow={glow} big />
      <p
        style={{
          margin: 0,
          minHeight: 21,
          fontSize: 14,
          color: COLOR.secondary,
          opacity: glow,
        }}
      >
        {answered && (
          <>
            <b style={{ fontWeight: 600, color: COLOR.fg }}>Right.</b>{" "}
            {choices[correct]}.
          </>
        )}
      </p>
    </div>
  </div>
);
