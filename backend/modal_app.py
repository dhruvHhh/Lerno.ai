import modal

# The app ships with its non-Python files too, so the render sandbox gets the scene kit's logo.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_sync()
    .add_local_python_source("app", ignore=["**/__pycache__/**"])
)
app = modal.App("lerno", image=image, secrets=[modal.Secret.from_name("lerno-secrets")])


@app.function(timeout=15 * 60)
def generate_lesson(lesson_id: str) -> None:
    from app.services import pipeline

    pipeline.run(lesson_id)


@app.function()
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
