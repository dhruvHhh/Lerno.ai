// Lumo's answer sounds, made with Web Audio in code: no files. Everything that shapes them is here, to tune by ear.
const SOUND = {
  // Master volume, kept quiet. Two overlapping notes at full peak stay well under clipping.
  gain: 0.13,
  // Each note fades in over `attack` seconds, eases down to `sustain` of its peak by `hold` of its length, then fades
  // out to silence by its end: no step anywhere, so nothing clicks.
  attack: 0.018,
  sustain: 0.35,
  hold: 0.45,
  // Right: a soft "ding-ding", two quick rising sine notes a major third apart (G5, B5), with a faint octave above each
  // for a bell's shimmer.
  right: {
    wave: "sine" as OscillatorType,
    shimmer: 0.22,
    cutoff: 6000,
    notes: [
      { hz: 783.99, at: 0, length: 0.22, peak: 0.6 },
      { hz: 987.77, at: 0.11, length: 0.38, peak: 0.6 },
    ],
  },
  // Wrong: "hmm, not quite", two soft notes stepping down a major third (E4, C4), lower and muted by a low-pass.
  wrong: {
    wave: "triangle" as OscillatorType,
    shimmer: 0,
    cutoff: 900,
    notes: [
      { hz: 329.63, at: 0, length: 0.17, peak: 0.5 },
      { hz: 261.63, at: 0.14, length: 0.27, peak: 0.5 },
    ],
  },
};

type Kind = "right" | "wrong";

const Context: typeof AudioContext | undefined =
  typeof window === "undefined"
    ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

// One context for the whole visit, made on the first answer: browsers only let sound start from a click or a key.
let context: AudioContext | null = null;

// Plays an answer sound. Call it from the answer's click or key press. Quiet, and never throws: without Web Audio, or
// in a hidden tab, it plays nothing.
export function playLumoSound(kind: Kind) {
  if (!Context || document.visibilityState !== "visible") return;
  try {
    context ??= new Context();
    if (context.state === "suspended") void context.resume().catch(() => {});
    const now = context.currentTime + 0.01;
    const sound = SOUND[kind];
    const master = context.createGain();
    master.gain.value = SOUND.gain;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = sound.cutoff;
    filter.connect(master).connect(context.destination);
    for (const note of sound.notes) {
      const start = now + note.at;
      const end = start + note.length;
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(note.peak, start + SOUND.attack);
      envelope.gain.exponentialRampToValueAtTime(note.peak * SOUND.sustain, start + note.length * SOUND.hold);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      envelope.connect(filter);
      const partials = sound.shimmer ? [1, 2] : [1];
      for (const partial of partials) {
        const tone = context.createOscillator();
        tone.type = sound.wave;
        tone.frequency.value = note.hz * partial;
        const level = context.createGain();
        level.gain.value = partial === 1 ? 1 : sound.shimmer;
        tone.connect(level).connect(envelope);
        tone.start(start);
        tone.stop(end + 0.02);
      }
    }
  } catch {
    // No sound, nothing else lost.
  }
}
