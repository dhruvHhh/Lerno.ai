import {
  INPUT_FOCUS,
  INPUT_SHADOW,
  RAISED_KEY,
  SendButton,
} from "../parts/app";
import { BRAND_GRADIENT, COLOR } from "../theme";

// NewLesson.tsx, in the main area's pixels: the heading, the ask box, and the level switch.
export const ASK = { width: 640, left: 254, top: 250, optionWidth: 96 };
// Points the camera and the cursor aim at, in main-area pixels.
export const ASK_POINTS = {
  box: { x: ASK.left + ASK.width / 2, y: ASK.top + 134 },
  send: { x: ASK.left + 612, y: ASK.top + 134 },
  highSchool: { x: ASK.left + 9 + ASK.optionWidth * 1.5, y: ASK.top + 193 },
};

const LEVELS = ["School", "High school", "College"];

type Props = {
  text: string;
  focused: boolean;
  // Where the level key sits, from 0 (School) to 1 (High school).
  level: number;
  caret: boolean;
  ready: boolean;
  sendScale: number;
};

export const AskView: React.FC<Props> = ({
  text,
  focused,
  level,
  caret,
  ready,
  sendScale,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(450px 260px at 50% 30%, rgba(122,96,230,0.16), transparent)",
      }}
    />
    <section
      style={{
        position: "absolute",
        left: ASK.left,
        top: ASK.top,
        width: ASK.width,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 40,
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: COLOR.fg,
        }}
      >
        What do you want to{" "}
        <span
          style={{
            backgroundImage: BRAND_GRADIENT,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          understand?
        </span>
      </h1>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 15,
          lineHeight: "22px",
          color: COLOR.secondary,
        }}
      >
        Ask about any maths idea. We'll animate it into a short lesson.
      </p>
      <div
        style={{
          position: "relative",
          height: 56,
          marginTop: 30,
          borderRadius: 28,
          backgroundColor: focused ? "#08090f" : "#05060a",
          boxShadow: focused ? INPUT_FOCUS : INPUT_SHADOW,
          display: "flex",
          alignItems: "center",
          paddingLeft: 26,
          fontSize: 16,
          textAlign: "left",
          color: text ? COLOR.fg : COLOR.muted,
        }}
      >
        {text || "How do eigenvectors stay on their own line?"}
        {caret && (
          <span
            style={{
              width: 1.5,
              height: 20,
              marginLeft: 1,
              backgroundColor: COLOR.soft,
            }}
          />
        )}
        <span
          style={{ position: "absolute", top: 8, right: 8, scale: sendScale }}
        >
          <SendButton active={text.length > 0} size={40} glow={ready} />
        </span>
      </div>
      <div style={{ marginTop: 14, padding: "0 6px", display: "flex" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            padding: 3,
            borderRadius: 11,
            backgroundColor: "rgba(5,6,10,0.8)",
            boxShadow:
              "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              ...RAISED_KEY,
              position: "absolute",
              top: 3,
              bottom: 3,
              left: 3,
              width: ASK.optionWidth,
              translate: `${level * ASK.optionWidth}px 0px`,
            }}
          />
          {LEVELS.map((name, i) => (
            <span
              key={name}
              style={{
                position: "relative",
                width: ASK.optionWidth,
                padding: "6px 0",
                color: Math.round(level) === i ? COLOR.fg : COLOR.muted,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  </>
);
