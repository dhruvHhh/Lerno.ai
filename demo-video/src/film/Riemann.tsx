import { Easing, interpolate, useCurrentFrame } from "remotion";

import { CLAMP, COLOR, EASE, FONT } from "../theme";
import cues from "./cues.json";
import { Equation } from "./Equation";

// Drawn in the lesson video's own box (680×383), in the look of Lerno's Manim scenes.
const O = { x: 230, y: 340 };
const W = 400;
const H = 260;
const CURVE = "#7cc4ff";
const STRIP = "#5fd3b4";

// When each set of strips arrives (on the music's beats), and the area it gives with right edges.
export const STRIPS = [
  { n: 4, at: cues.strips[0], area: "0.47" },
  { n: 8, at: cues.strips[1], area: "0.40" },
  { n: 16, at: cues.strips[2], area: "0.37" },
  { n: 64, at: cues.strips[3], area: "0.34" },
];
export const SMOOTH_AT = cues.smooth;

const px = (t: number) => O.x + W * t;
const py = (v: number) => O.y - H * v;
const CURVE_PATH = Array.from({ length: 61 }, (_, i) => i / 60)
  .map((t, i) => `${i ? "L" : "M"}${px(t).toFixed(1)} ${py(t * t).toFixed(1)}`)
  .join(" ");

const grow = (frame: number, start: number) =>
  interpolate(frame, [start, start + 18], [0, 1], { ...CLAMP, easing: EASE });

// The textbook line comes alive: the x² lights up, the line moves aside as the graph's caption, the curve draws,
// and ever thinner strips fill the area until it is smooth and equals the 1/3 the book promised.
export const Riemann: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [54, 74], [0, 1], { ...CLAMP, easing: EASE });
  const aside = interpolate(frame, [84, 124], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const axes = interpolate(frame, [96, 126], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const curve = interpolate(frame, [110, 160], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const smooth = interpolate(frame, [SMOOTH_AT, SMOOTH_AT + 20], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const set = [...STRIPS].reverse().find((s) => frame >= s.at);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
        fontFamily: FONT,
      }}
    >
      <style>{`.xsq { color: var(--xsq); text-shadow: 0 0 var(--xsq-glow) rgba(183,164,255,0.9); }`}</style>
      <div
        style={
          {
            position: "absolute",
            left: interpolate(aside, [0, 1], [232, 30]),
            top: interpolate(aside, [0, 1], [150, 24]),
            scale: 1 - 0.38 * aside,
            transformOrigin: "0 0",
            color:
              aside > 0
                ? `rgb(${Math.round(107 + 60 * aside)},${Math.round(110 + 60 * aside)},${Math.round(124 + 60 * aside)})`
                : "#6b6e7c",
            opacity: interpolate(frame, [6, 30], [0, 1], CLAMP),
            "--xsq":
              glow > 0
                ? `rgb(${Math.round(107 + 76 * glow)},${Math.round(110 + 54 * glow)},${Math.round(124 + 131 * glow)})`
                : "#6b6e7c",
            "--xsq-glow": `${18 * glow * (1 - 0.6 * aside)}px`,
          } as React.CSSProperties
        }
      >
        <Equation
          tex={String.raw`\int_0^1 \htmlClass{xsq}{x^2}\,dx = \frac{1}{3}`}
          fontSize={34}
        />
      </div>

      <svg
        viewBox="0 0 680 383"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <g stroke="#6f7486" strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path
            d={`M${O.x - 20} ${O.y} H${O.x + W + 40}`}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - axes}
          />
          <path
            d={`M${O.x} ${O.y + 14} V${O.y - H - 30}`}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - axes}
          />
        </g>
        <g fill="#8a8fa3" fontSize={11} textAnchor="middle" opacity={axes}>
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <text key={t} x={px(t)} y={O.y + 22}>
              {t}
            </text>
          ))}
        </g>

        {STRIPS.map((s, k) => {
          // Each set replaces the one before at once: every old strip splits, and the halves slide to their own
          // heights. Only the last set fades, into the smooth area.
          const next = STRIPS[k + 1]?.at ?? Infinity;
          const leave = interpolate(
            frame,
            [SMOOTH_AT, SMOOTH_AT + 20],
            [1, 0],
            CLAMP,
          );
          if (frame < s.at || frame >= next || leave === 0) return null;
          const before = STRIPS[k - 1]?.n;
          return (
            <g key={s.n} opacity={leave}>
              {Array.from({ length: s.n }, (_, i) => {
                const h = H * ((i + 1) / s.n) ** 2;
                const from = before
                  ? H * ((Math.floor((i * before) / s.n) + 1) / before) ** 2
                  : 0;
                const t = grow(frame, s.at + (before ? 0 : (i / s.n) * 10));
                const height = from + (h - from) * t;
                return (
                  <rect
                    key={i}
                    x={px(i / s.n)}
                    y={O.y - height}
                    width={W / s.n}
                    height={height}
                    fill="rgba(95,211,180,0.2)"
                    stroke={STRIP}
                    strokeWidth={s.n > 16 ? 0.4 : 1.2}
                  />
                );
              })}
            </g>
          );
        })}
        <path
          d={`${CURVE_PATH} V${O.y} H${O.x} Z`}
          fill="rgba(95,211,180,0.28)"
          opacity={smooth}
        />
        <path
          d={CURVE_PATH}
          fill="none"
          stroke={CURVE}
          strokeWidth={2.6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - curve}
        />
      </svg>

      {set && (
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 30,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
            opacity: grow(frame, STRIPS[0].at),
          }}
        >
          <div style={{ fontSize: 15, color: COLOR.secondary }}>
            {frame >= SMOOTH_AT ? "n → ∞" : `n = ${set.n}`}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 26,
              fontWeight: 600,
              color: frame >= SMOOTH_AT ? COLOR.soft : COLOR.fg,
            }}
          >
            {frame >= SMOOTH_AT ? "= 1/3" : `≈ ${set.area}`}
          </div>
        </div>
      )}
    </div>
  );
};
