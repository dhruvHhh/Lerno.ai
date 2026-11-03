from uuid import UUID

import anthropic
from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user
from app.config import TUTOR_MESSAGE_LIMIT
from app.db import lesson_scenes, log_use, owned_lesson, unlog_use
from app.schemas import MessageCreate, PlaybackPosition
from app.services import llm, prompts

router = APIRouter(prefix="/lessons/{lesson_id}/messages")


def _tutor_instructions(lesson: dict, position: PlaybackPosition) -> str:
    scenes = lesson_scenes(lesson["id"], ("title", "narration"))
    if position.scene_position > len(scenes):
        raise HTTPException(422, f"This lesson has {len(scenes)} scenes.")
    return prompts.tutor_prompt(lesson["topic"], lesson["audience"], scenes, position.scene_position, position.time_seconds)


@router.post("", status_code=201)
def create_message(lesson_id: UUID, body: MessageCreate, user_id: str = Depends(current_user)):
    lesson = owned_lesson(lesson_id, user_id, ("id", "topic", "audience", "status"))
    if lesson["status"] != "ready":
        raise HTTPException(409, "The tutor can help once the lesson is ready.")
    # Built before counting, so a failure here doesn't use up a question.
    system = _tutor_instructions(lesson, body)
    log_id = log_use(
        "tutor_messages",
        user_id,
        TUTOR_MESSAGE_LIMIT,
        f"You can ask {TUTOR_MESSAGE_LIMIT} questions every 24 hours. Please try again later.",
    )
    try:
        reply = llm.tutor_reply(system, body.model_dump()["messages"])
    except Exception as error:
        # No answer, so the question doesn't use up one of the user's daily questions.
        unlog_use("tutor_messages", log_id)
        if isinstance(error, anthropic.APIError):
            raise HTTPException(503, "The tutor is busy right now. Please try again in a moment.")
        raise
    return {"role": "assistant", "content": reply}
