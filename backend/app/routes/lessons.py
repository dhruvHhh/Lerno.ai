from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import current_user
from app.config import DAILY_LESSON_LIMIT, GLOBAL_DAILY_LESSON_LIMIT, VIDEO_BUCKET, VIDEO_URL_TTL_SECONDS
from app.db import db, owned_lesson
from app.schemas import LessonCreate

router = APIRouter()

LESSON_FIELDS = ("id", "topic", "audience", "status", "step", "error", "created_at")
SCENE_FIELDS = (
    "position", "title", "narration", "video_path",
    "mcq_question", "mcq_choices", "mcq_correct_index", "fr_question", "fr_answer",
)


def _lessons_today(user_id: str | None = None) -> int:
    midnight = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    query = db.table("lessons").select("id", count="exact").neq("status", "failed").gte("created_at", midnight.isoformat())
    if user_id:
        query = query.eq("user_id", user_id)
    return query.execute().count


def _limit_error(user_id: str) -> str | None:
    if _lessons_today(user_id) > DAILY_LESSON_LIMIT:
        return "You've used all your lessons for today. Come back tomorrow!"
    if _lessons_today() > GLOBAL_DAILY_LESSON_LIMIT:
        return "Lerno is at capacity for today. Please try again tomorrow."
    return None


def _video_url(path: str | None) -> str | None:
    if not path:
        return None
    return db.storage.from_(VIDEO_BUCKET).create_signed_url(path, VIDEO_URL_TTL_SECONDS)["signedURL"]


@router.get("/usage")
def read_usage(user_id: str = Depends(current_user)):
    return {"used": _lessons_today(user_id), "limit": DAILY_LESSON_LIMIT}


@router.post("/lessons", status_code=201)
def create_lesson(body: LessonCreate, request: Request, user_id: str = Depends(current_user)):
    lesson = db.table("lessons").insert({"user_id": user_id, **body.model_dump()}).execute().data[0]
    # Counting after the insert stops parallel requests from slipping past the limits.
    if error := _limit_error(user_id):
        db.table("lessons").delete().eq("id", lesson["id"]).execute()
        raise HTTPException(429, error)
    request.app.state.start_generation(lesson["id"])
    return {"id": lesson["id"]}


@router.get("/lessons")
def list_lessons(user_id: str = Depends(current_user)):
    return db.table("lessons").select(*LESSON_FIELDS).eq("user_id", user_id).order("created_at", desc=True).execute().data


@router.get("/lessons/{lesson_id}")
def read_lesson(lesson_id: UUID, user_id: str = Depends(current_user)):
    lesson = owned_lesson(str(lesson_id), user_id, LESSON_FIELDS)
    scenes = db.table("scenes").select(*SCENE_FIELDS).eq("lesson_id", lesson["id"]).order("position").execute().data
    for scene in scenes:
        scene["video_url"] = _video_url(scene.pop("video_path"))
    return lesson | {"scenes": scenes}
