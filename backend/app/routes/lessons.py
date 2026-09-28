from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import current_user
from app.config import DAILY_LESSON_LIMIT, GLOBAL_DAILY_LESSON_LIMIT, VIDEO_BUCKET, VIDEO_URL_TTL_SECONDS
from app.db import db, lessons_last_24h, owned_lesson
from app.schemas import LessonCreate

router = APIRouter(prefix="/lessons")

LESSON_FIELDS = ("id", "topic", "audience", "status", "step", "error", "created_at")
SCENE_FIELDS = (
    "position", "title", "narration", "video_path",
    "mcq_question", "mcq_choices", "mcq_correct_index", "fr_question", "fr_answer",
)


def _limit_error(user_id: str) -> str | None:
    if lessons_last_24h(user_id) > DAILY_LESSON_LIMIT:
        return f"You can create {DAILY_LESSON_LIMIT} lessons every 24 hours. Please try again later."
    if lessons_last_24h() > GLOBAL_DAILY_LESSON_LIMIT:
        return "Lerno is at capacity right now. Please try again later."
    return None


def _video_urls(paths: list[str]) -> dict[str, str | None]:
    if not paths:
        return {}
    signed = db.storage.from_(VIDEO_BUCKET).create_signed_urls(paths, VIDEO_URL_TTL_SECONDS)
    return {item["path"]: item["signedURL"] for item in signed}


@router.post("", status_code=201)
def create_lesson(body: LessonCreate, request: Request, user_id: str = Depends(current_user)):
    lesson_id = db.table("lessons").insert({"user_id": user_id, **body.model_dump()}).execute().data[0]["id"]
    # Counting after the insert stops parallel requests from slipping past the limits.
    try:
        if error := _limit_error(user_id):
            raise HTTPException(429, error)
        request.app.state.start_generation(lesson_id)
    except Exception:
        db.table("lessons").delete().eq("id", lesson_id).execute()
        raise
    return {"id": lesson_id}


@router.get("")
def list_lessons(user_id: str = Depends(current_user)):
    return db.table("lessons").select(*LESSON_FIELDS).eq("user_id", user_id).order("created_at", desc=True).execute().data


@router.get("/{lesson_id}")
def read_lesson(lesson_id: UUID, user_id: str = Depends(current_user)):
    lesson = owned_lesson(lesson_id, user_id, LESSON_FIELDS)
    scenes = db.table("scenes").select(*SCENE_FIELDS).eq("lesson_id", lesson["id"]).order("position").execute().data
    urls = _video_urls([scene["video_path"] for scene in scenes if scene["video_path"]])
    for scene in scenes:
        scene["video_url"] = urls.get(scene.pop("video_path"))
    return lesson | {"scenes": scenes}
