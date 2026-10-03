import { useEffect, useRef } from "react";

import { animateWhileVisible, createFullscreenProgram, hexToRgb } from "@/lib/webgl";

const BASE_COLOR = "#3A2A78";

const ACCENT_COLOR = "#9B7CFF";

const HIGHLIGHT_COLOR = "#EFEAFF";

const MAX_DPR = 1.5;

const FPS = 24;

const SPEED = 0.9;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Nested arcs drawn as a grid of square dots; every size below is in CSS pixels or a fraction of the canvas height.
const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform vec3 uHigh;

const int ARCS = 5;
const float CELL = 4.0;
const float DOT = 1.2;
const float APEX = 0.52;
const float GAP = 0.09;
const float CURVE = 0.7;
const float INTENSITY = 0.8;

void main() {
  float cell = CELL * uDpr;
  vec2 center = (floor(gl_FragCoord.xy / cell) + 0.5) * cell;
  float x = center.x / uDpr;
  float y = (uRes.y - center.y) / uDpr;
  float w = uRes.x / uDpr;
  float h = uRes.y / uDpr;

  float normX = (x - w * 0.5) / (w * 0.75);
  float edgeFade = max(0.0, 1.0 - pow(abs(normX), 2.5));
  float wave = 0.7 + 0.3 * sin(x * 0.015 + uTime) * cos(y * 0.02 + uTime);

  float glow = 0.0;
  for (int n = 0; n < ARCS; n++) {
    float fn = float(n);
    float arcY = h * (APEX + fn * GAP) + normX * normX * h * CURVE * (1.0 + 0.08 * fn);
    float thickness = 40.0 + (1.0 - min(abs(normX), 1.0)) * 25.0;
    float band = max(0.0, 1.0 - abs(y - arcY) / thickness);
    float pulse = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 1.5 - fn * 0.9));
    glow = max(glow, band * wave * pulse);
  }
  glow *= edgeFade;

  if (glow < 0.02) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float side = DOT * CELL * glow * uDpr;
  vec2 d = abs(gl_FragCoord.xy - center);
  float coverage = 1.0 - smoothstep(side * 0.5 - 1.0, side * 0.5 + 1.0, max(d.x, d.y));
  vec3 ink = mix(mix(uBase, uAccent, pow(glow, 1.1)), uHigh, smoothstep(0.72, 1.0, glow));
  float alpha = coverage * clamp(glow * 1.6, 0.0, 1.0) * INTENSITY;
  gl_FragColor = vec4(ink * alpha, alpha);
}
`;

export function DotArcs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false });
    if (!canvas || !gl) return;

    const shader = createFullscreenProgram(gl, VERT, FRAG);
    if (!shader) return;
    const uniform = (name: string) => gl.getUniformLocation(shader.program, name);
    const uRes = uniform("uRes");
    const uDpr = uniform("uDpr");
    const uTime = uniform("uTime");
    gl.uniform3fv(uniform("uBase"), hexToRgb(BASE_COLOR));
    gl.uniform3fv(uniform("uAccent"), hexToRgb(ACCENT_COLOR));
    gl.uniform3fv(uniform("uHigh"), hexToRgb(HIGHLIGHT_COLOR));

    let lastSeconds = 0;
    const draw = (seconds: number) => {
      lastSeconds = seconds;
      gl.uniform1f(uTime, seconds * SPEED);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      draw(lastSeconds);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const stopAnimation = animateWhileVisible(canvas, draw, { fps: FPS });
    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      shader.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
