from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.db import db
from app.routes import lessons, messages, notes, usage

app = FastAPI(title="Lerno API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
for module in (lessons, notes, messages, usage):
    app.include_router(module.router)


@app.get("/health")
def health():
    # Touches the database so Supabase counts the project as active.
    db.table("lessons").select("id").limit(1).execute()
    return {"ok": True}
