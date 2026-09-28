from uuid import UUID

import anthropic
from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user
from app.config import TUTOR_MESSAGE_LIMIT
from app.db import count_last_24h, db, owned_lesson
from app.schemas import MessageCreate
from app.services import llm, prompts

router = APIRouter(prefix="/lessons/{lesson_id}/messages")


@router.post("", status_code=201)
def create_message(lesson_id: UUID, body: MessageCreate, user_id: str = Depends(current_user)):
    lesson = owned_lesson(lesson_id, user_id, ("id", "topic", "audience"))
    log_id = db.table("tutor_messages").insert({"user_id": user_id}).execute().data[0]["id"]
    if count_last_24h("tutor_messages", user_id) > TUTOR_MESSAGE_LIMIT:
        db.table("tutor_messages").delete().eq("id", log_id).execute()
        raise HTTPException(429, f"You can ask {TUTOR_MESSAGE_LIMIT} questions every 24 hours. Please try again later.")
    scenes = db.table("scenes").select("narration").eq("lesson_id", lesson["id"]).order("position").execute().data
    system = prompts.tutor_prompt(lesson["topic"], lesson["audience"], [scene["narration"] for scene in scenes])
    try:
        reply = llm.tutor_reply(system, body.model_dump()["messages"])
    except anthropic.APIError:
        raise HTTPException(503, "The tutor is busy right now. Please try again in a moment.")
    return {"role": "assistant", "content": reply}
