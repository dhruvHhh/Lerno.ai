import type { ReactNode } from "react";

export type Shot = {
  x: number;
  y: number;
  scale: number;
  rotateX?: number;
  rotateY?: number;
};

// One virtual camera over a single scene. The world is laid out once at 1920×1080; the camera looks at the point
// (x, y) of that world, zoomed by `scale` and tilted in 3D, so every move is continuous and nothing ever cuts.
export const Camera: React.FC<{ shot: Shot; children: ReactNode }> = ({
  shot,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      perspective: 1800,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin: "0 0",
        transformStyle: "preserve-3d",
        transform: `translate(960px, 540px) rotateX(${shot.rotateX ?? 0}deg) rotateY(${shot.rotateY ?? 0}deg) scale(${shot.scale}) translate(${-shot.x}px, ${-shot.y}px)`,
      }}
    >
      {children}
    </div>
  </div>
);
