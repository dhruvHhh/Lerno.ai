import logging
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from app.config import VIDEO_BUCKET
from app.db import db
from app.schemas import ScenePlan
from app.services import llm, renderer

MAX_FIXES = 2
log = logging.getLogger(__name__)


def _update(lesson_id: str, **fields) -> None:
    db.table("lessons").update(fields).eq("id", lesson_id).execute()


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


def _scene_row(lesson: dict, position: int, scene: ScenePlan, code: str) -> dict:
    # One scene crashing must not take down the other two.
    try:
        video_path, code = _animate(lesson, position, code)
    except Exception:
        log.exception("Scene %s of lesson %s crashed", position, lesson["id"])
        video_path = None
    return {
        "lesson_id": lesson["id"],
        "position": position,
        "manim_code": code,
        "video_path": video_path,
        **scene.model_dump(exclude={"animation_description"}),
    }


def run(lesson_id: str) -> None:
    lesson = db.table("lessons").select("*").eq("id", lesson_id).single().execute().data
    try:
        _update(lesson_id, status="generating", step=1)
        scenes = llm.plan_lesson(lesson["topic"], lesson["audience"]).scenes[:3]
        with ThreadPoolExecutor() as pool:
            _update(lesson_id, step=2)
            codes = list(pool.map(llm.write_manim, scenes))
            _update(lesson_id, step=3)
            positions = range(1, len(scenes) + 1)
            rows = list(pool.map(partial(_scene_row, lesson), positions, scenes, codes))
        db.table("scenes").insert(rows).execute()
        if any(row["video_path"] for row in rows):
            _update(lesson_id, status="ready")
        else:
            _update(lesson_id, status="failed", error="We couldn't animate this topic. Try rephrasing it.")
    except Exception:
        log.exception("Lesson %s failed", lesson_id)
        _update(lesson_id, status="failed", error="Something went wrong while creating this lesson. Please try again.")
