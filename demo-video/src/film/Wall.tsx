import { Img, staticFile } from "remotion";

import { COLOR, FONT } from "../theme";
import { APP } from "./AppWindow";

// Real lessons Lerno has made, around the app; the camera pulls back until the app is one of them.
const TILES = [
  { still: "wall/vectors.jpg", title: "Vectors, tip to tail", level: "School" },
  {
    still: "wall/pythagoras-squares.jpg",
    title: "Why Pythagoras works",
    level: "School",
  },
  { still: "wall/sine.jpg", title: "The slope of sin x", level: "College" },
  {
    still: "wall/strips-shrink.jpg",
    title: "Letting the strips shrink",
    level: "High school",
  },
  {
    still: "wall/four-triangles.jpg",
    title: "Four triangles, one square",
    level: "School",
  },
  {
    still: "wall/area-rectangles.jpg",
    title: "Area as rectangles",
    level: "High school",
  },
  {
    still: "wall/general-rule.jpg",
    title: "The general rule",
    level: "School",
  },
  {
    still: "wall/area.jpg",
    title: "Thinner slices, exact area",
    level: "College",
  },
];
const STEP = {
  x: APP.width * APP.scale + 120,
  y: APP.height * APP.scale + 120,
};

export const Wall: React.FC<{ shown: number }> = ({ shown }) => {
  const spots = [-1, 0, 1]
    .flatMap((row) => [-1, 0, 1].map((col) => ({ row, col })))
    .filter((s) => s.row || s.col);
  return (
    <>
      {spots.map(({ row, col }, i) => {
        const tile = TILES[i];
        return (
          <div
            key={tile.still}
            style={{
              position: "absolute",
              left: APP.left + col * STEP.x,
              top: APP.top + row * STEP.y,
              width: APP.width * APP.scale,
              height: APP.height * APP.scale,
              borderRadius: 28,
              overflow: "hidden",
              backgroundColor: "#000",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.08)",
              fontFamily: FONT,
              opacity: shown,
            }}
          >
            <Img
              src={staticFile(tile.still)}
              style={{ width: "100%", height: "88%", objectFit: "cover" }}
            />
            <div
              style={{
                height: "12%",
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "0 48px",
                backgroundColor: COLOR.surface,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: COLOR.fg,
                }}
              >
                {tile.title}
              </span>
              <span style={{ fontSize: 40, color: COLOR.muted }}>
                {tile.level}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};
