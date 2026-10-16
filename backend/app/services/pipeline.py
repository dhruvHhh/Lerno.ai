import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from functools import partial

from app.config import SCENES_PER_LESSON, STALE_AFTER_MINUTES, VIDEO_BUCKET
from app.db import db, now_iso, window_start
from app.schemas import ScenePlan
from app.services import llm, renderer

MAX_FIXES = 2
ACTIVE = ["queued", "generating"]
log = logging.getLogger(__name__)


def _update(lesson_id: str, **fields) -> None:
    # Once a lesson is ready or failed, a late job must not change it back.
    db.table("lessons").update(fields).eq("id", lesson_id).in_("status", ACTIVE).execute()


def _finish(lesson_id: str, **fields) -> None:
    _update(lesson_id, finished_at=now_iso(), **fields)


def _animate(lesson: dict, position: int, code: str) -> tuple[str | None, str]:
    for attempt in range(MAX_FIXES + 1):
        video, error = renderer.render(code)
        if video:
            path = f"{lesson['user_id']}/{lesson['id']}/scene_{position}.mp4"
            db.storage.from_(VIDEO_BUCKET).upload(path, video, {"content-type": "video/mp4", "upsert": "true"})
            return path, code
        log.warning("Scene %s render failed (attempt %s): %s", position, attempt + 1, error[-500:])
        if attempt < MAX_FIXES:
            code = llm.fix_manim(code, error)
    return None, code


def _scene_row(lesson: dict, position: int, scene: ScenePlan) -> dict:
    code = video_path = None
    # One scene crashing must not take down the other two.
    try:
        code = llm.write_manim(scene)
        _update(lesson["id"], step=3)
        video_path, code = _animate(lesson, position, code)
    except Exception:
        log.exception("Scene %s of lesson %s crashed", position, lesson["id"])
    return {
        "lesson_id": lesson["id"],
        "position": position,
        "manim_code": code,
        "video_path": video_path,
        **scene.model_dump(exclude={"animation_description"}),
    }


def run(lesson_id: str) -> None:
    lesson = db.table("lessons").select("*").eq("id", lesson_id).single().execute().data
    # Already expired before the job started, so the work would be thrown away.
    if lesson["status"] not in ACTIVE:
        return
    try:
        _update(lesson_id, status="generating", step=1)
        plan = llm.plan_lesson(lesson["topic"], lesson["audience"])
        scenes = plan.scenes[:SCENES_PER_LESSON]
        # Empty, not blank, so the app falls back to the topic.
        _update(lesson_id, step=2, title=plan.title.strip() or None)
        with ThreadPoolExecutor() as pool:
            rows = list(pool.map(partial(_scene_row, lesson), range(1, len(scenes) + 1), scenes))
        # An empty plan can't be inserted; it ends below as "couldn't animate".
        if rows:
            db.table("scenes").insert(rows).execute()
        if any(row["video_path"] for row in rows):
            _finish(lesson_id, status="ready")
        else:
            _finish(lesson_id, status="failed", error="We couldn't animate this topic. Try rephrasing it.")
    except Exception:
        log.exception("Lesson %s failed", lesson_id)
        _finish(lesson_id, status="failed", error="Something went wrong while creating this lesson. Please try again.")


def expire_stale_lessons() -> None:
    (
        db.table("lessons")
        .update({"status": "failed", "error": "This lesson took too long. Please try again.", "finished_at": now_iso()})
        .in_("status", ACTIVE)
        .lt("created_at", now_iso(timedelta(minutes=STALE_AFTER_MINUTES)))
        .execute()
    )


def delete_old_tutor_logs() -> None:
    db.table("tutor_messages").delete().lt("created_at", window_start()).execute()


def clean_up() -> None:
    expire_stale_lessons()
    delete_old_tutor_logs()
