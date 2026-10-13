/**
 * Place value: a place-value mat with three wells, hundreds, tens and ones,
 * holding 4, 0 and 4. The well under the pointer lifts its blocks, fanned so
 * each can be counted; the tens well has none to lift. At rest the empty well
 * is the bright mark. The slider is the fan's gap between lifted blocks.
 */
import HL from "./kernel.js";

const {
  Cam, fit, proj, facing, rings, prism, rrect, ringAt, poly, seg,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer, reflect,
} = HL;

const PLATE = 3, LIFT = 8, STEP = 45;
const MAT = [-4, -2, 160, 52];

/** Each well: its name, its footprint, and its blocks as [x0, y0, x1, y1, z0, z1, k], k being the fan order. */
const WELLS = [
  {
    name: "hundreds", x0: 0, x1: 48,
    blocks: [
      [4, 5, 44, 45, 0, 4.5, 0],
      [5.5, 4, 45.5, 44, 4.5, 9, 1],
      [3, 6.5, 43, 46.5, 9, 13.5, 2],
      [4.5, 5.5, 44.5, 45.5, 13.5, 18, 3],
    ],
  },
  { name: "tens", x0: 54, x1: 102, blocks: [] },
  {
    name: "ones", x0: 108, x1: 156,
    blocks: [
      [122, 8, 134, 20, 0, 12, 0],
      [112, 26, 124, 38, 0, 12, 1],
      [113, 25, 125, 37, 12, 24, 3],
      [130, 28, 142, 40, 0, 12, 2],
    ],
  },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;

  // Fitted to the most extreme pose: the top blocks lifted by the widest gap.
  const top = PLATE + 24 + LIFT + 3 * 9;
  const C = Cam(45, 0.5, 1.75);
  fit(C, [[MAT[0], MAT[1], -6], [MAT[2], MAT[3], 0], [MAT[2], MAT[1], 0], [MAT[0], MAT[3], 0], [24, 25, top], [118, 31, top]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [matRing, matInner] = rings(MAT[0], MAT[1], MAT[2], MAT[3], 6, 1.6);
  reflect(svg, g, P, front, matRing, 0, 14);
  put(solid(g), prism(P, front, matRing, matInner, 0, PLATE));

  // The wells are scored into the mat, so every block covers them.
  const wells = WELLS.map((w) => mk("path", { d: poly(ringAt(P, rrect(w.x0, 0, w.x1, 50, 4, 6), PLATE)), class: "nf lo" }, g));

  const blocks = [];
  WELLS.forEach((w, wi) => {
    for (const [x0, y0, x1, y1, z0, z1, k] of w.blocks) {
      const s = solid(g), [ring, inner] = rings(x0, y0, x1, y1, 1.6, 1);
      // A hundreds flat is scored into a ten-by-ten grid; only the top one shows it.
      const scored = wi === 0 && k === 3 ? mk("path", { class: "nf lo" }, s.g) : null;
      blocks.push({ wi, k, s, ring, inner, x0, y0, x1, y1, z0: PLATE + z0, z1: PLATE + z1, scored, lift: tween(0), drawn: NaN });
    }
  });

  function draw(b, lift) {
    if (lift === b.drawn) return;
    b.drawn = lift;
    put(b.s, prism(P, front, b.ring, b.inner, b.z0 + lift, b.z1 + lift));
    if (b.scored) {
      const z = b.z1 + lift, out = [];
      for (let t = 4; t < 40; t += 4) {
        out.push(seg(P(b.x0 + t, b.y0 + 1.5, z), P(b.x0 + t, b.y1 - 1.5, z)));
        out.push(seg(P(b.x0 + 1.5, b.y0 + t, z), P(b.x1 - 1.5, b.y0 + t, z)));
      }
      b.scored.setAttribute("d", out.join(""));
    }
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const b of blocks) {
      draw(b, tval(b.lift, now));
      if (!tdone(b.lift, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  // Hit test on each well's resting centre, by screen x: lifted blocks never move the answer.
  const centres = WELLS.map((w) => P((w.x0 + w.x1) / 2, 25, PLATE)[0]);
  const hit = ([x, y]) => {
    if (y < 40 || y > 300) return -1;
    let best = 0;
    centres.forEach((c, i) => { if (Math.abs(x - c) < Math.abs(x - centres[best])) best = i; });
    return best;
  };

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    act = a;
    const now = performance.now();
    for (const b of blocks) {
      tset(b.lift, b.wi === a ? LIFT + b.k * gap : 0, now, b.k * STEP);
      b.s.sil.classList.toggle("hi", b.wi === a);
    }
    // At rest the empty tens well is the bright mark; a choice takes the bright.
    wells.forEach((el, i) => {
      const lit = a < 0 ? i === 1 : i === a;
      el.classList.toggle("hi", lit);
      el.classList.toggle("lo", !lit);
    });
    read.textContent = a < 0 ? "rest" : `${WELLS[a].name} · ${WELLS[a].blocks.length}`;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      gap = v;
      const a = act;
      act = -2;
      setActive(a);
    },
    destroy: bag.dispose,
  };
}

export default {
  name: "place-value",
  means: "A place-value mat holding four hundreds, no tens and four ones: 404, with nothing where the tens should be.",
  rules: [1, 4, 5, 9],
  range: [3, 5, 9],
  tour: [[133, 131], [200, 185], null],
  mount,
};
