from fastapi import APIRouter, Depends

from app.auth import current_user
from app.config import DAILY_ATTEMPT_LIMIT, DAILY_LESSON_LIMIT
from app.db import count_last_24h, lessons_used

router = APIRouter(prefix="/usage")


@router.get("")
def read_usage(user_id: str = Depends(current_user)):
    return {
        "used": lessons_used(user_id),
        "limit": DAILY_LESSON_LIMIT,
        "tries": count_last_24h("lessons", user_id),
        "try_limit": DAILY_ATTEMPT_LIMIT,
    }
