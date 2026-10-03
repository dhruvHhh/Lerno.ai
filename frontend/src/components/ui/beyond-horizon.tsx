import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/utils";
import { animateWhileVisible, createFullscreenProgram, hexToRgb } from "@/lib/webgl";

const REF_ASPECT = 1314 / 2860;

const MAX_DPR = 2;

const RENDER_SCALE = 0.5;

const PIXEL_BUDGET = 2_200_000;

const REVEAL_SECONDS = 2.5;

const FPS = 15;

const MID_COLOR = "#B79BFA";

const DEEP_COLOR = "#3A2A78";

const HAZE = 3;

const FIT = 0.5;

const HORIZON_RADIUS = 1.867;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform float uBright;
uniform float uReveal;
uniform float uHorizonY;
uniform float uHorizonR;
uniform float uHaze;
uniform float uCoreSize;
uniform float uFit;
uniform vec3  uBg;
uniform vec3  uCore;
uniform vec3  uMid;
uniform vec3  uDeep;

const int STEPS = 26;
const float REF_ASPECT = ${REF_ASPECT.toFixed(6)};
const float REVEAL_SOFTNESS = 0.3;
const float MIN_HAZE = 0.04;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.02;
    p.xz = mat2(0.80, 0.60, -0.60, 0.80) * p.xz;
    a *= 0.5;
  }
  return s;
}

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec3 tonemapTanh(vec3 x) {
  x = clamp(x, -12.0, 12.0);
  vec3 e2 = exp(2.0 * x);
  return (e2 - 1.0) / (e2 + 1.0);
}

vec3 marchHaze(vec2 P) {
  vec3 ro = vec3(0.0, 0.0, -1.6);
  vec3 rd = normalize(vec3(P, 1.2));
  float t = 0.28;
  float stepSize = 0.085;
  float trans = 1.0;
  vec3 haze = vec3(0.0);

  for (int i = 0; i < STEPS; i++) {
    if (trans < 0.02) break;
    vec3 pos = ro + rd * t;

    vec3 q = pos * vec3(3.2, 1.75, 3.2);
    q.y -= uTime * 0.10;
    q.z += uTime * 0.035;

    float dens = smoothstep(0.47, 0.83, fbm(q));

    float dl = length(pos.xy * vec2(1.0, 0.72));
    float li = 1.0 / (1.0 + dl * dl * 110.0);

    vec3 lc = mix(uDeep, uMid, clamp(li * 1.6, 0.0, 1.0));
    lc += vec3(0.16, 0.05, -0.04) * (1.0 - dens) * li * 0.5;

    haze += dens * li * lc * trans * stepSize;
    trans *= 1.0 - dens * 0.28;
    t += stepSize;
  }
  return haze;
}

void main() {
  float aspect = uRes.y / uRes.x;
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

  float unit = clamp(pow(max(aspect, 0.0001) / REF_ASPECT, uFit), 0.45, 3.2);
  float inv = 1.0 / unit;
  vec2 P = vec2(uv.x - 0.5, (uv.y - uHorizonY) * aspect) * inv;
  float pxUnit = inv / max(uRes.x, 1.0);

  float front = uReveal * (1.0 + REVEAL_SOFTNESS);
  float revealed = 1.0 - smoothstep(front - REVEAL_SOFTNESS, front, uv.x);

  vec3 col = uBg;

  float d = length(P);
  float g = uCoreSize / max(d, 0.0009);
  g = mix(g, g * g, 0.55);
  g *= smoothstep(0.46, 0.28, d) * uBright;

  vec3 glowCol = mix(uDeep, uMid, clamp(g * 2.4, 0.0, 1.0));
  glowCol = mix(glowCol, uCore, clamp((g - 0.30) * 1.7, 0.0, 1.0));
  col += glowCol * g;

  float discD = length(P - vec2(0.0, uHorizonR)) - uHorizonR;
  float aa = 1.4 * pxUnit;
  float above = smoothstep(-aa, aa, discD);

  // The haze is invisible below the horizon and far from the core, so skip its expensive raymarch there.
  float hazeWeight = uHaze * 9.0 * exp(-d * 19.0) * smoothstep(0.40, 0.28, d);
  if (above > 0.0 && hazeWeight * revealed > MIN_HAZE) col += marchHaze(P) * hazeWeight;

  float rimDx = abs(P.x);
  float rimBase = exp(-rimDx / 0.22) * smoothstep(0.40, 0.26, rimDx);
  float rimFall = rimBase * mix(0.22, 1.0, smoothstep(0.0, 0.18, rimDx));

  float kMax = 0.7 / max(pxUnit, 1e-7);

  float shade = exp(min(discD, 0.0) * min(340.0, kMax));
  float bleed = exp(min(discD, 0.0) * min(95.0, kMax)) * rimBase * 0.85;
  vec3 ground = uBg * (1.0 - 0.85 * clamp(shade, 0.0, 1.0)) + uMid * bleed;
  col = mix(ground, col, above);

  float rimThin  = exp(-abs(discD) * min(150.0, kMax));
  float rimBroad = exp(-abs(discD) * min(22.0, kMax));
  col += uMid * (rimThin + 0.26 * rimBroad) * rimFall * 1.9 * above * uBright;

  col = mix(uBg, col, revealed);
  col = tonemapTanh(col);
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface BeyondHorizonProps {
  background: string;
  coreColor: string;
  brightness: number;
  coreSize: number;
  speed: number;
  horizonY: number;
  breathe: number;
}

export function BeyondHorizon({
  background,
  coreColor,
  brightness,
  coreSize,
  speed,
  horizonY,
  breathe,
}: BeyondHorizonProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      console.error("BeyondHorizon: no WebGL context");
      return;
    }

    const shader = createFullscreenProgram(gl, VERT, FRAG);
    if (!shader) return;

    const U = (n: string) => gl.getUniformLocation(shader.program, n);
    const u = {
      res: U("uRes"),
      time: U("uTime"),
      bright: U("uBright"),
      reveal: U("uReveal"),
      horizonY: U("uHorizonY"),
      horizonR: U("uHorizonR"),
      haze: U("uHaze"),
      coreSize: U("uCoreSize"),
      fit: U("uFit"),
      bg: U("uBg"),
      core: U("uCore"),
      mid: U("uMid"),
      deep: U("uDeep"),
    };

    const reduceMotion = prefersReducedMotion();
    const colors = {
      bg: hexToRgb(background),
      core: hexToRgb(coreColor),
      mid: hexToRgb(MID_COLOR),
      deep: hexToRgb(DEEP_COLOR),
    };

    let w = 0;
    let h = 0;

    const resize = () => {
      const cssW = Math.max(1, Math.round(host.offsetWidth || 1));
      const cssH = Math.max(1, Math.round(host.offsetHeight || 1));
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      const scale = Math.min(RENDER_SCALE * dpr, MAX_DPR);
      let nw = Math.max(2, Math.round(cssW * scale));
      let nh = Math.max(2, Math.round(cssH * scale));

      const over = (nw * nh) / PIXEL_BUDGET;
      if (over > 1) {
        const s = Math.sqrt(1 / over);
        nw = Math.max(2, Math.round(nw * s));
        nh = Math.max(2, Math.round(nh * s));
      }
      if (nw === w && nh === h) return false;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      return true;
    };

    let lastT = 0;

    const draw = (tSec: number) => {
      lastT = tSec;
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.time, tSec * speed);
      gl.uniform1f(u.bright, brightness * (1 + breathe * Math.sin((tSec * Math.PI) / 3)));
      gl.uniform1f(u.reveal, reduceMotion ? 1 : easeOut(Math.min(tSec / REVEAL_SECONDS, 1)));
      gl.uniform1f(u.horizonY, horizonY);
      gl.uniform1f(u.horizonR, HORIZON_RADIUS);
      gl.uniform1f(u.haze, HAZE);
      gl.uniform1f(u.coreSize, coreSize);
      gl.uniform1f(u.fit, FIT);
      gl.uniform3fv(u.bg, colors.bg);
      gl.uniform3fv(u.core, colors.core);
      gl.uniform3fv(u.mid, colors.mid);
      gl.uniform3fv(u.deep, colors.deep);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();
    draw(0);

    const onResize = () => {
      if (resize()) draw(lastT);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    const stopAnimation = animateWhileVisible(host, draw, { fps: FPS, smoothSeconds: REVEAL_SECONDS });

    return () => {
      stopAnimation();
      ro.disconnect();
      shader.dispose();
    };
  }, [background, coreColor, brightness, coreSize, speed, horizonY, breathe]);

  return (
    <div ref={hostRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
