import modal
from modal.exception import SandboxFilesystemNotFoundError

MANIM_IMAGE = modal.Image.from_registry("manimcommunity/manim:v0.19.0")
SCENE_FILE = "/tmp/scene.py"
VIDEO_FILE = "/tmp/media/videos/scene/480p15/LessonScene.mp4"


def render(code: str) -> tuple[bytes | None, str]:
    # AI-written code only ever runs here: isolated, no network, no secrets.
    sandbox = modal.Sandbox.create(image=MANIM_IMAGE, block_network=True, timeout=180, cpu=2, memory=2048)
    try:
        sandbox.filesystem.write_text(code, SCENE_FILE)
        process = sandbox.exec(
            "manim", "-ql", "--media_dir", "/tmp/media", "--progress_bar", "none",
            SCENE_FILE, "LessonScene", timeout=120,
        )
        process.wait()
        if process.returncode != 0:
            error = process.stderr.read()[-3000:].strip()
            return None, error or "Rendering took longer than 120 seconds. Make the animation shorter and simpler."
        try:
            return sandbox.filesystem.read_bytes(VIDEO_FILE), ""
        except SandboxFilesystemNotFoundError:
            return None, "Manim produced no video. The scene needs at least one self.play() animation."
    finally:
        sandbox.terminate()
