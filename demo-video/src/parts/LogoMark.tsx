import { useId } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Copied from the app's logo (frontend/src/components/brand): the visible faces of the L, in a 256×256 box.
const TALL = [
  { tone: "side", points: "117.8,36.7 71.6,63.3 71.6,220.1 117.8,193.5" },
  { tone: "top", points: "117.8,36.7 71.6,10.0 25.5,36.7 71.6,63.3" },
  { tone: "front", points: "25.5,193.5 71.6,220.1 71.6,63.3 25.5,36.7" },
];
const FLAT = [
  { tone: "side", points: "230.5,166.0 184.4,192.7 184.4,246.0 230.5,219.3" },
  { tone: "top", points: "230.5,166.0 117.8,101.0 117.8,154.3 184.4,192.7" },
  {
    tone: "front",
    points: "184.4,246.0 184.4,192.7 117.8,154.3 117.8,193.5 105.6,200.5",
  },
];
const TONES = {
  front: ["#a996ff", "#e2b6ff"],
  top: ["#c3b6ff", "#ebccff"],
  side: ["#7056da", "#8763da"],
};

type Props = {
  size: number;
  // When set, the two blocks drop into place starting at this frame.
  buildFrom?: number;
  style?: React.CSSProperties;
};

export const LogoMark: React.FC<Props> = ({ size, buildFrom, style }) => {
  const id = useId();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = (delay: number) =>
    buildFrom === undefined
      ? 1
      : spring({
          frame: frame - buildFrom - delay,
          fps,
          config: { damping: 14, mass: 0.7 },
        });
  const block = (faces: typeof TALL, delay: number) => {
    const t = drop(delay);
    return (
      <g
        style={{
          translate: `0px ${interpolate(t, [0, 1], [-90, 0])}px`,
          opacity: Math.min(1, t * 2),
        }}
      >
        {faces.map(({ tone, points }) => (
          <polygon
            key={points}
            points={points}
            fill={`url(#${id}-${tone})`}
            stroke={`url(#${id}-${tone})`}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ))}
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      style={{ overflow: "visible", ...style }}
    >
      <defs>
        {Object.entries(TONES).map(([tone, [from, to]]) => (
          <linearGradient
            key={tone}
            id={`${id}-${tone}`}
            gradientUnits="userSpaceOnUse"
            x1="25.5"
            x2="230.5"
          >
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
      </defs>
      {block(FLAT, 8)}
      {block(TALL, 0)}
    </svg>
  );
};
