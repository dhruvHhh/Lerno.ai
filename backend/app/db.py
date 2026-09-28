from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import HTTPException
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

# The default HTTP/2 connection drops under parallel requests; HTTP/1.1 pools safely.
db: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY, SyncClientOptions(httpx_client=httpx.Client(timeout=30)))


def owned_lesson(lesson_id: UUID, user_id: str, fields: tuple[str, ...] = ("*",)) -> dict:
    rows = db.table("lessons").select(*fields).eq("id", str(lesson_id)).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(404, "Lesson not found")
    return rows[0]


def lessons_today(user_id: str | None = None) -> int:
    midnight = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    query = db.table("lessons").select("id", count="exact").neq("status", "failed").gte("created_at", midnight.isoformat())
    if user_id:
        query = query.eq("user_id", user_id)
    return query.execute().count
