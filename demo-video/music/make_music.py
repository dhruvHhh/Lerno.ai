"""Makes public/film-music.wav: a calm 120 BPM bed for the film, generated from scratch (royalty free).

Every cue comes from src/film/cues.json (frames at 60 fps). At 120 BPM a beat is 30 frames, so the film's moves land
on beats. Layers join as the story builds, typing gets soft key ticks, and the tick, the saved note and the right
answer each get a small chime.
Run: uv run --no-project --with numpy python music/make_music.py
"""

import json
import wave
from pathlib import Path

import numpy as np

RATE = 44100
FPS = 60
ROOT = Path(__file__).parent.parent
OUT = ROOT / "public" / "film-music.wav"
cues = json.loads((ROOT / "src" / "film" / "cues.json").read_text())

LENGTH = cues["length"] / FPS
STRIPS, ASK, LESSON, WALL = (cues[k] / FPS if k != "strips" else cues[k][0] / FPS for k in ("strips", "ask", "lesson", "wall"))

t = np.arange(int(LENGTH * RATE)) / RATE
mix = np.zeros((len(t), 2))
rng = np.random.default_rng(3)


def note(name: str) -> float:
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[-1]) - 4) - 9) / 12)


def envelope(n: int, attack: float, release: float) -> np.ndarray:
    a, r = max(1, int(attack * RATE)), max(1, int(release * RATE))
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= np.linspace(1, 0, r)
    return env


def add(start: float, sound: np.ndarray, pan: float = 0.0) -> None:
    i = int(start * RATE)
    if i >= len(t):
        return
    sound = sound[: len(t) - i]
    mix[i : i + len(sound), 0] += sound * (1 - pan)
    mix[i : i + len(sound), 1] += sound * (1 + pan)


def tone(freqs: list[float], length: float, decay: float) -> np.ndarray:
    x = np.arange(int(length * RATE)) / RATE
    return sum(np.sin(2 * np.pi * f * x) for f in freqs) * np.exp(-x * decay) / len(freqs)


def pad(freqs: list[float], start: float, length: float, level: float) -> None:
    n = int(length * RATE)
    x = np.arange(n) / RATE
    sound = sum(np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 1.003 * x) for f in freqs)
    sound *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * x)
    add(start, sound * envelope(n, 0.6, 0.8) * level / len(freqs))


def kick(start: float, level: float) -> None:
    x = np.arange(int(0.35 * RATE)) / RATE
    add(start, np.sin(2 * np.pi * (45 + 90 * np.exp(-x * 30)) * x) * np.exp(-x * 9) * level)


def noise_hit(start: float, length: float, decay: float, level: float, pan: float = 0.0) -> None:
    n = int(length * RATE)
    add(start, np.diff(rng.standard_normal(n + 1)) * np.exp(-np.arange(n) / RATE * decay) * level, pan)


# Am – F – C – G, one chord per bar (2 s). The hook opens on the pad alone; plucks join with the strips, the kick
# with "Ask", the hats with the lesson, and the wall keeps only the last chord.
CHORDS = [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C3", "E4", "G4"], ["G3", "B3", "D4"]]
for bar in range(int(LENGTH / 2) + 1):
    chord = [note(n) for n in CHORDS[bar % 4]]
    start = bar * 2.0
    pad(chord, start, 2.4, 0.15)
    if STRIPS - 0.5 <= start < WALL:
        n = int(2 * RATE)
        add(start, np.sin(2 * np.pi * chord[0] / 2 * np.arange(n) / RATE) * envelope(n, 0.05, 0.3) * 0.11)
    for step in range(8):
        at = start + step * 0.25
        if STRIPS <= at < WALL:
            add(at, tone([chord[step % 3] * 2], 0.6, 7) * 0.07, -0.4 if step % 2 else 0.4)
        if ASK <= at < WALL and step % 2 == 0:
            kick(at, 0.45)
        if LESSON <= at < WALL and step % 2 == 1:
            noise_hit(at, 0.08, 60, 0.045, 0.3)

# Rising swells into the pull back and into the wall.
for end in (cues["pull"] / FPS, WALL):
    n = int(1.2 * RATE)
    swell = rng.standard_normal(n) * np.linspace(0, 1, n) ** 3
    add(end - 1.2, np.convolve(swell, np.ones(40) / 40, "same") * 0.14)

# Soft key ticks while text types: one every 4 frames, a little uneven like real typing.
for begin, finish in cues["typing"]:
    for f in range(begin, finish, 4):
        noise_hit((f + rng.integers(0, 2)) / FPS, 0.03, 140, 0.05, rng.uniform(-0.2, 0.2))

# A small two-note chime for each success.
for f in cues["chimes"]:
    add(f / FPS, tone([note("E5"), note("B5")], 1.2, 4) * 0.12)
    add(f / FPS + 0.09, tone([note("A5")], 1.0, 4) * 0.08)

# The last chord rings out under the wall and the logo.
pad([note(n) for n in ["A3", "C4", "E4", "A4"]], WALL, LENGTH - WALL, 0.22)

mix *= envelope(len(t), 0.6, 1.6)[:, None]
mix *= 0.89 / np.abs(mix).max()
with wave.open(str(OUT), "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f"wrote {OUT} ({LENGTH} s)")
