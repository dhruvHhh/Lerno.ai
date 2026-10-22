import { interpolate } from "remotion";

import { CLAMP, COLOR, EASE } from "../theme";

// MakingScreen.tsx and SlabStack.tsx, in the main area's pixels: four slabs, Plan at the top and Ready at the
// bottom; the active one lights up and the label beside it follows it down.
export const MAKING = { left: 254, top: 214, width: 640 };

const STEPS = [
  ["Plan", "Planning the scenes"],
  ["Write", "Writing the animation code"],
  ["Render", "Rendering the videos"],
  ["Ready", "Opening your lesson"],
];
const READY = 3;
const CX = 400;
const A = 120;
const H = 60;
const T = 18;
const GAP = 80;
const BASE = 360;
const cy = (step: number) => BASE - (READY - step) * GAP;
const pts = (list: number[][]) => list.map((p) => p.join(",")).join(" ");
const rhombus = (y: number, a: number, h: number) => [
  [CX, y - h],
  [CX + a, y],
  [CX, y + h],
  [CX - a, y],
];

type Look = {
  top: string;
  left?: string;
  right?: string;
  edge: string;
  side?: string;
  inset: string;
  rim: string;
};
const BASE_LOOK: Look = {
  top: "url(#f-top)",
  left: "url(#f-left)",
  right: "url(#f-right)",
  edge: "rgba(255,255,255,.07)",
  side: "rgba(255,255,255,.04)",
  inset: "rgba(255,255,255,.05)",
  rim: "rgba(255,255,255,.13)",
};
const DONE_LOOK: Look = {
  top: "url(#f-top-done)",
  edge: "rgba(183,164,255,.22)",
  inset: "rgba(183,164,255,.14)",
  rim: "rgba(183,164,255,.5)",
};
const LIT_LOOK: Look = {
  top: "url(#f-top-lit)",
  left: "url(#f-left-lit)",
  right: "url(#f-right-lit)",
  edge: "rgba(214,204,255,.5)",
  side: "rgba(214,204,255,.15)",
  inset: "rgba(214,204,255,.4)",
  rim: "#ddd4ff",
};

const Faces: React.FC<{ y: number; look: Look }> = ({ y, look }) => (
  <>
    {look.left && (
      <>
        <polygon
          points={pts([
            [CX - A, y],
            [CX, y + H],
            [CX, y + H + T],
            [CX - A, y + T],
          ])}
          fill={look.left}
          stroke={look.side}
        />
        <polygon
          points={pts([
            [CX, y + H],
            [CX + A, y],
            [CX + A, y + T],
            [CX, y + H + T],
          ])}
          fill={look.right}
          stroke={look.side}
        />
      </>
    )}
    <polygon
      points={pts(rhombus(y, A, H))}
      fill={look.top}
      stroke={look.edge}
    />
    <polygon
      points={pts(rhombus(y, A * 0.7, H * 0.7))}
      fill="none"
      stroke={look.inset}
    />
    <polyline
      points={pts([
        [CX - A, y],
        [CX, y + H],
        [CX + A, y],
      ])}
      fill="none"
      stroke={look.rim}
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  </>
);

// `starts` are the frames each step begins; `frame` is the film's.
export const MakingView: React.FC<{ frame: number; starts: number[] }> = ({
  frame,
  starts,
}) => {
  const step = starts.filter((s) => frame >= s).length - 1;
  const fade = (at: number) =>
    interpolate(frame, [at, at + 24], [0, 1], { ...CLAMP, easing: EASE });
  // The label and spinner glide from one slab to the next.
  const labelY = interpolate(
    frame,
    starts.flatMap((s) => [s, s + 30]),
    starts.flatMap((_, i) => [cy(Math.max(0, i - 1)), cy(i)]),
    { ...CLAMP, easing: EASE },
  );
  // The label swaps while it is faded out, so the old and new words never show together.
  const labelStep = Math.max(
    0,
    starts.filter((s) => frame >= s + 6).length - 1,
  );
  const swap = Math.min(
    ...starts.slice(1).map((s) => Math.min(1, Math.abs(frame - (s + 6)) / 8)),
  );
  const seconds = interpolate(
    frame,
    [starts[0], starts[READY]],
    [0, 112],
    CLAMP,
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(410px 310px at 50% 46%, rgba(122,96,230,0.17), transparent)",
        }}
      />
      <header
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
        }}
      >
        <small style={{ fontSize: 13, color: COLOR.muted }}>High school</small>
        <h1
          style={{
            margin: "4px 0 0",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: COLOR.fg,
          }}
        >
          Area under y = x²
        </h1>
      </header>
      <svg
        viewBox="0 0 800 470"
        style={{
          position: "absolute",
          left: MAKING.left,
          top: MAKING.top,
          width: MAKING.width,
          overflow: "visible",
        }}
      >
        <defs>
          {[
            ["f-top", "#171a27", "#0c0e16"],
            ["f-left", "#0d0f17", "#07080c"],
            ["f-right", "#11131d", "#090a10"],
            ["f-top-done", "#1e1c38", "#11111f"],
            ["f-top-lit", "#5a4bb0", "#2a2356"],
            ["f-left-lit", "#231e48", "#141130"],
            ["f-right-lit", "#2d2659", "#191538"],
          ].map(([id, from, to]) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          ))}
          <radialGradient id="f-glow">
            <stop offset="0" stopColor="#7a60e6" stopOpacity={0.55} />
            <stop offset="1" stopColor="#7a60e6" stopOpacity={0} />
          </radialGradient>
        </defs>
        <polygon
          points={pts(rhombus(BASE + T + 14, A * 1.35, H * 1.35))}
          fill="none"
          stroke="rgba(183,164,255,.12)"
          strokeDasharray="2 6"
        />
        {[0, 1, 2, 3].map((pos) => {
          const s = READY - pos;
          const y = cy(s);
          const lit =
            s === READY
              ? fade(starts[s])
              : fade(starts[s]) * (1 - fade(starts[s + 1]));
          const done = s === READY ? 0 : fade(starts[s + 1]);
          return (
            <g key={s}>
              {pos > 0 &&
                [CX - A, CX + A].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1={y + T}
                    x2={x}
                    y2={y + GAP}
                    stroke="rgba(183,164,255,.12)"
                  />
                ))}
              <ellipse
                cx={CX}
                cy={y + H * 0.4}
                rx={A * 1.4}
                ry={H * 1.3}
                fill="url(#f-glow)"
                opacity={
                  lit * interpolate(Math.sin(frame / 18), [-1, 1], [0.7, 1])
                }
              />
              <Faces y={y} look={BASE_LOOK} />
              <g opacity={done}>
                <Faces y={y} look={DONE_LOOK} />
              </g>
              <g opacity={lit}>
                <Faces y={y} look={LIT_LOOK} />
              </g>
            </g>
          );
        })}
        <g style={{ translate: `0px ${labelY}px` }}>
          <line
            x1={522}
            y1={0}
            x2={576}
            y2={0}
            stroke="rgba(183,164,255,.5)"
            strokeDasharray="3 4"
            strokeDashoffset={-frame / 2}
          />
          <circle
            cx={590}
            cy={0}
            r={10}
            fill="none"
            strokeWidth={2}
            stroke="rgba(183,164,255,.2)"
          />
          <circle
            cx={590}
            cy={0}
            r={10}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            stroke={COLOR.soft}
            strokeDasharray={step === READY ? undefined : "14 40"}
            style={{ rotate: `${frame * 6}deg`, transformOrigin: "590px 0px" }}
          />
          <g opacity={swap}>
            <text x={612} y={-3} fill={COLOR.fg} fontSize={20} fontWeight={600}>
              {STEPS[labelStep][0]}
            </text>
            <text x={612} y={17} fill={COLOR.secondary} fontSize={13}>
              {STEPS[labelStep][1]}
            </text>
          </g>
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: MAKING.top + 390,
          display: "grid",
          justifyItems: "center",
          gap: 6,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: COLOR.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`}{" "}
          <span style={{ color: COLOR.muted }}>so far</span>
        </p>
        <p
          style={{
            margin: 0,
            maxWidth: 380,
            fontSize: 13,
            color: COLOR.secondary,
          }}
        >
          Usually takes about 2 minutes. You can leave this page. We keep making
          your lesson.
        </p>
      </div>
    </>
  );
};
