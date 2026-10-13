import { afterPageLoad, prefersReducedMotion } from "@/lib/utils";

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Full-canvas triangle; the vertex shader must use `attribute vec2 aPos`.
export function createFullscreenProgram(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader link:", gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const dispose = () => {
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteBuffer(buffer);
  };
  return { program, dispose };
}

export function animateWhileVisible(
  element: Element,
  draw: (seconds: number) => void,
  { fps, smoothSeconds = 0 }: { fps: number; smoothSeconds?: number },
) {
  if (prefersReducedMotion()) return () => {};

  let raf = 0;
  let timer = 0;
  let playing = false;
  let start = 0;

  const tick = (now: number) => {
    if (!start) start = now;
    const seconds = (now - start) / 1000;
    draw(seconds);
    if (seconds < smoothSeconds) raf = requestAnimationFrame(tick);
    else timer = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 1000 / fps);
  };
  const play = () => {
    if (playing) return;
    playing = true;
    raf = requestAnimationFrame(tick);
  };
  const pause = () => {
    playing = false;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
  };

  const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()));
  const cancelWait = afterPageLoad(() => observer.observe(element));
  return () => {
    pause();
    cancelWait();
    observer.disconnect();
  };
}
