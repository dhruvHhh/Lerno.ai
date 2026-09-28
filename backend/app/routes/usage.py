from fastapi import APIRouter, Depends

from app.auth import current_user
from app.config import DAILY_LESSON_LIMIT
from app.db import lessons_last_24h

router = APIRouter(prefix="/usage")


@router.get("")
def read_usage(user_id: str = Depends(current_user)):
    return {"used": lessons_last_24h(user_id), "limit": DAILY_LESSON_LIMIT}
