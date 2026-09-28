import httpx
from fastapi import HTTPException
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions

from app.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

# The default HTTP/2 connection drops under parallel requests; HTTP/1.1 pools safely.
db: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY, SyncClientOptions(httpx_client=httpx.Client(timeout=30)))


def owned_lesson(lesson_id: str, user_id: str, fields: tuple[str, ...] = ("*",)) -> dict:
    rows = db.table("lessons").select(*fields).eq("id", lesson_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(404, "Lesson not found")
    return rows[0]
