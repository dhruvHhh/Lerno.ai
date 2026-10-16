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


def lesson_scenes(lesson_id: str, fields: tuple[str, ...]) -> list[dict]:
    return db.table("scenes").select(*fields).eq("lesson_id", lesson_id).order("position").execute().data


def now_iso(ago: timedelta = timedelta()) -> str:
    return (datetime.now(timezone.utc) - ago).isoformat()


def window_start() -> str:
    return now_iso(timedelta(hours=24))


def _last_24h(table: str, user_id: str | None = None):
    query = db.table(table).select("id", count="exact", head=True).gte("created_at", window_start())
    return query.eq("user_id", user_id) if user_id else query


def count_last_24h(table: str, user_id: str | None = None) -> int:
    return _last_24h(table, user_id).execute().count


def lessons_used(user_id: str) -> int:
    # Failed lessons are free: they don't count against the user's daily limit.
    return _last_24h("lessons", user_id).neq("status", "failed").execute().count
