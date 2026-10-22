import { Plus, SidebarSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";

import { RAISED_KEY } from "../parts/app";
import { LogoMark } from "../parts/LogoMark";
import { COLOR, FONT } from "../theme";

// The whole app, drawn at a laptop's size (1440×860) and placed once in the film's world, scaled up.
export const APP = { width: 1440, height: 860, left: 60, top: 2, scale: 1.25 };
// The main area beside the sidebar, in the app's pixels.
export const MAIN = { left: 292, width: 1148 };

// A point in the app (its own pixels) as a point in the world, where the camera looks.
export const toWorld = (x: number, y: number) => ({
  x: APP.left + x * APP.scale,
  y: APP.top + y * APP.scale,
});

export type RowState = "idle" | "active" | "making";

const LESSONS = [
  "Area under y = x²",
  "Why Pythagoras works",
  "Vectors, tip to tail",
  "The slope of sin x",
  "Atoms are tiny magnets",
  "Circles and π",
];

// Sidebar.tsx: the logo, New lesson, the list of lessons, and how many lessons are left today.
const Sidebar: React.FC<{
  top: RowState;
  pressed: number;
  lessonsLeft: number;
}> = ({ top, pressed, lessonsLeft }) => {
  const frame = useCurrentFrame();
  return (
    <aside
      style={{
        position: "absolute",
        left: 10,
        top: 10,
        bottom: 10,
        width: 272,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLOR.surface,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 12px 0 16px",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: COLOR.fg,
        }}
      >
        <LogoMark size={26} />
        Lerno
        <span
          style={{
            marginLeft: "auto",
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
            color: COLOR.muted,
          }}
        >
          <SidebarSimple size={18} />
        </span>
      </div>
      <div
        style={{
          ...RAISED_KEY,
          borderRadius: 6,
          margin: "4px 12px 0",
          height: 40,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 500,
          color: COLOR.fg,
          scale: pressed,
        }}
      >
        <Plus size={16} weight="bold" color={COLOR.soft} />
        New lesson
      </div>
      <p style={{ margin: "22px 16px 6px", fontSize: 12, color: COLOR.muted }}>
        Your lessons
      </p>
      <div
        style={{
          flex: 1,
          padding: "0 8px",
          display: "grid",
          alignContent: "start",
        }}
      >
        {LESSONS.map((title, i) => {
          const state = i === 0 ? top : "idle";
          return (
            <div
              key={title}
              style={{
                height: 32,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 10,
                fontSize: 14,
                color: state === "active" ? COLOR.fg : COLOR.secondary,
                backgroundColor:
                  state === "active" ? "rgba(155,124,255,0.08)" : "transparent",
                boxShadow:
                  state === "active"
                    ? "inset 0 0 0 1px rgba(155,124,255,0.18)"
                    : "none",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {state === "making" ? (
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      border: "1.5px solid rgba(183,164,255,0.25)",
                      borderTopColor: COLOR.soft,
                      rotate: `${frame * 8}deg`,
                    }}
                  />
                ) : (
                  <i
                    style={{
                      width: 6,
                      height: 6,
                      rotate: "45deg",
                      borderRadius: 2,
                      backgroundColor: "#2d3040",
                    }}
                  />
                )}
              </span>
              <span style={{ flex: 1 }}>{title}</span>
              {state === "making" && (
                <span style={{ fontSize: 11, color: COLOR.muted }}>Making</span>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "grid", gap: 7, padding: "4px 4px 2px" }}>
          <p style={{ margin: 0, fontSize: 12, color: COLOR.secondary }}>
            {lessonsLeft} of 3 lessons left today
          </p>
          <div style={{ display: "grid", gridAutoFlow: "column", gap: 4 }}>
            {[0, 1, 2].map((k) => (
              <i
                key={k}
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    k < lessonsLeft ? COLOR.soft : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, padding: 4 }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "#c9b8ff",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 600,
              color: COLOR.bg,
            }}
          >
            S
          </span>
          <div style={{ display: "grid" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: COLOR.fg }}>
              Suryansh
            </span>
            <span style={{ fontSize: 11, color: COLOR.muted }}>
              High school
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

// `chrome` fades the sidebar and the window's edge: at the start only the film inside the page exists.
type Props = {
  top: RowState;
  pressed: number;
  lessonsLeft: number;
  chrome: number;
  children: ReactNode;
};

// The app window: the sidebar on the left and the page in the main area, which the film swaps as the story moves.
export const AppWindow: React.FC<Props> = ({
  top,
  pressed,
  lessonsLeft,
  chrome,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: APP.left,
      top: APP.top,
      width: APP.width,
      height: APP.height,
      scale: APP.scale,
      transformOrigin: "0 0",
      borderRadius: 22,
      overflow: "hidden",
      fontFamily: FONT,
      backgroundColor: COLOR.bg,
      boxShadow: `0 0 0 1px rgba(255,255,255,${0.08 * chrome}), 0 60px 160px -40px rgba(0,0,0,${0.9 * chrome}), 0 0 120px -30px rgba(122,96,230,${0.35 * chrome})`,
    }}
  >
    <div style={{ opacity: chrome }}>
      <Sidebar top={top} pressed={pressed} lessonsLeft={lessonsLeft} />
    </div>
    <div
      style={{
        position: "absolute",
        left: MAIN.left,
        top: 0,
        width: MAIN.width,
        height: APP.height,
      }}
    >
      {children}
    </div>
  </div>
);
