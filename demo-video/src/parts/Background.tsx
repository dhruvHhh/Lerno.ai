import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { COLOR } from "../theme";

// The same grid and violet glow as the website banner; the glow breathes slowly.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(900px 480px at 50% 48%, rgba(122,96,230,0.26), transparent 70%)",
          opacity: interpolate(Math.sin(frame / 50), [-1, 1], [0.75, 1]),
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(183,164,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(183,164,255,0.06) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(60% 70% at 50% 50%, #000 30%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
