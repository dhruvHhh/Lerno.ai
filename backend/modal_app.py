import modal

app = modal.App("lerno")
image = modal.Image.debian_slim(python_version="3.12").uv_sync().add_local_python_source("app")
secrets = [modal.Secret.from_name("lerno-secrets")]


@app.function(image=image, secrets=secrets, timeout=15 * 60)
def generate_lesson(lesson_id: str) -> None:
    from app.services import pipeline

    pipeline.run(lesson_id)
