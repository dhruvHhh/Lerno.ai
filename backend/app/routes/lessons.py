import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.auth import current_user
from app.config import (
    DAILY_ATTEMPT_LIMIT,
    DAILY_LESSON_LIMIT,
    DAILY_VOICE_LIMIT,
    GLOBAL_DAILY_LESSON_LIMIT,
    LESSON_PAGE_SIZE,
    THUMBNAIL_BUCKET,
    VIDEO_BUCKET,
    VIDEO_URL_TTL_SECONDS,
)
from app.db import (
    count_last_24h,
    db,
    lesson_scenes,
    lessons_used,
    owned_lesson,
    thumbnail_path,
)
from app.schemas import Language, LessonCreate, VoiceCreate
from app.services import dub, llm

router = APIRouter(prefix="/lessons")
log = logging.getLogger(__name__)

LESSON_FIELDS = ("id", "topic", "title", "audience", "status", "step", "error", "created_at")
SCENE_FIELDS = (
    "position", "title", "narration", "video_path", "duration_seconds", "word_starts_ms",
    "mcq_question", "mcq_choices", "mcq_correct_index", "fr_question", "fr_answer",
)
VOICE_FIELDS = ("position", "language", "status", "narration", "word_starts_ms", "video_path")


def _limit_error(user_id: str) -> str | None:
    if lessons_used(user_id) > DAILY_LESSON_LIMIT:
        return f"You can create {DAILY_LESSON_LIMIT} lessons every 24 hours. Please try again later."
    if count_last_24h("lessons", user_id) > DAILY_ATTEMPT_LIMIT:
        return "Too many lessons failed in the last 24 hours. Please try again later."
    if count_last_24h("lessons") > GLOBAL_DAILY_LESSON_LIMIT:
        return "Lerno is at capacity right now. Please try again later."
    return None


def _video_urls(paths: list[str]) -> dict[str, str | None]:
    if not paths:
        return {}
    signed = db.storage.from_(VIDEO_BUCKET).create_signed_urls(paths, VIDEO_URL_TTL_SECONDS)
    return {item["path"]: item["signedURL"] for item in signed}


# Built, not fetched: a scene's thumbnail sits at a fixed public path.
def _thumbnail_url(lesson_id: str, position: int) -> str:
    return db.storage.from_(THUMBNAIL_BUCKET).get_public_url(thumbnail_path(lesson_id, position))


@router.post("", status_code=201)
def create_lesson(body: LessonCreate, request: Request, user_id: str = Depends(current_user)):
    # Before the insert, so a topic turned away is never saved and never counts toward the limits.
    check = llm.check_topic(body.topic)
    if check and not check.is_maths:
        # Kept in the log, so wrong refusals can be found and the rule improved.
        log.warning("Not a maths topic: %r, suggested %r", body.topic, check.suggestion)
        return JSONResponse(
            {"detail": "Lerno makes maths lessons only.", "suggestion": check.suggestion}, status_code=422
        )
    fields = body.model_dump(exclude={"language"})
    lesson_id = db.table("lessons").insert({"user_id": user_id, **fields}).execute().data[0]["id"]
    # Counting after the insert stops parallel requests from slipping past the limits.
    try:
        if error := _limit_error(user_id):
            raise HTTPException(429, error)
        # The language the user last picked: its voice is made once the lesson is ready, so they don't wait for it.
        request.app.state.start_generation(lesson_id, body.language)
    except Exception:
        db.table("lessons").delete().eq("id", lesson_id).execute()
        raise
    return {"id": lesson_id}


# A page older than `before`, not a page number, so a new lesson at the top never repeats one on the next page.
@router.get("")
def list_lessons(before: datetime | None = None, user_id: str = Depends(current_user)):
    query = db.table("lessons").select(*LESSON_FIELDS).eq("user_id", user_id)
    if before:
        query = query.lt("created_at", before.isoformat())
    return query.order("created_at", desc=True).limit(LESSON_PAGE_SIZE).execute().data


@router.get("/{lesson_id}")
def read_lesson(lesson_id: UUID, user_id: str = Depends(current_user)):
    lesson = owned_lesson(lesson_id, user_id, LESSON_FIELDS)
    scenes = lesson_scenes(lesson["id"], SCENE_FIELDS)
    voices = db.table("scene_voices").select(*VOICE_FIELDS).eq("lesson_id", lesson["id"]).execute().data
    urls = _video_urls([row["video_path"] for row in [*scenes, *voices] if row["video_path"]])
    by_scene: dict[int, dict] = {}
    for voice in voices:
        position, language, path = voice.pop("position"), voice.pop("language"), voice.pop("video_path")
        by_scene.setdefault(position, {})[language] = voice | {"video_url": urls.get(path)}
    for scene in scenes:
        path = scene.pop("video_path")
        scene["video_url"] = urls.get(path)
        scene["thumbnail_url"] = _thumbnail_url(lesson["id"], scene["position"]) if path else None
        scene["voices"] = by_scene.get(scene["position"], {})
    return lesson | {"scenes": scenes}


# What the page asks while a voice is being made: only this language, so the lesson's own video links stay as they are.
@router.get("/{lesson_id}/voices/{language}")
def read_voices(lesson_id: UUID, language: Language, user_id: str = Depends(current_user)):
    lesson_id = owned_lesson(lesson_id, user_id, ("id",))["id"]
    voices = dub.voice_rows(db.table("scene_voices").select(*VOICE_FIELDS), lesson_id, language).execute().data
    urls = _video_urls([voice["video_path"] for voice in voices if voice["video_path"]])
    for voice in voices:
        voice["video_url"] = urls.get(voice.pop("video_path"))
    return voices


@router.post("/{lesson_id}/voices", status_code=201)
def create_voice(lesson_id: UUID, body: VoiceCreate, request: Request, user_id: str = Depends(current_user)):
    lesson_id, language = owned_lesson(lesson_id, user_id, ("id",))["id"], body.language
    try:
        dub.request_voice(lesson_id, user_id, language, request.app.state.start_dub)
    except dub.NothingToVoice:
        raise HTTPException(409, "This lesson has no voice to translate.") from None
    except dub.VoiceLimitReached:
        raise HTTPException(
            429, f"You can add {DAILY_VOICE_LIMIT} languages every 24 hours. Please try again later."
        ) from None
    return {"language": language}
