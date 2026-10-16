from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import FRONTEND_URL, IS_PRODUCTION
from app.routes import lessons, messages, notes, usage

app = FastAPI(title="Lerno API", openapi_url=None if IS_PRODUCTION else "/openapi.json", redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
for module in (lessons, notes, messages, usage):
    app.include_router(module.router)


@app.exception_handler(RequestValidationError)
def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    # The rejected input is left out: it can hold values JSON can't send, like Infinity.
    errors = [{key: value for key, value in error.items() if key != "input"} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": jsonable_encoder(errors)})


@app.get("/health")
def health():
    return {"ok": True}
