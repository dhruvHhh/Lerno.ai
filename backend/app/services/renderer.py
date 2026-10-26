import logging
from pathlib import Path
from typing import NamedTuple

import modal

KIT = Path(__file__).parent.parent / "scene_kit"
TEXLIVE_2024 = "https://ftp.math.utah.edu/pub/tex/historic/systems/texlive/2024/tlnet-final"
WORK_DIR = "/tmp/lesson"

MANIM_IMAGE = (
    modal.Image.from_registry("manimcommunity/manim:v0.19.0")
    .apt_install("ffmpeg")
    .run_commands(f"tlmgr option repository {TEXLIVE_2024} && tlmgr install unicode-math firamath")
    .add_local_dir(KIT / "fonts", "/usr/share/fonts/truetype/geist", copy=True)
    .run_commands("fc-cache -f")
    .workdir(WORK_DIR)
    .add_local_file(KIT / "lerno_theme.py", f"{WORK_DIR}/lerno_theme.py")
    .add_local_file(KIT / "logo.png", f"{WORK_DIR}/logo.png")
)

VIDEO_FILE = f"{WORK_DIR}/media/videos/scene/720p30/LessonScene.mp4"
BRANDED_FILE = f"{WORK_DIR}/branded.mp4"
THUMBNAIL_FILE = f"{WORK_DIR}/thumbnail.webp"
LOGO_OVERLAY = "[1]scale=-1:40,format=rgba,colorchannelmixer=aa=0.55[logo];[0][logo]overlay=W-w-26:H-h-22"
# Where the drawing is mostly done.
THUMBNAIL_AT = 0.6
THUMBNAIL_WIDTH = 960

MANIM_SECONDS = 170
# Stays under the 60 seconds where Modal's own time limit stops working.
FFMPEG_SECONDS = 30
TIMEOUT_EXIT_CODE = 124

TIMED_OUT = f"Rendering took longer than {MANIM_SECONDS} seconds. Make the animation shorter and simpler."
NO_VIDEO = "Manim produced no video. The scene needs at least one self.play() animation."
log = logging.getLogger(__name__)


class Rendered(NamedTuple):
    video: bytes
    thumbnail: bytes | None
    duration: float | None


def _run(sandbox: modal.Sandbox, *command: str, timeout: int | None = None):
    process = sandbox.exec(*command, timeout=timeout)
    process.wait()
    return process


def _ffmpeg(sandbox: modal.Sandbox, *args: str):
    return _run(sandbox, "ffmpeg", "-loglevel", "error", "-y", *args, timeout=FFMPEG_SECONDS)


def _error_text(manim) -> str:
    if manim.returncode == TIMEOUT_EXIT_CODE:
        return TIMED_OUT
    # Manim logs the real error, like a LaTeX one, to stdout; stderr only has the traceback.
    output = f"{manim.stdout.read()[-2000:]}\n{manim.stderr.read()[-1500:]}".strip()
    return output or f"Manim failed with exit code {manim.returncode} and printed nothing."


def _stamp_logo(sandbox: modal.Sandbox) -> str:
    # faststart puts the index first, so playback starts before the whole file arrives.
    ffmpeg = _ffmpeg(
        sandbox, "-i", VIDEO_FILE, "-i", "logo.png", "-filter_complex", LOGO_OVERLAY,
        "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", BRANDED_FILE,
    )
    if ffmpeg.returncode == 0:
        return BRANDED_FILE
    # A missing logo is not worth losing a good scene over.
    log.warning("Logo stamp failed: %s", ffmpeg.stderr.read()[-500:])
    return VIDEO_FILE


def _duration(sandbox: modal.Sandbox, video: str) -> float | None:
    probe = _run(
        sandbox, "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video,
        timeout=FFMPEG_SECONDS,
    )
    try:
        return float(probe.stdout.read())
    except ValueError:
        log.warning("Reading the video length failed: %s", probe.stderr.read()[-500:])
        return None


def _thumbnail(sandbox: modal.Sandbox, video: str, duration: float) -> bytes | None:
    ffmpeg = _ffmpeg(
        sandbox, "-ss", f"{duration * THUMBNAIL_AT:.2f}", "-i", video, "-frames:v", "1",
        "-vf", f"scale={THUMBNAIL_WIDTH}:-2", "-c:v", "libwebp", "-quality", "80", THUMBNAIL_FILE,
    )
    if ffmpeg.returncode == 0:
        return sandbox.filesystem.read_bytes(THUMBNAIL_FILE)
    log.warning("Thumbnail failed: %s", ffmpeg.stderr.read()[-500:])
    return None


def render(code: str) -> tuple[Rendered | None, str]:
    # AI-written code only ever runs here: isolated, no network, no secrets.
    sandbox = modal.Sandbox.create(image=MANIM_IMAGE, block_network=True, timeout=300, cpu=2, memory=2048)
    try:
        sandbox.filesystem.write_text(code, f"{WORK_DIR}/scene.py")
        # Linux timeout, not Modal's: above 60 seconds Modal raises an error instead of reporting the time-out.
        manim = _run(sandbox, "timeout", str(MANIM_SECONDS), "manim", "-qm", "--progress_bar", "none", "scene.py", "LessonScene")
        if manim.returncode != 0:
            return None, _error_text(manim)
        if _run(sandbox, "test", "-s", VIDEO_FILE).returncode != 0:
            return None, NO_VIDEO
        video = _stamp_logo(sandbox)
        duration = _duration(sandbox, video)
        thumbnail = _thumbnail(sandbox, video, duration) if duration else None
        return Rendered(sandbox.filesystem.read_bytes(video), thumbnail, duration), ""
    finally:
        sandbox.terminate()
