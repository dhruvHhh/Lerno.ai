export interface ShapeSet {
  items: { name: string; equation: string }[];
  // GLSL `vec3 shape(float index, vec2 p)`: the point for grid position p (each axis -2π to 2π), z up.
  glsl: string;
  // Open sheets fade at their edges and lift under the cursor; closed shapes don't.
  flat: boolean;
  // Heights from -depth to depth run from deep violet to white.
  depth: number;
}

export const SURFACES: ShapeSet = {
  items: [
    { name: "Ripple", equation: "z = sin √(x² + y²)" },
    { name: "Waves", equation: "z = sin x · cos y" },
    { name: "Egg crate", equation: "z = cos x + cos y" },
  ],
  glsl: `
vec3 shape(float index, vec2 p) {
  if (index < 0.5) return vec3(p, sin(length(p)));
  if (index < 1.5) return vec3(p, sin(p.x) * cos(p.y));
  return vec3(p, cos(p.x) + cos(p.y));
}`,
  flat: true,
  depth: 1.2,
};

export const SOLIDS: ShapeSet = {
  items: [
    { name: "Torus", equation: "(√(x² + y²) − R)² + z² = r²" },
    { name: "Möbius strip", equation: "one side, one edge" },
    { name: "Sphere", equation: "x² + y² + z² = r²" },
  ],
  glsl: `
vec3 shape(float index, vec2 p) {
  float u = p.x / 2.0 + 3.14159;
  float v = p.y / 2.0 + 3.14159;
  if (index < 0.5) return vec3((5.0 + 2.0 * cos(v)) * vec2(cos(u), sin(u)), 2.0 * sin(v));
  if (index < 1.5) {
    float w = p.y / 2.8;
    return vec3((5.0 + w * cos(u / 2.0)) * vec2(cos(u), sin(u)), w * sin(u / 2.0));
  }
  return 5.2 * vec3(sin(v / 2.0) * vec2(cos(u), sin(u)), cos(v / 2.0));
}`,
  flat: false,
  depth: 3,
};
