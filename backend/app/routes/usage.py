from fastapi import APIRouter, Depends

from app.auth import current_user
from app.config import DAILY_LESSON_LIMIT
from app.db import count_last_24h

router = APIRouter(prefix="/usage")


@router.get("")
def read_usage(user_id: str = Depends(current_user)):
    return {"used": count_last_24h("lessons", user_id), "limit": DAILY_LESSON_LIMIT}
