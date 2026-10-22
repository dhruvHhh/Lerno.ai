import { interpolate, useCurrentFrame } from "remotion";

import { CLAMP, EASE } from "../theme";

export type Waypoint = { frame: number; x: number; y: number; click?: boolean };

// A pointer that glides between waypoints and dips when it clicks. `zoom` is the camera's when the pointer lives in
// the film's world: it is counter-scaled so it stays the same size on screen.
export const Cursor: React.FC<{
  path: Waypoint[];
  showFrom: number;
  hideFrom?: number;
  zoom?: number;
}> = ({ path, showFrom, hideFrom = Infinity, zoom = 1 }) => {
  const frame = useCurrentFrame();
  const frames = path.map((p) => p.frame);
  const x = interpolate(
    frame,
    frames,
    path.map((p) => p.x),
    { ...CLAMP, easing: EASE },
  );
  const y = interpolate(
    frame,
    frames,
    path.map((p) => p.y),
    { ...CLAMP, easing: EASE },
  );
  const press = path
    .filter((p) => p.click)
    .reduce(
      (s, p) =>
        Math.min(
          s,
          interpolate(
            frame,
            [p.frame, p.frame + 4, p.frame + 10],
            [1, 0.82, 1],
            CLAMP,
          ),
        ),
      1,
    );

  return (
    <svg
      width={44}
      height={44}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: press / zoom,
        // The tip of the arrow, so it stays on its target while it scales.
        transformOrigin: "7px 5.5px",
        opacity:
          interpolate(frame, [showFrom, showFrom + 10], [0, 1], CLAMP) *
          (frame < hideFrom
            ? 1
            : interpolate(frame, [hideFrom, hideFrom + 12], [1, 0], CLAMP)),
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
      }}
    >
      <path
        d="M4 3l15 8.5-6.6 1.6L9.6 20z"
        fill="#f5f5f7"
        stroke="#050609"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
};
