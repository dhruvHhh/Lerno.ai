import array
import logging
import subprocess
import tempfile
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from functools import partial
from pathlib import Path

from app.config import (
    DAILY_VOICE_LIMIT,
    SCENES_PER_LESSON,
    VIDEO_BUCKET,
    VOICE_STALE_AFTER_MINUTES,
)
from app.db import count_last_24h, db, lesson_scenes, now_iso
from app.services import llm, voice
from app.services.voice import Clip, Sentence, Voice

# Our Phase 1 fits needed 1.0-1.25x; a sentence that needs more is translated again, shorter.
FASTEST = 1.25
# A sentence may use half of the English pause after it: the rest stays a breath, so the voice keeps up with the picture.
EXTRA_SECONDS = voice.PAUSE_SECONDS / 2
FFMPEG_SECONDS = 60
log = logging.getLogger(__name__)


class NothingToVoice(Exception):
    pass


class VoiceLimitReached(Exception):
    pass


def _stopwatch() -> Callable[[], float]:
    last = time.monotonic()

    def lap() -> float:
        nonlocal last
        now = time.monotonic()
        spent, last = now - last, now
        return round(spent, 1)

    return lap


def _ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True, timeout=FFMPEG_SECONDS)


def _faster(clip: Clip, tempo: float) -> Clip:
    if tempo <= 1:
        return clip
    with tempfile.TemporaryDirectory() as folder:
        source, sped = Path(folder, "in.wav"), Path(folder, "out.wav")
        source.write_bytes(voice.to_wav(clip.samples))
        _ffmpeg("-i", str(source), "-af", f"atempo={tempo:.4f}", "-ar", str(voice.SAMPLE_RATE), "-ac", "1", str(sped))
        return Clip(voice.from_wav(sped.read_bytes()), [round(ms / tempo) for ms in clip.word_ms])


def _with_voice(video: bytes, wav: bytes) -> bytes:
    # The picture is copied as it is; only the sound is new, so this takes about a second.
    with tempfile.TemporaryDirectory() as folder:
        source, sound, out = Path(folder, "in.mp4"), Path(folder, "voice.wav"), Path(folder, "out.mp4")
        source.write_bytes(video)
        sound.write_bytes(wav)
        _ffmpeg(
            "-i", str(source), "-i", str(sound), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
            "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(out),
        )
        return out.read_bytes()


def _starts(english: list[str], word_starts_ms: list[int]) -> list[float]:
    firsts = [sum(len(text.split()) for text in english[:n]) for n in range(len(english))]
    return [word_starts_ms[k] / 1000 for k in firsts]


def _translate(language: str, english: list[str], slots: list[float], too_long: list[int]) -> list[str]:
    texts = llm.translate(language, english, slots, too_long)
    if len(texts) != len(english):
        raise ValueError(f"Translation has {len(texts)} sentences, the English has {len(english)}")
    return texts


def _dub_scene(scene: dict, language: str) -> dict:
    lap, took = _stopwatch(), {}
    # The translation is written for the English speaking time, which is the gap to the next sentence less its pause.
    english = voice.split_sentences(scene["narration"])
    starts = _starts(english, scene["word_starts_ms"])
    spoken = [end - start - voice.PAUSE_SECONDS for start, end in zip(starts, [*starts[1:], scene["duration_seconds"]])]
    slots = [seconds + EXTRA_SECONDS for seconds in spoken]
    texts = _translate(language, english, spoken, [])
    took["translate"] = lap()
    clips = [voice.speak(text, language) for text in texts]
    took["speak"] = lap()
    too_long = [n for n, (clip, slot) in enumerate(zip(clips, slots), 1) if clip.seconds > slot * FASTEST]
    if too_long:
        shorter = _translate(language, english, spoken, too_long)
        for n in too_long:
            texts[n - 1], clips[n - 1] = shorter[n - 1], voice.speak(shorter[n - 1], language)
        took["retry"] = lap()
    tempos = [clip.seconds / slot for clip, slot in zip(clips, slots)]
    clips = [_faster(clip, tempo) for clip, tempo in zip(clips, tempos)]
    spoken = Voice(
        [Sentence(text, start, start + clip.seconds) for text, start, clip in zip(texts, starts, clips)],
        [clip.samples for clip in clips],
        [clip.word_ms for clip in clips],
    )
    # The slots already hold the pauses, so the track adds none of its own.
    track = voice.track(spoken, {}, pause=array.array("h"))
    took["fit"] = lap()
    bucket = db.storage.from_(VIDEO_BUCKET)
    path = scene["video_path"].removesuffix(".mp4") + f".{language}.mp4"
    video = _with_voice(bucket.download(scene["video_path"]), track.wav)
    bucket.upload(path, video, {"content-type": "video/mp4", "upsert": "true"})
    took["video"] = lap()
    # Speed-ups near 1.25 mean the translations run long; the seconds show which step to make faster.
    log.info(
        "Voice %s scene %s: speed-ups %s, seconds %s",
        language, scene["position"], [round(tempo, 2) for tempo in tempos], took,
    )
    return {"status": "ready", "narration": " ".join(texts), "word_starts_ms": track.word_starts_ms, "video_path": path}


def _dub_row(lesson_id: str, language: str, scene: dict) -> None:
    # One scene failing only sends that scene back to the English voice.
    try:
        fields = _dub_scene(scene, language)
    except Exception:
        log.exception("Voice %s for scene %s of lesson %s failed", language, scene["position"], lesson_id)
        fields = {"status": "failed"}
    (
        db.table("scene_voices")
        .update(fields)
        .eq("lesson_id", lesson_id)
        .eq("position", scene["position"])
        .eq("language", language)
        .execute()
    )


def voice_rows(query, lesson_id: str, language: str):
    return query.eq("lesson_id", lesson_id).eq("language", language)


def request_voice(lesson_id: str, user_id: str, language: str, start: Callable[[str, str], object]) -> None:
    rows = voice_rows(db.table("scene_voices").select("status"), lesson_id, language).execute().data
    if not rows:
        scenes = lesson_scenes(lesson_id, ("position", "word_starts_ms"))
        positions = [scene["position"] for scene in scenes if scene["word_starts_ms"]]
        if not positions:
            raise NothingToVoice
        db.table("scene_voices").insert(
            [{"lesson_id": lesson_id, "user_id": user_id, "position": n, "language": language} for n in positions]
        ).execute()
    elif any(row["status"] == "failed" for row in rows):
        # A retry starts the clock again, so the clean-up does not fail it at once.
        update = db.table("scene_voices").update({"status": "making", "created_at": now_iso()})
        voice_rows(update, lesson_id, language).eq("status", "failed").execute()
    else:
        # Already made, or being made: nothing to start.
        return
    # Counting after the insert stops parallel requests from slipping past the limit. Every voiced scene counts.
    try:
        if count_last_24h("scene_voices", user_id) > DAILY_VOICE_LIMIT * SCENES_PER_LESSON:
            raise VoiceLimitReached
        start(lesson_id, language)
    except Exception:
        voice_rows(db.table("scene_voices").delete(), lesson_id, language).eq("status", "making").execute()
        raise


def run(lesson_id: str, language: str) -> None:
    # Only the scenes still waiting: a retry leaves the scenes that already worked alone.
    waiting = (
        voice_rows(db.table("scene_voices").select("position, created_at"), lesson_id, language)
        .eq("status", "making")
        .execute()
        .data
    )
    if waiting:
        # The time from the request to here: the queue and the cold start.
        asked = max(datetime.fromisoformat(row["created_at"]) for row in waiting)
        waited = (datetime.now(asked.tzinfo) - asked).total_seconds()
        log.info("Voice %s for lesson %s waited %.1f s to start", language, lesson_id, waited)
    scenes = (
        db.table("scenes")
        .select("position, narration, word_starts_ms, video_path, duration_seconds")
        .eq("lesson_id", lesson_id)
        .in_("position", [row["position"] for row in waiting])
        .execute()
        .data
    )
    with ThreadPoolExecutor() as pool:
        list(pool.map(partial(_dub_row, lesson_id, language), scenes))


def expire_stale_voices() -> None:
    (
        db.table("scene_voices")
        .update({"status": "failed"})
        .eq("status", "making")
        .lt("created_at", now_iso(timedelta(minutes=VOICE_STALE_AFTER_MINUTES)))
        .execute()
    )
