import modal

app = modal.App("lerno")
image = modal.Image.debian_slim(python_version="3.12").uv_sync().add_local_python_source("app")
secrets = [modal.Secret.from_name("lerno-secrets")]


@app.function(image=image, secrets=secrets, timeout=15 * 60)
def generate_lesson(lesson_id: str) -> None:
    from app.services import pipeline

    pipeline.run(lesson_id)


@app.function(image=image, secrets=secrets)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def api():
    from app.main import app as web_app

    web_app.state.start_generation = generate_lesson.spawn
    return web_app


@app.function(image=image, secrets=secrets, schedule=modal.Period(minutes=5))
def expire_stale_lessons() -> None:
    from app.services import pipeline

    pipeline.expire_stale_lessons()
