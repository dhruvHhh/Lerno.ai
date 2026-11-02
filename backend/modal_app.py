import logging

import modal

# The app ships with its non-Python files too, so the render image can add the scene kit's fonts, theme and logo.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_sync()
    .add_local_python_source("app", ignore=["**/__pycache__/**"])
)
app = modal.App("lerno", image=image, secrets=[modal.Secret.from_name("lerno-secrets")])
# Only the voice job needs ffmpeg, so the API image stays small.
dub_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .uv_sync()
    .add_local_python_source("app", ignore=["**/__pycache__/**"])
)

# Imported here, not in the job, so the memory snapshot holds the loaded code and a new machine skips loading it.
with dub_image.imports():
    from app.services import dub


# The jobs' info lines (step times, speed-ups) are hidden by default; the request lines of httpx stay hidden.
def _show_info() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)


# Must stay under STALE_AFTER_MINUTES, so a job never outlives the "too slow" check.
@app.function(timeout=20 * 60)
def generate_lesson(lesson_id: str, language: str | None = None) -> None:
    from app.services import pipeline

    _show_info()
    pipeline.run(lesson_id, language, dub_lesson.spawn)


# Must stay under VOICE_STALE_AFTER_MINUTES, so a job never outlives the "too slow" check. Stays up 5 minutes after a
# job, so a second language picked soon after does not wait for a new machine.
@app.function(image=dub_image, timeout=10 * 60, enable_memory_snapshot=True, scaledown_window=5 * 60)
def dub_lesson(lesson_id: str, language: str) -> None:
    _show_info()
    dub.run(lesson_id, language)


# Stays up 15 minutes after the last request, so a user who stops to watch a video never waits for a cold start.
@app.function(scaledown_window=15 * 60)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def api():
    from app.main import app as web_app

    web_app.state.start_generation = generate_lesson.spawn
    web_app.state.start_dub = dub_lesson.spawn
    return web_app


@app.function(schedule=modal.Period(minutes=5))
def clean_up() -> None:
    from app.services import pipeline

    pipeline.clean_up()
