import modal

# The app ships with its non-Python files too, so the render image can add the scene kit's fonts, theme and logo.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_sync()
    .add_local_python_source("app", ignore=["**/__pycache__/**"])
)
app = modal.App("lerno", image=image, secrets=[modal.Secret.from_name("lerno-secrets")])


# Must stay under STALE_AFTER_MINUTES, so a job never outlives the "too slow" check.
@app.function(timeout=20 * 60)
def generate_lesson(lesson_id: str) -> None:
    from app.services import pipeline

    pipeline.run(lesson_id)


# Stays up 15 minutes after the last request, so a user who stops to watch a video never waits for a cold start.
@app.function(scaledown_window=15 * 60)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def api():
    from app.main import app as web_app

    web_app.state.start_generation = generate_lesson.spawn
    return web_app


@app.function(schedule=modal.Period(minutes=5))
def clean_up() -> None:
    from app.services import pipeline

    pipeline.clean_up()
