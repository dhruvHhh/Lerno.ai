import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineSegments,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import type { ShapeSet } from "@/components/auth/shapes";
import { cn, prefersReducedMotion } from "@/lib/utils";

const HOLD_MS = 6000;

const MORPH_S = 1.6;

// The grid spans -2π to 2π, then SCALE shrinks it to fit.
const RANGE = 2 * Math.PI;

const SCALE = 0.6;

const LINES = 28;

const DETAIL = 6;

const IDLE_SPIN = 0.06;

// Lines are split into short segments so they can bend.
function gridGeometry() {
  const points: number[] = [];
  const step = (2 * RANGE) / LINES;
  const segments = LINES * DETAIL;
  for (let i = 0; i <= LINES; i++) {
    const fixed = -RANGE + i * step;
    for (let j = 0; j < segments; j++) {
      const from = -RANGE + (j / segments) * 2 * RANGE;
      const to = -RANGE + ((j + 1) / segments) * 2 * RANGE;
      points.push(fixed, from, 0, fixed, to, 0, from, fixed, 0, to, fixed, 0);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

const vertex = ({ glsl, flat }: ShapeSet) => `
uniform float uFrom;
uniform float uTo;
uniform float uMorph;
uniform vec2 uHover;
uniform float uLift;
varying float vHeight;
varying float vEdge;

${glsl}

void main() {
  vec2 p = position.xy;
  float eased = uMorph * uMorph * (3.0 - 2.0 * uMorph);
  vec3 q = mix(shape(uFrom, p), shape(uTo, p), eased);
  q.z += uLift * 0.9 * exp(-dot(p - uHover, p - uHover) * 0.35);
  vHeight = q.z;
  vEdge = ${flat ? `length(p) / ${(RANGE * Math.SQRT2).toFixed(3)}` : "0.0"};
  // Maths has z up; three.js has y up.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q.xzy * ${SCALE.toFixed(2)}, 1.0);
}
`;

const fragment = ({ depth }: ShapeSet) => `
varying float vHeight;
varying float vEdge;

void main() {
  vec3 low = vec3(0.24, 0.17, 0.55);
  vec3 high = vec3(0.87, 0.82, 1.0);
  vec3 color = mix(low, high, smoothstep(${(-depth).toFixed(1)}, ${depth.toFixed(1)}, vHeight));
  // Fade lines near the corners so the grid has no hard edge.
  gl_FragColor = vec4(color, (1.0 - smoothstep(0.55, 1.0, vEdge)) * 0.85);
}
`;

export default function MathSurface({ shapes, className }: { shapes: ShapeSet; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [current, setCurrent] = useState(0);
  // Refs, because the render loop runs outside React.
  const target = useRef(0);
  // Jumps straight to the chosen surface (reduced motion).
  const showNow = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.className = "absolute inset-0 size-full";

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 10.5, 20);
    camera.lookAt(0, -0.8, 0);

    const uniforms = {
      uFrom: { value: 0 },
      uTo: { value: 0 },
      uMorph: { value: 1 },
      uHover: { value: new Vector2(99, 99) },
      uLift: { value: 0 },
    };
    const geometry = gridGeometry();
    const material = new ShaderMaterial({
      vertexShader: vertex(shapes),
      fragmentShader: fragment(shapes),
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const tilt = new Group();
    tilt.rotation.x = 0.12;
    const spin = new Group();
    spin.rotation.y = -0.6;
    spin.add(new LineSegments(geometry, material));
    tilt.add(spin);
    scene.add(tilt);

    const reduce = prefersReducedMotion();
    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const { clientWidth, clientHeight } = host;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const raycaster = new Raycaster();
    const ground = new Plane(new Vector3(0, 1, 0), 0);
    const hit = new Vector3();
    const pointer = new Vector2();
    let dragging = false;
    let lastX = 0;
    let hovering = false;
    let spinVelocity = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      host.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        const delta = (event.clientX - lastX) * 0.008;
        spin.rotation.y += delta;
        spinVelocity = delta;
        lastX = event.clientX;
      }
      const { left, top, width, height } = host.getBoundingClientRect();
      pointer.set(((event.clientX - left) / width) * 2 - 1, -((event.clientY - top) / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      hovering = shapes.flat && !!raycaster.ray.intersectPlane(ground, hit);
      if (hovering) {
        spin.worldToLocal(hit);
        uniforms.uHover.value.set(hit.x / SCALE, hit.z / SCALE);
      }
      if (reduce) render();
    };
    const onPointerUp = () => (dragging = false);
    const onPointerLeave = () => {
      dragging = false;
      hovering = false;
    };
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointerleave", onPointerLeave);

    let last = 0;
    const step = (seconds: number) => {
      const delta = Math.min(seconds - last, 0.1);
      last = seconds;
      if (target.current !== uniforms.uTo.value) {
        uniforms.uFrom.value = uniforms.uTo.value;
        uniforms.uTo.value = target.current;
        uniforms.uMorph.value = 0;
      }
      uniforms.uMorph.value = Math.min(uniforms.uMorph.value + delta / MORPH_S, 1);
      uniforms.uLift.value += ((hovering ? 1 : 0) - uniforms.uLift.value) * Math.min(delta * 4, 1);
      if (!dragging) {
        spinVelocity *= 0.94;
        spin.rotation.y += IDLE_SPIN * delta + spinVelocity;
      }
      render();
    };
    const stopAnimation = reduce ? () => {} : animate(host, step);

    showNow.current = () => {
      uniforms.uFrom.value = uniforms.uTo.value = target.current;
      uniforms.uMorph.value = 1;
      render();
    };

    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [shapes]);

  useEffect(() => {
    if (still) return;
    const timer = setInterval(() => setCurrent((index) => (index + 1) % shapes.items.length), HOLD_MS);
    return () => clearInterval(timer);
  }, [still, current, shapes]);

  useEffect(() => {
    target.current = current;
    if (still) showNow.current();
  }, [current, still]);

  const { name, equation } = shapes.items[current];

  return (
    <div className={cn("relative", className)}>
      <div
        ref={hostRef}
        aria-hidden="true"
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      />

      <p className="text-muted-foreground pointer-events-none absolute top-6 right-6 text-xs">Drag to turn it</p>

      <div className="pointer-events-none absolute inset-x-8 bottom-8 flex items-end justify-between gap-6">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={current}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-lg font-medium">{name}</p>
            <p className="text-accent-soft mt-1 font-serif text-base italic">{equation}</p>
          </m.div>
        </AnimatePresence>

        <div role="group" aria-label="Shape" className="pointer-events-auto flex gap-1.5">
          {shapes.items.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={item.name}
              aria-pressed={index === current}
              className="-my-2 py-2"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-all duration-500",
                  index === current ? "bg-foreground w-8" : "w-4 bg-white/25 hover:bg-white/45",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Runs `step` each frame, only while on screen and the tab is visible.
function animate(element: Element, step: (seconds: number) => void) {
  let frame = 0;
  const start = performance.now();
  const tick = (now: number) => {
    step((now - start) / 1000);
    frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frame);
    if (entry.isIntersecting) frame = requestAnimationFrame(tick);
  });
  observer.observe(element);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}
