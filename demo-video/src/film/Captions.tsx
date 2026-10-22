import { AbsoluteFill, interpolate } from "remotion";

import { LogoMark } from "../parts/LogoMark";
import { CLAMP, COLOR, EASE, FONT } from "../theme";

export type Caption = { text: string; from: number; to: number };

// The film's captions sit on the screen, not in the world, so they stay still and readable while the camera moves.
// Each line rises out of a mask and leaves upward; the mark stays while any caption shows.
export const Captions: React.FC<{ frame: number; captions: Caption[] }> = ({
  frame,
  captions,
}) => {
  const first = captions[0].from;
  const last = captions[captions.length - 1].to;
  const mark = interpolate(
    frame,
    [first, first + 20, last, last + 16],
    [0, 1, 1, 0],
    { ...CLAMP, easing: EASE },
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* A soft dark band at the top keeps the words readable over the app. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 320,
          background:
            `linear-gradient(${COLOR.bg} 55%, transparent)`,
          opacity: mark,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 54,
          height: 84,
          display: "flex",
          alignItems: "center",
          gap: 22,
          fontFamily: FONT,
        }}
      >
        <LogoMark
          size={64}
          style={{ opacity: mark, scale: 0.85 + 0.15 * mark }}
        />
        <div
          style={{
            position: "relative",
            height: 84,
            width: 1500,
            overflow: "hidden",
          }}
        >
          {captions.map((c) => {
            const rise = interpolate(frame, [c.from, c.from + 30], [1, 0], {
              ...CLAMP,
              easing: EASE,
            });
            const leave = interpolate(frame, [c.to, c.to + 18], [0, -1], {
              ...CLAMP,
              easing: EASE,
            });
            if (frame < c.from || frame > c.to + 18) return null;
            return (
              <span
                key={c.text}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  whiteSpace: "nowrap",
                  fontSize: 72,
                  lineHeight: "84px",
                  fontWeight: 620,
                  letterSpacing: "-0.04em",
                  color: COLOR.fg,
                  translate: `0px ${(rise + leave) * 100}%`,
                }}
              >
                {c.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
