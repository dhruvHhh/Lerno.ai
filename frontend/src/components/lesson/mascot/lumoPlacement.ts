import { STAGE_BEATS } from "@/components/lesson/mascot/useLumoCheckpoints";

// Where Lumo, its bubble and its question card go, worked out from the film's measured size. Lumo stands at the film's
// bottom-left corner and pops up from behind the controls: they are its floor, so it never covers them. The card goes
// over the paused video beside Lumo when there is room for it, and under the film when there is not.

// Lumo's body inside its square clip, as shares of the clip's side, measured on every frame of every clip: the same
// in all of them at rest. Its feet are at 75% (STAGE_BEATS.standDepth stands them on the floor).
const BODY = { left: 0.289, right: 0.711, top: 0.275, face: 0.565 };
// The bubble out to Lumo's right starts at this share of its clip, down from the top (LumoStage's "side" bubble).
const SIDE_BUBBLE = 0.52;
// The clips are 512px square: Lumo is never drawn bigger than that in device pixels, so it is never upscaled.
const CLIP_PX = 512;
// Burned into every scene, as shares of the picture: the scene title's lower edge, top left, and the left edge of
// Lerno's mark, bottom right.
const TITLE_BOTTOM = 0.125;
const MARK_LEFT = 0.95;
// The XP pill in the film's top right corner, down to here.
const PILL_BOTTOM = 48;
const GAP = 8;
// Between the controls and Lumo's floor.
const FLOOR_GAP = 6;
// The card's height with a two-line question and four one-line choices one above the other (389px measured; a wrong
// pick keeps it). With less room over the video than this it turns compact, and a longer question scrolls.
const CARD_ROOM = 395;
const CARD_WIDTH = 380;
// Narrower than this beside Lumo, the card goes above Lumo instead.
const CARD_MIN_WIDTH = 300;
// Short of room for that, the card turns compact: choices two by two, tighter, a step smaller, and wider, so it stays
// short, and a wrong pick reuses the room the choices took. It needs this much height (238px measured at its
// narrowest, with a two-line question and two-line choices) and this much width beside Lumo, or it opens under the
// film.
const COMPACT_ROOM = 240;
const COMPACT_WIDTH = 480;
const COMPACT_MIN_WIDTH = 360;
// Lumo's bubble is never narrower than this, so a line fits in three rows.
const BUBBLE_MIN = 176;
// Lumo's bubble, at most this many px tall (three rows).
const BUBBLE_HEIGHT = 64;
// The notch never sits in the card's rounded corner.
const NOTCH_MIN = 16;
// Kept clear past the bubble's widest, for the little overshoot of its spring as it grows to a new line.
const BUBBLE_SPRING = 12;

export interface LumoPlacement {
  // Lumo's square clip, its left edge from the film's left, and the floor it stands on, from the film's bottom.
  size: number;
  left: number;
  floor: number;
  // Lumo's bubble: above its head, or out to the right of it; and how wide it may grow.
  bubble: "above" | "side";
  bubbleMax: number;
  card: {
    // Where Lumo is, seen from the card: to its left, below it (both over the video), or above it (the card is
    // under the film).
    from: "left" | "below" | "above";
    // How far along its edge the card's notch points at Lumo, in px.
    notch: number;
    // Tight room: the card's compact layout.
    compact: boolean;
    // Over the video: where it goes and how big it may be. Under the film it needs none.
    box: { left: number; bottom: number; width: number; maxHeight: number } | null;
  };
}

interface Measured {
  width: number;
  height: number;
  // The film's bottom edge to the top of its controls.
  controls: number;
  // The film's left edge from the left of the column under it, where an under-film card starts.
  offset: number;
  // Device pixels per CSS pixel.
  dpr: number;
  // Full screen has no "under the film".
  full: boolean;
}

export function placeLumo({ width, height, controls, offset, dpr, full }: Measured): LumoPlacement {
  // The picture fills the film, cropped where the shapes differ (object-cover), so the title and the mark are placed
  // through that crop.
  const scale = Math.max(width / 16, height / 9);
  const picture = { x: (width - 16 * scale) / 2, y: (height - 9 * scale) / 2, width: 16 * scale, height: 9 * scale };
  const top = Math.max(picture.y + TITLE_BOTTOM * picture.height + GAP, PILL_BOTTOM);
  const right = Math.min(width, picture.x + MARK_LEFT * picture.width) - GAP;

  const inset = width < 640 ? 8 : 16;
  const size = Math.round(Math.min(Math.max(96, Math.min(0.42 * height, 0.32 * width)), 300, CLIP_PX / dpr));
  const floor = controls + FLOOR_GAP;
  const stand = STAGE_BEATS.standDepth;
  // Lumo's body lines up with the play button; the clip's empty side runs off the film's edge.
  const left = inset - BODY.left * size;
  const body = { right: left + BODY.right * size, centre: left + 0.5 * size };
  // Heights above the floor, with Lumo standing: the top of its ears, and its face.
  const ears = (1 - stand - BODY.top) * size;
  const face = (1 - stand - BODY.face) * size;
  // The bubble out to the right sits from just under the eyes up.
  const sideBubble = { left: body.right + 12, top: (1 - stand - SIDE_BUBBLE) * size + BUBBLE_HEIGHT };
  const room = height - floor - top;
  const notch = (at: number) => Math.max(NOTCH_MIN, Math.round(at));

  const cardLeft = Math.max(body.right + 16, inset + BUBBLE_MIN + 10 + BUBBLE_SPRING);
  const besideRoom = right - cardLeft;
  const beside = (compact: boolean, width: number): LumoPlacement => ({
    size,
    left,
    floor,
    bubble: "above",
    bubbleMax: cardLeft - 10 - inset - BUBBLE_SPRING,
    card: {
      from: "left",
      notch: notch(face),
      compact,
      box: { left: cardLeft, bottom: floor, width, maxHeight: room },
    },
  });
  if (room >= CARD_ROOM && besideRoom >= CARD_MIN_WIDTH) return beside(false, Math.min(CARD_WIDTH, besideRoom));
  // Full screen has nowhere else to go: there the compact card goes beside Lumo even short of room, and scrolls.
  if ((room >= COMPACT_ROOM || full) && besideRoom >= COMPACT_MIN_WIDTH) {
    return beside(true, Math.min(COMPACT_WIDTH, besideRoom));
  }
  if (!full) {
    return {
      size,
      left,
      floor,
      bubble: "side",
      bubbleMax: width - inset - sideBubble.left - BUBBLE_SPRING,
      card: { from: "above", notch: notch(offset + body.centre), compact: false, box: null },
    };
  }

  // Too narrow beside Lumo (a phone held upright, full screen): the card goes above Lumo and its bubble.
  const bottom = floor + Math.max(ears, sideBubble.top) + 12;
  const above = height - bottom - top;
  return {
    size,
    left,
    floor,
    bubble: "side",
    bubbleMax: width - inset - sideBubble.left - BUBBLE_SPRING,
    card: {
      from: "below",
      notch: notch(body.centre - inset),
      compact: above < CARD_ROOM,
      box: { left: inset, bottom, width: Math.min(CARD_WIDTH, right - inset), maxHeight: above },
    },
  };
}
