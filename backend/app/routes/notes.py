from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth import current_user
from app.config import NOTES_PER_LESSON_LIMIT
from app.db import db, now_iso, owned_lesson
from app.schemas import NoteCreate, NoteUpdate

router = APIRouter(prefix="/lessons/{lesson_id}/notes")

NOTE_FIELDS = ("id", "scene_position", "time_seconds", "content", "created_at", "updated_at")


def owned_lesson_id(lesson_id: UUID, user_id: str = Depends(current_user)) -> str:
    return owned_lesson(lesson_id, user_id, ("id",))["id"]


def _found(rows: list[dict]) -> dict:
    if not rows:
        raise HTTPException(404, "Note not found")
    return rows[0]


@router.post("", status_code=201)
def create_note(body: NoteCreate, lesson_id: str = Depends(owned_lesson_id), user_id: str = Depends(current_user)):
    row = {"lesson_id": lesson_id, "user_id": user_id, **body.model_dump()}
    note = _found(db.table("notes").insert(row).select(*NOTE_FIELDS).execute().data)
    # Counting after the insert stops parallel requests from slipping past the limit.
    count = db.table("notes").select("id", count="exact", head=True).eq("lesson_id", lesson_id).execute().count
    if count > NOTES_PER_LESSON_LIMIT:
        db.table("notes").delete().eq("id", note["id"]).execute()
        raise HTTPException(429, f"A lesson can have at most {NOTES_PER_LESSON_LIMIT} notes.")
    return note


@router.get("")
def list_notes(lesson_id: str = Depends(owned_lesson_id)):
    # In the order they appear in the lesson, so the notes card and the timeline markers line up.
    query = db.table("notes").select(*NOTE_FIELDS).eq("lesson_id", lesson_id)
    return query.order("scene_position").order("time_seconds").order("created_at").execute().data


@router.patch("/{note_id}")
def update_note(note_id: UUID, body: NoteUpdate, lesson_id: str = Depends(owned_lesson_id)):
    changes = body.model_dump() | {"updated_at": now_iso()}
    query = db.table("notes").update(changes).eq("id", str(note_id)).eq("lesson_id", lesson_id)
    return _found(query.select(*NOTE_FIELDS).execute().data)


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: UUID, lesson_id: str = Depends(owned_lesson_id)):
    _found(db.table("notes").delete().eq("id", str(note_id)).eq("lesson_id", lesson_id).execute().data)
