from datetime import datetime, timedelta, timezone
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


def lessons_last_24h(user_id: str | None = None) -> int:
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    query = db.table("lessons").select("id", count="exact", head=True).gte("created_at", since.isoformat())
    if user_id:
        query = query.eq("user_id", user_id)
    return query.execute().count
