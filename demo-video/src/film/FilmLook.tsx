import { AbsoluteFill } from "remotion";

// A soft vignette that draws the eye to the middle. (A moving film grain looked good but made the video file about
// twenty times bigger, since random noise cannot be compressed.)
export const FilmLook: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55))",
      pointerEvents: "none",
    }}
  />
);
