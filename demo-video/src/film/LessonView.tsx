import { Video } from "@remotion/media";
import {
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";

import {
  Card,
  INPUT_FOCUS,
  INPUT_SHADOW,
  Notepad,
  NOTEPAD,
  Player,
  PLAYER,
  QuizOverlay,
  ScenesPanel,
  SendButton,
  Stamp,
} from "../parts/app";
import {
  CLAMP,
  COLOR,
  EASE,
  popIn,
  popInOut,
  typed,
  wordOpacity,
} from "../theme";
import cues from "./cues.json";
import { Riemann } from "./Riemann";

// The lesson page in the main area's pixels: the player on the left, the panel column beside it.
export const LESSON = { left: 36, top: 30, column: 36 + PLAYER.width + 16 };
// Points the camera and the cursor aim at, in main-area pixels.
export const LESSON_POINTS = {
  video: {
    x: LESSON.left + PLAYER.width / 2,
    y: LESSON.top + PLAYER.videoTop + PLAYER.videoHeight / 2,
  },
  ring: { x: LESSON.column + 8 + 120 - 13, y: LESSON.top + 60 + 4 + 8 + 13 },
  card: { x: LESSON.column + 190, y: LESSON.top + 285 },
  tutorSend: { x: LESSON.column + 343, y: LESSON.top + 503 },
  noteButton: { x: LESSON.left + 599, y: LESSON.top + PLAYER.controlsY },
  save: {
    x: LESSON.left + 314,
    y: LESSON.top + PLAYER.videoTop + PLAYER.videoHeight - NOTEPAD.bottom - 28,
  },
  answer: { x: LESSON.left + 200, y: LESSON.top + 254 },
  // Between the New note box and the note button, so both stay in the shot.
  notes: { x: LESSON.left + 308, y: LESSON.top + 315 },
};

const { lesson, tutor, notes, quiz, clicks, typing } = cues;
// The hook's graph becomes the real clip here; later scene 1 plays its last seconds, ends, and scene 2 runs until
// the tutor opens and pauses it on a clean frame.
const HOOK_CLIP = 430;
const SCENE_1 = { from: 8, done: lesson + 120 };
const SCENE_2 = { at: tutor, from: 5.6, pauseAt: 6.1, paused: tutor + 30 };

const SCENES = [
  {
    title: "Rectangles under the curve",
    seconds: 11,
    still: "stills/scene-1.jpg",
  },
  { title: "Adding the four areas", seconds: 14, still: "stills/scene-2.jpg" },
  { title: "Letting n grow", seconds: 12, still: "stills/scene-3.jpg" },
];
const NARRATION = [
  [
    "Here is y = x² from 0 to 1.",
    "We cut it into four strips, each one quarter wide, and build a rectangle on each.",
  ],
  [
    "Do the same for all four rectangles.",
    "Heights are 1/16, 4/16, 9/16 and 1.",
  ],
];
const QUESTION = "Why do the rectangles stick out above the curve?";
const ANSWER =
  "Each rectangle takes its height from its right edge, where the curve is highest on that strip. So every top sits a little above the curve, and the total comes out slightly too big.";
const NOTE = "Right edges overshoot, so the sum is a bit too big.";
const QUIZ = {
  question:
    "With only 2 strips on 0 to 1 and heights at the right edges, what is the estimate?",
  choices: ["5/4", "5/8", "3/4", "1/8"],
  correct: 1,
};
const EMPTY: React.CSSProperties = {
  margin: 0,
  padding: "32px 10px",
  textAlign: "center",
  fontSize: 13,
  color: COLOR.muted,
};
const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

// `frame` is the film's; `chrome` fades in the page around the film during the opening pull back.
export const LessonView: React.FC<{ frame: number; chrome: number }> = ({
  frame,
  chrome,
}) => {
  const { fps } = useVideoConfig();
  const inLesson = frame >= lesson;
  const second = frame >= SCENE_2.at;

  // The film's time and bar.
  const scene1Seconds = inLesson
    ? interpolate(
        frame,
        [lesson, SCENE_1.done],
        [SCENE_1.from, SCENES[0].seconds],
        CLAMP,
      )
    : interpolate(frame, [HOOK_CLIP, HOOK_CLIP + 120], [2, 4], CLAMP);
  const secondsIn = second
    ? interpolate(
        frame,
        [SCENE_2.at, SCENE_2.paused],
        [SCENE_2.from, SCENE_2.pauseAt],
        CLAMP,
      )
    : scene1Seconds;
  const current = second ? 1 : 0;
  const progress = secondsIn / SCENES[current].seconds;
  const paused = frame >= SCENE_2.paused;
  const bigPlay = paused
    ? interpolate(
        frame,
        [SCENE_2.paused, SCENE_2.paused + 20, clicks.note, clicks.note + 12],
        [0, 1, 1, 0],
        { ...CLAMP, easing: EASE },
      )
    : 0;

  // The tutor.
  const draft =
    frame < clicks.tutorSend
      ? typed(QUESTION, frame, typing[1][0], typing[1][1])
      : "";
  const words = ANSWER.split(" ");
  const answerFrom = clicks.tutorSend + 50;

  // The note: typed, saved ("Saving…", then "Saved" with a tick), then the box empties for the next note.
  const saved = clicks.save + 30;
  const noteText =
    frame < saved ? typed(NOTE, frame, typing[2][0], typing[2][1]) : "";
  const saveState =
    frame < clicks.save
      ? "idle"
      : frame < saved
        ? "busy"
        : frame < saved + 42
          ? "done"
          : "idle";
  // The marker drops onto the bar with a small bounce.
  const marker = interpolate(
    frame,
    [saved, saved + 10, saved + 18],
    [0, 1.25, 1],
    { ...CLAMP, easing: Easing.out(Easing.quad) },
  );

  // The quick check.
  const glow = interpolate(frame, [clicks.answer, clicks.answer + 15], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const quizShown = interpolate(frame, [quiz + 10, quiz + 34], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });

  // The Scenes panel leaves when the tutor opens and comes back for the quick check.
  const panel = popInOut(
    frame,
    frame >= quiz ? quiz + 14 : -100,
    frame >= quiz ? undefined : tutor + 4,
  );
  const column: React.CSSProperties = {
    position: "absolute",
    left: LESSON.column,
    top: LESSON.top,
    transformOrigin: "50% 50%",
  };

  return (
    <>
      <div style={{ position: "absolute", left: LESSON.left, top: LESSON.top }}>
        <Player
          chrome={chrome}
          progress={progress}
          time={`${clock(secondsIn)} / ${clock(SCENES[current].seconds)}`}
          playing={!paused}
          bigPlay={bigPlay}
          markers={[{ at: SCENE_2.pauseAt / SCENES[1].seconds, shown: marker }]}
          narration={NARRATION[current]}
          sentence={inLesson ? 1 : 0}
          video={
            <>
              {!inLesson && (
                <>
                  <Sequence from={HOOK_CLIP - 30} layout="none">
                    <Video
                      src={staticFile("clips/scene-1.mp4")}
                      trimBefore={2 * fps}
                      premountFor={fps}
                      muted
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </Sequence>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: interpolate(
                        frame,
                        [HOOK_CLIP, HOOK_CLIP + 24],
                        [1, 0],
                        CLAMP,
                      ),
                    }}
                  >
                    <Riemann />
                  </div>
                </>
              )}
              <Sequence
                from={lesson - 20}
                durationInFrames={SCENE_2.at - lesson + 30}
                layout="none"
              >
                <Video
                  src={staticFile("clips/scene-1.mp4")}
                  trimBefore={SCENE_1.from * fps}
                  premountFor={fps}
                  muted
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </Sequence>
              <Sequence
                from={SCENE_2.at}
                durationInFrames={SCENE_2.paused - SCENE_2.at + 4}
                layout="none"
              >
                <Video
                  src={staticFile("clips/scene-2.mp4")}
                  trimBefore={SCENE_2.from * fps}
                  premountFor={fps}
                  muted
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: interpolate(
                      frame,
                      [SCENE_2.at, SCENE_2.at + 8],
                      [0, 1],
                      CLAMP,
                    ),
                  }}
                />
              </Sequence>
              {paused && (
                <Img
                  src={staticFile("stills/scene-2-paused.jpg")}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
              )}
            </>
          }
        >
          {frame >= clicks.note && frame < quiz + 16 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: `${NOTEPAD.left}px ${PLAYER.videoHeight - NOTEPAD.bottom}px`,
                ...popInOut(frame, clicks.note + 2, quiz - 4),
              }}
            >
              <Notepad
                text={noteText}
                time={clock(SCENE_2.pauseAt)}
                state={saveState}
                focused={frame >= clicks.note + 10}
              />
            </div>
          )}
          {frame >= quiz && (
            <div style={{ position: "absolute", inset: 0, opacity: quizShown }}>
              <QuizOverlay
                question={QUIZ.question}
                choices={QUIZ.choices}
                correct={QUIZ.correct}
                glow={glow}
                answered={frame >= clicks.answer}
              />
            </div>
          )}
        </Player>
      </div>

      {(frame < tutor + 8 || frame >= quiz) && (
        <div
          style={{
            ...column,
            ...panel,
            opacity: chrome * panel.opacity,
          }}
        >
          <ScenesPanel
            frame={frame}
            scenes={SCENES}
            current={current}
            fraction={inLesson && !second ? progress : second ? progress : 0.25}
            doneAt={inLesson ? SCENE_1.done : 99999}
          />
        </div>
      )}

      {frame >= tutor && frame < notes + 8 && (
        <div style={{ ...column, ...popInOut(frame, tutor + 14, notes - 4) }}>
          <Card
            title="Tutor"
            chip={<Stamp>Scene 2 · {clock(SCENE_2.pauseAt)}</Stamp>}
            footer={
              <div
                style={{
                  position: "relative",
                  margin: "0 14px 14px",
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#05060a",
                  boxShadow:
                    frame >= typing[1][0] - 12 && frame < clicks.tutorSend
                      ? INPUT_FOCUS
                      : INPUT_SHADOW,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 18,
                  fontSize: 14,
                  color: draft ? COLOR.fg : COLOR.muted,
                }}
              >
                {draft || "Ask about this moment"}
                <span style={{ position: "absolute", top: 6, right: 6 }}>
                  <SendButton active={draft.length > 0} size={34} />
                </span>
              </div>
            }
          >
            {frame < clicks.tutorSend + 10 && (
              <p
                style={{
                  ...EMPTY,
                  opacity: interpolate(
                    frame,
                    [clicks.tutorSend, clicks.tutorSend + 10],
                    [1, 0],
                    CLAMP,
                  ),
                }}
              >
                Ask about what's on screen. The tutor knows which scene you're
                in and the moment you paused at.
              </p>
            )}
            {frame >= clicks.tutorSend && (
              <p
                style={{
                  margin: 0,
                  maxWidth: "85%",
                  justifySelf: "end",
                  padding: "9px 13px",
                  borderRadius: "14px 14px 4px 14px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  fontSize: 14,
                  color: COLOR.fg,
                  transformOrigin: "100% 100%",
                  ...popIn(frame, clicks.tutorSend, 16),
                }}
              >
                {QUESTION}
              </p>
            )}
            {frame >= clicks.tutorSend + 8 && frame < answerFrom + 6 && (
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  opacity: interpolate(
                    frame,
                    [
                      clicks.tutorSend + 8,
                      clicks.tutorSend + 16,
                      answerFrom - 2,
                      answerFrom + 6,
                    ],
                    [0, 1, 1, 0],
                    CLAMP,
                  ),
                }}
              >
                {[0, 1, 2].map((k) => (
                  <i
                    key={k}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: COLOR.muted,
                      opacity: interpolate(
                        Math.sin((frame - k * 8) / 7),
                        [-1, 1],
                        [0.35, 1],
                      ),
                    }}
                  />
                ))}
              </div>
            )}
            {frame >= answerFrom && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.625,
                  color: COLOR.secondary,
                }}
              >
                {words.map((word, i) => (
                  <span
                    key={i}
                    style={{ opacity: wordOpacity(frame, answerFrom, i, 2) }}
                  >
                    {word}{" "}
                  </span>
                ))}
              </p>
            )}
          </Card>
        </div>
      )}

      {frame >= notes && frame < quiz + 8 && (
        <div style={{ ...column, ...popInOut(frame, notes + 14, quiz - 4) }}>
          <Card
            title="Notes"
            chip={
              frame >= saved && (
                <span
                  style={{
                    fontSize: 12,
                    color: COLOR.soft,
                    opacity: interpolate(
                      frame,
                      [saved, saved + 10],
                      [0, 1],
                      CLAMP,
                    ),
                  }}
                >
                  1 saved
                </span>
              )
            }
          >
            {frame < saved + 10 && (
              <p
                style={{
                  ...EMPTY,
                  opacity: interpolate(
                    frame,
                    [saved, saved + 10],
                    [1, 0],
                    CLAMP,
                  ),
                }}
              >
                No notes yet. Use the note button in the player to save a
                thought at the current moment.
              </p>
            )}
            {frame >= saved && (
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  transformOrigin: "50% 0",
                  ...popIn(frame, saved + 4, 20),
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 500,
                    color: COLOR.muted,
                  }}
                >
                  Scene 2: Adding the four areas
                </h3>
                <div
                  style={{
                    display: "grid",
                    gap: 4,
                    padding: "10px 12px",
                    borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <Stamp note>{clock(SCENE_2.pauseAt)}</Stamp>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: COLOR.fg,
                    }}
                  >
                    {NOTE}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};
