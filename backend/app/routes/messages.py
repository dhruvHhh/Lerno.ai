from uuid import UUID

import anthropic
from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user
from app.db import db, owned_lesson
from app.schemas import MessageCreate
from app.services import llm, prompts

router = APIRouter(prefix="/lessons/{lesson_id}/messages")


@router.post("", status_code=201)
def create_message(lesson_id: UUID, body: MessageCreate, user_id: str = Depends(current_user)):
    lesson = owned_lesson(lesson_id, user_id, ("id", "topic", "audience"))
    scenes = db.table("scenes").select("narration").eq("lesson_id", lesson["id"]).order("position").execute().data
    system = prompts.tutor_prompt(lesson["topic"], lesson["audience"], [scene["narration"] for scene in scenes])
    try:
        reply = llm.tutor_reply(system, body.model_dump()["messages"])
    except anthropic.APIError:
        raise HTTPException(503, "The tutor is busy right now. Please try again in a moment.")
    return {"role": "assistant", "content": reply}
