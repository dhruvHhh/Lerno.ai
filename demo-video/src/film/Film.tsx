import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { Background } from "../parts/Background";
import { Cursor } from "../parts/Cursor";
import { LogoMark } from "../parts/LogoMark";
import { blurIn, CLAMP, COLOR, EASE, FONT, typed } from "../theme";
import { APP, AppWindow, MAIN, type RowState, toWorld } from "./AppWindow";
import { ASK_POINTS, AskView } from "./AskView";
import { Camera, type Shot } from "./Camera";
import { Captions } from "./Captions";
import cues from "./cues.json";
import { FilmLook } from "./FilmLook";
import { LESSON_POINTS, LessonView } from "./LessonView";
import { MakingView } from "./MakingView";
import { Wall } from "./Wall";

export const FILM_FRAMES = cues.length;

const {
  pull,
  ask,
  making,
  lesson,
  tutor,
  notes,
  quiz,
  wall,
  lockup,
  clicks,
  typing,
} = cues;

// A point in the main area (beside the sidebar) as a point in the world.
const inMain = (p: { x: number; y: number }) => toWorld(MAIN.left + p.x, p.y);

// A shot that puts a world point at a spot on the screen (lower than centre by default, clear of the captions).
const focus = (
  p: { x: number; y: number },
  scale: number,
  screenX = 960,
  screenY = 600,
): Shot => ({
  x: p.x - (screenX - 960) / scale,
  y: p.y - (screenY - 540) / scale,
  scale,
});

// The whole app in view, sitting under the captions.
const REST: Shot = { x: 960, y: 478, scale: 0.82 };
const VIDEO = inMain(LESSON_POINTS.video);
const FILL = 1920 / (680 * APP.scale);

// Where the camera is at each moment after the opening; it glides between these.
const KEYS: { at: number; shot: Shot }[] = [
  { at: ask, shot: REST },
  { at: clicks.newLesson - 8, shot: focus(toWorld(146, 84), 1.7, 700, 640) },
  { at: clicks.newLesson + 6, shot: focus(toWorld(146, 84), 1.7, 700, 640) },
  {
    at: typing[0][0] - 20,
    shot: focus(inMain(ASK_POINTS.box), 1.55, 960, 620),
  },
  { at: clicks.send + 6, shot: focus(inMain(ASK_POINTS.box), 1.55, 960, 620) },
  { at: making + 50, shot: focus(inMain({ x: 574, y: 420 }), 1.2, 960, 620) },
  { at: lesson - 14, shot: focus(inMain({ x: 574, y: 420 }), 1.2, 960, 620) },
  { at: lesson + 40, shot: REST },
  { at: lesson + 80, shot: REST },
  { at: lesson + 118, shot: focus(inMain(LESSON_POINTS.ring), 2.6, 1180, 620) },
  { at: tutor + 10, shot: focus(inMain(LESSON_POINTS.ring), 2.6, 1180, 620) },
  { at: tutor + 60, shot: focus(inMain(LESSON_POINTS.card), 1.2, 1000, 640) },
  { at: notes - 8, shot: focus(inMain(LESSON_POINTS.card), 1.2, 1000, 640) },
  { at: notes + 35, shot: focus(inMain(LESSON_POINTS.notes), 1.7, 960, 670) },
  {
    at: clicks.save + 37,
    shot: focus(inMain(LESSON_POINTS.notes), 1.7, 960, 670),
  },
  { at: quiz - 8, shot: focus(inMain({ x: 560, y: 330 }), 0.95, 960, 600) },
  { at: quiz + 40, shot: focus(VIDEO, 1.8, 960, 650) },
  { at: wall - 10, shot: focus(VIDEO, 1.8, 960, 650) },
  { at: lockup - 20, shot: { x: 960, y: 540, scale: 0.3 } },
  { at: cues.length, shot: { x: 960, y: 540, scale: 0.28 } },
];

const GLIDE = Easing.bezier(0.65, 0, 0.35, 1);

// Between two keys the camera eases, zooms evenly (in log space) and leans a little into the move, like a camera
// on a crane, then settles level.
const glide = (frame: number): Shot => {
  const i = Math.max(
    0,
    KEYS.findIndex((k, n) => frame < (KEYS[n + 1]?.at ?? Infinity)),
  );
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  if (a === b || frame <= a.at) return a.shot;
  const t = GLIDE(Math.min(1, (frame - a.at) / (b.at - a.at)));
  const scale = a.shot.scale * (b.shot.scale / a.shot.scale) ** t;
  const lean = Math.sin(Math.PI * t);
  const zoom = Math.sqrt(a.shot.scale * b.shot.scale);
  return {
    x: a.shot.x + (b.shot.x - a.shot.x) * t,
    y: a.shot.y + (b.shot.y - a.shot.y) * t,
    scale,
    rotateY:
      Math.max(-8, Math.min(8, ((a.shot.x - b.shot.x) * zoom) / 120)) * lean,
    rotateX:
      Math.max(-5, Math.min(5, ((b.shot.y - a.shot.y) * zoom) / 160)) * lean,
  };
};

const CAPTIONS = [
  { text: "Maths you can see.", from: pull + 30, to: ask - 10 },
  { text: "Ask anything.", from: ask + 4, to: making - 10 },
  { text: "Watch it being made.", from: making + 4, to: lesson - 14 },
  { text: "Learn it your way.", from: lesson + 4, to: tutor - 8 },
  { text: "Ask about the moment.", from: tutor + 6, to: notes - 6 },
  { text: "Pin a thought to the timeline.", from: notes + 6, to: quiz - 6 },
  { text: "Check you got it.", from: quiz + 6, to: wall - 6 },
  { text: "Any topic. Any level.", from: wall + 6, to: lockup - 20 },
];

const fade = (frame: number, at: number, length = 24) =>
  interpolate(frame, [at, at + length], [0, 1], { ...CLAMP, easing: EASE });

// Lerno's demo film: one unbroken camera move from a textbook line to the whole app, and out to every lesson.
export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The opening: inside the film, a slow drift while the graph builds, then a spring-driven pull back through 3D.
  const drift = interpolate(frame, [0, pull], [1.0, 0.93], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  const back = spring({
    frame: frame - pull,
    fps,
    config: { damping: 22, mass: 1.1, stiffness: 70 },
  });
  const swing = Math.sin(Math.PI * Math.min(1, back));
  const shot: Shot =
    frame < ask
      ? {
          x: interpolate(back, [0, 1], [VIDEO.x, REST.x]),
          y: interpolate(back, [0, 1], [VIDEO.y, REST.y]),
          scale: interpolate(back, [0, 1], [FILL * drift, REST.scale]),
          rotateY: -13 * swing,
          rotateX: 6 * swing,
        }
      : glide(frame);
  const chrome = interpolate(back, [0.15, 0.7], [0, 1], CLAMP);

  // Which page the main area shows: the lesson, then New lesson, then the lesson being made, then the lesson again.
  const toAsk = fade(frame, clicks.newLesson + 4);
  const toMaking = fade(frame, clicks.send + 10, 30);
  const toLesson = fade(frame, lesson - 10, 30);
  const views = {
    lesson: Math.max(1 - toAsk, toLesson),
    ask: toAsk * (1 - toMaking),
    making: toMaking * (1 - toLesson),
  };
  const rowState: RowState =
    frame < clicks.newLesson
      ? "active"
      : frame < clicks.send
        ? "idle"
        : frame < lesson
          ? "making"
          : "active";
  const askText = typed(
    "Why is the area under y = x² equal to 1/3?",
    frame,
    typing[0][0],
    typing[0][1],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: chrome }}>
        <Background />
      </AbsoluteFill>
      <Camera shot={shot}>
        <Wall shown={fade(frame, wall, 50)} />
        <AppWindow
          top={rowState}
          pressed={interpolate(
            frame,
            [clicks.newLesson, clicks.newLesson + 4, clicks.newLesson + 12],
            [1, 0.96, 1],
            CLAMP,
          )}
          lessonsLeft={frame < clicks.send ? 2 : 1}
          chrome={chrome}
        >
          {views.lesson > 0 && (
            <div
              style={{ position: "absolute", inset: 0, opacity: views.lesson }}
            >
              <LessonView frame={frame} chrome={chrome} />
            </div>
          )}
          {views.ask > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: views.ask,
                scale: 0.985 + 0.015 * toAsk,
              }}
            >
              <AskView
                text={askText}
                focused={frame >= typing[0][0] - 20 && frame < clicks.send}
                level={fade(frame, clicks.level, 22)}
                caret={
                  frame >= typing[0][0] - 20 &&
                  frame < clicks.send &&
                  Math.floor(frame / 16) % 2 === 0
                }
                ready={askText.length > 0 && frame >= typing[0][1]}
                sendScale={interpolate(
                  frame,
                  [clicks.send, clicks.send + 5, clicks.send + 12],
                  [1, 0.94, 1],
                  CLAMP,
                )}
              />
            </div>
          )}
          {views.making > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: views.making,
                scale: 0.985 + 0.015 * toMaking,
              }}
            >
              <MakingView
                frame={frame}
                starts={[making + 20, making + 80, making + 140, making + 200]}
              />
            </div>
          )}
        </AppWindow>
        <Cursor
          zoom={shot.scale}
          showFrom={ask + 30}
          hideFrom={making + 10}
          path={[
            { frame: ask + 30, ...toWorld(420, 360) },
            { frame: clicks.newLesson - 8, ...toWorld(146, 84) },
            { frame: clicks.newLesson, ...toWorld(146, 84), click: true },
            {
              frame: typing[0][0],
              ...inMain({
                x: ASK_POINTS.send.x + 60,
                y: ASK_POINTS.send.y + 70,
              }),
            },
            { frame: clicks.level - 10, ...inMain(ASK_POINTS.highSchool) },
            {
              frame: clicks.level,
              ...inMain(ASK_POINTS.highSchool),
              click: true,
            },
            { frame: clicks.send - 10, ...inMain(ASK_POINTS.send) },
            { frame: clicks.send, ...inMain(ASK_POINTS.send), click: true },
          ]}
        />
        <Cursor
          zoom={shot.scale}
          showFrom={typing[1][0] + 20}
          hideFrom={clicks.answer + 40}
          path={[
            {
              frame: typing[1][0] + 20,
              ...inMain({
                x: LESSON_POINTS.tutorSend.x - 120,
                y: LESSON_POINTS.tutorSend.y + 60,
              }),
            },
            {
              frame: clicks.tutorSend - 10,
              ...inMain(LESSON_POINTS.tutorSend),
            },
            {
              frame: clicks.tutorSend,
              ...inMain(LESSON_POINTS.tutorSend),
              click: true,
            },
            { frame: clicks.note - 12, ...inMain(LESSON_POINTS.noteButton) },
            {
              frame: clicks.note,
              ...inMain(LESSON_POINTS.noteButton),
              click: true,
            },
            { frame: clicks.save - 12, ...inMain(LESSON_POINTS.save) },
            { frame: clicks.save, ...inMain(LESSON_POINTS.save), click: true },
            { frame: clicks.answer - 14, ...inMain(LESSON_POINTS.answer) },
            {
              frame: clicks.answer,
              ...inMain(LESSON_POINTS.answer),
              click: true,
            },
          ]}
        />
      </Camera>

      <Captions frame={frame} captions={CAPTIONS} />

      <AbsoluteFill
        style={{
          backgroundColor: COLOR.bg,
          opacity: 0.86 * fade(frame, lockup, 30),
        }}
      />
      {frame >= lockup && (
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <div style={{ display: "grid", justifyItems: "center", gap: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 36,
                ...blurIn(frame, lockup + 14, 30),
              }}
            >
              <LogoMark size={150} />
              <span
                style={{
                  fontSize: 150,
                  fontWeight: 620,
                  letterSpacing: "-0.04em",
                  color: COLOR.fg,
                }}
              >
                Lerno
              </span>
            </div>
            <span
              style={{
                fontSize: 46,
                color: COLOR.secondary,
                letterSpacing: "-0.01em",
                ...blurIn(frame, lockup + 34, 30),
              }}
            >
              Ask any maths question. Watch it become a{" "}
              <span style={{ color: COLOR.soft }}>short animated lesson.</span>
            </span>
          </div>
        </AbsoluteFill>
      )}

      <FilmLook />

      <Audio src={staticFile("film-music.wav")} premountFor={fps} />
      {[pull - 4, wall - 6].map((at) => (
        <Sequence key={at} name="Whoosh" from={at} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
        </Sequence>
      ))}
      {Object.values(clicks).map((at) => (
        <Sequence key={at} name="Click" from={at} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.55} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
