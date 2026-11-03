import array
import base64
import io
import logging
import re
import threading
import time
import wave
from typing import NamedTuple

import httpx

from app.config import MURF_API_KEY

MURF_URL = "https://api.murf.ai/v1/speech/generate"
MURF_SECONDS = 60
# Our Murf plan takes 5 calls at a time. Another job on another machine can still go over, so a refused call waits
# and tries again.
_murf_slots = threading.BoundedSemaphore(5)
MURF_TRIES = 3
VOICES = {
    "en": {"voiceId": "en-IN-isha", "locale": "en-IN", "style": "Narration"},
    "hi": {"voiceId": "hi-IN-shweta", "locale": "hi-IN"},
    "ta": {"voiceId": "ta-IN-iniya", "locale": "ta-IN"},
    "bn": {"voiceId": "bn-IN-anwesha", "locale": "bn-IN"},
}
SAMPLE_RATE = 24000
PAUSE_SECONDS = 0.6
PAUSE = array.array("h", bytes(2 * int(SAMPLE_RATE * PAUSE_SECONDS)))
# Isha's pace in our tests; the Manim code is written from this estimate while Murf speaks.
WORDS_PER_SECOND = 3.3
# -35 dB: quieter than this is silence, the level our Murf tests used.
LOUD = 32768 * 10 ** (-35 / 20)
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")
NOT_LETTERS = re.compile(r"[\s.,!?;:()\"'“”‘’।\-–—]")
log = logging.getLogger(__name__)


class Sentence(NamedTuple):
    text: str
    # Planned place on the track, in seconds: the sentences back to back with a pause between them.
    start: float
    end: float


class Voice(NamedTuple):
    sentences: list[Sentence]
    # Each sentence's speech with Murf's silence cut, and where its words start in it.
    clips: list[array.array]
    word_ms: list[list[int]]


class Clip(NamedTuple):
    samples: array.array
    # Where each word starts in the clip, in milliseconds.
    word_ms: list[int]

    @property
    def seconds(self) -> float:
        return len(self.samples) / SAMPLE_RATE


class Track(NamedTuple):
    wav: bytes
    seconds: float
    word_starts_ms: list[int]


def split_sentences(narration: str) -> list[str]:
    return SENTENCE_END.split(narration.strip())


def estimate(narration: str) -> list[Sentence]:
    sentences, at = [], 0.0
    for text in split_sentences(narration):
        length = len(text.split()) / WORDS_PER_SECOND
        sentences.append(Sentence(text, at, at + length))
        at += length + PAUSE_SECONDS
    return sentences


def _post(body: dict) -> dict:
    for attempt in range(1, MURF_TRIES + 1):
        try:
            with _murf_slots:
                response = httpx.post(MURF_URL, headers={"api-key": MURF_API_KEY}, json=body, timeout=MURF_SECONDS)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            if attempt == MURF_TRIES:
                raise
            time.sleep(attempt)


def from_wav(wav: bytes) -> array.array:
    with wave.open(io.BytesIO(wav)) as clip:
        return array.array("h", clip.readframes(clip.getnframes()))


def to_wav(samples: array.array) -> bytes:
    wav = io.BytesIO()
    with wave.open(wav, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        out.writeframes(samples.tobytes())
    return wav.getvalue()


def _align(text: str, words: list[dict]) -> list[int]:
    # Murf splits joined words ("ऊपर-नीचे" comes back as two) and returns punctuation as words of its own, so each of
    # our words takes as many of Murf's as it needs to spell it. Case is ignored: Murf writes "A" as "a". Empty when
    # they do not spell the same text.
    spoken = [(NOT_LETTERS.sub("", word["word"]).casefold(), word["startMs"]) for word in words]
    spoken = [(letters, ms) for letters, ms in spoken if letters]
    starts, k = [], 0
    for word in text.split():
        target, spelled = NOT_LETTERS.sub("", word).casefold(), ""
        if not target or k == len(spoken):
            return []
        starts.append(spoken[k][1])
        while k < len(spoken) and len(spelled) < len(target):
            spelled += spoken[k][0]
            k += 1
        if spelled != target:
            return []
    return starts if k == len(spoken) else []


def _speak(text: str, language: str) -> tuple[array.array, list[int]]:
    body = {**VOICES[language], "text": text, "format": "WAV", "sampleRate": SAMPLE_RATE, "encodeAsBase64": True}
    # Murf keeps the words as written only in English; other languages already come back as written.
    if language == "en":
        body["wordDurationsAsOriginalText"] = True
    data = _post(body)
    samples = from_wav(base64.b64decode(data["encodedAudio"]))
    return samples, _align(text, data["wordDurations"])


def _speech(samples: array.array) -> tuple[int, int]:
    # Murf pads each clip with silence; cut it so every gap between sentences is our pause.
    window = SAMPLE_RATE // 100
    loud = [i for i in range(0, len(samples), window) if max(map(abs, samples[i:i + window])) > LOUD]
    # A clip that is quiet all through is kept whole: a bit of extra pause beats losing the scene's voice.
    if not loud:
        return 0, len(samples)
    return loud[0], loud[-1] + window


def _spread(text: str, seconds: float) -> list[int]:
    # Each word gets a share of the clip by its length: close enough to light the words in step.
    lengths = [len(word) + 1 for word in text.split()]
    return [round(seconds * 1000 * sum(lengths[:k]) / sum(lengths)) for k in range(len(lengths))]


def speak(text: str, language: str) -> Clip:
    # One Murf call per sentence: a sentence start inside a longer clip comes back about 0.2 s early.
    samples, starts = _speak(text, language)
    first, last = _speech(samples)
    clip = samples[first:last]
    # One sentence Murf spelled its own way must not cost the whole scene its word times, which the highlight and the
    # other languages need.
    if not starts:
        log.warning("Murf words did not match, so the word times are spread: %s", text[:80])
        return Clip(clip, _spread(text, len(clip) / SAMPLE_RATE))
    lead_ms = first * 1000 / SAMPLE_RATE
    # Murf puts the first word at 0 ms, inside the silence we cut.
    return Clip(clip, [round(max(ms - lead_ms, 0)) for ms in starts])


def _narrate(narration: str) -> Voice:
    sentences, clips, word_ms, at = [], [], [], 0.0
    for text in split_sentences(narration):
        clip = speak(text, "en")
        clips.append(clip.samples)
        word_ms.append(clip.word_ms)
        sentences.append(Sentence(text, at, at + clip.seconds))
        at += clip.seconds + PAUSE_SECONDS
    return Voice(sentences, clips, word_ms)


def narrate(narration: str) -> Voice | None:
    if not MURF_API_KEY:
        return None
    # A scene without a voice is still worth keeping.
    try:
        return _narrate(narration)
    except Exception:
        log.exception("Voice failed, so the scene stays silent")
        return None


def track(voice: Voice, marks: dict[int, float], pause: array.array = PAUSE) -> Track:
    # Each sentence starts where the video reached it; a late picture only makes the pause before it longer.
    samples, starts = array.array("h"), []
    for number, (sentence, clip, word_ms) in enumerate(zip(voice.sentences, voice.clips, voice.word_ms), 1):
        at = max(round(marks.get(number, sentence.start) * SAMPLE_RATE), len(samples))
        samples.extend(array.array("h", bytes(2 * (at - len(samples)))))
        starts += [round(at * 1000 / SAMPLE_RATE) + ms for ms in word_ms]
        samples.extend(clip)
        samples.extend(pause)
    return Track(to_wav(samples), len(samples) / SAMPLE_RATE, starts)
