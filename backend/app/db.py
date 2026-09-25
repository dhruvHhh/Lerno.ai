from fastapi import HTTPException
from supabase import Client, create_client

from app.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

db: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def owned_lesson(lesson_id: str, user_id: str) -> dict:
    rows = db.table("lessons").select("*").eq("id", lesson_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(404, "Lesson not found")
    return rows[0]
