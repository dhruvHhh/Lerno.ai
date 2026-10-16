/**
 * Abacus: a frame with three rods, every bead pushed to the left end. It
 * counts zero. Near a row, the pointer nudges that row's beads along their rod,
 * the front bead first and the rest after it, and they slide back to zero when it
 * leaves. The slider is how far a bead is nudged.
 *
 * The pattern: discrete items. A 700ms tween per bead, a stagger by distance,
 * and a hit test on the rows' resting screen height, which never moves.
 */
import HL from "./kernel.js";

const {
  Cam, facing, fit, prism, proj, rings, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const L = 120, ROWS = [12, 28, 44], N = 5, BW = 7, BD = 9, BH = 9, POST = 6, TOP = 56, DEPTH = 14, STEP = 40;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let nudge = value;

  // The frame stands in the plane x = 0, facing the viewer; a rod runs along -y, so it climbs to the right on screen.
  // s is the place along a rod, 0 at its left end; the world y is L - s.
  const C = Cam(45, 0.5, 2.0);
  fit(C, [[-DEPTH / 2, -POST, 0], [DEPTH / 2, L + POST, 0], [DEPTH / 2, -POST, 0], [-DEPTH / 2, L + POST, 0], [0, -POST, TOP + 4], [0, L + POST, TOP + 4]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const block = (x0, y0, x1, y1, r, b, z0, z1) => {
    const [ring, inner] = rings(x0, y0, x1, y1, r, b);
    put(solid(g), prism(P, front, ring, inner, z0, z1));
  };
  const at = (s, z) => P(0, L - s, z);

  // Back to front is small y to large y: the foot, the right post, the rods, then the beads from right to left.
  block(-DEPTH / 2, -POST - 4, DEPTH / 2, L + POST + 4, 3, 1.4, 0, 4);
  block(-3, -POST, 3, 0, 1.5, 0.8, 4, TOP);
  const rods = ROWS.map((z) => mk("path", { d: seg(at(0, z), at(L, z)), class: "nf lo" }, g));
  const rows = ROWS.map((z) => ({ z, beads: [] }));
  for (let i = N - 1; i >= 0; i--) for (const row of rows) {
    const home = 1 + i * (BW + 0.6);
    row.beads[i] = { el: solid(g), home, s: tween(home), drawn: NaN };
  }
  block(-3, L, 3, L + POST, 1.5, 0.8, 4, TOP);
  block(-3, -POST, 3, L + POST, 1.5, 0.8, TOP, TOP + 4);

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const row of rows) for (const b of row.beads) {
      const s0 = tval(b.s, now);
      if (s0 !== b.drawn) {
        b.drawn = s0;
        const [ring, inner] = rings(-BD / 2, L - s0 - BW, BD / 2, L - s0, 3, 1);
        put(b.el, prism(P, front, ring, inner, row.z - BH / 2, row.z + BH / 2));
      }
      if (!tdone(b.s, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  // Hit test: the rod nearest the pointer on screen, measured at the pointer's x along each resting rod.
  const left = at(0, 0)[0], right = at(L, 0)[0];
  function hit([x, y]) {
    if (x < left || x > right) return -1;
    const t = (x - left) / (right - left);
    let best = -1, gap = Infinity;
    ROWS.forEach((z, i) => {
      const ry = at(0, z)[1] + (at(L, z)[1] - at(0, z)[1]) * t;
      if (Math.abs(y - ry) < gap) { gap = Math.abs(y - ry); best = i; }
    });
    return gap <= (at(0, ROWS[1])[1] - at(0, ROWS[2])[1]) * 0.7 ? best : -1;
  }

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now();
    act = a;
    rows.forEach((row, r) => {
      row.beads.forEach((b, i) => {
        // The bead at the front of the stack moves first; the rest follow along the rod.
        const delay = (N - 1 - i) * STEP;
        tset(b.s, r === a ? b.home + nudge * (0.55 + 0.45 * (i / (N - 1))) : b.home, now, delay);
      });
      // At rest the top rod holds the bright stroke; the chosen rod takes it.
      rods[r].classList.toggle("hi", a < 0 ? r === ROWS.length - 1 : r === a);
    });
    read.textContent = a < 0 ? "rest" : `row ${ROWS.length - a} · 0`;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { nudge = v; const a = act; act = -2; setActive(a); },
    destroy: bag.dispose,
  };
}

export default {
  name: "abacus",
  means: "An abacus with every bead pushed to zero; near a row, its beads nudge along, then slide back to nothing.",
  rules: [1, 2, 5, 8],
  range: [14, 22, 30],
  tour: [[190, 150], [210, 190], null],
  mount,
};
