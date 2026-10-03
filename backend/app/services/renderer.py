import logging
from pathlib import Path

import modal
from modal.exception import SandboxFilesystemNotFoundError

KIT = Path(__file__).parent.parent / "scene_kit"
HISTORIC_TEXLIVE = "https://ftp.math.utah.edu/pub/tex/historic/systems/texlive/2024/tlnet-final"
GEIST = "https://github.com/vercel/geist-font/releases/download/v1.7.2/geist-font-v1.7.2.zip"
GEIST_WEIGHTS = ("Regular", "Medium", "SemiBold", "Bold")
UNPACK_GEIST = (
    "import io, urllib.request, zipfile; "
    f"z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen('{GEIST}').read())); "
    f"[open(f'/usr/share/fonts/truetype/Geist-{{w}}.ttf', 'wb').write(z.read(f'geist-font/Geist/ttf/Geist-{{w}}.ttf')) for w in {GEIST_WEIGHTS}]"
)
# Stock Manim plus what the Lerno theme needs: Fira Math, the Geist font and ffmpeg for the corner logo.
MANIM_IMAGE = (
    modal.Image.from_registry("manimcommunity/manim:v0.19.0")
    .apt_install("ffmpeg")
    .run_commands(
        f"tlmgr option repository {HISTORIC_TEXLIVE} && tlmgr install unicode-math firamath",
        f'python -c "{UNPACK_GEIST}" && fc-cache -f',
    )
)
WORK_DIR = "/tmp/lesson"
VIDEO_FILE = f"{WORK_DIR}/media/videos/scene/720p30/LessonScene.mp4"
BRANDED_FILE = f"{WORK_DIR}/branded.mp4"
LOGO_OVERLAY = "[1]scale=-1:40,format=rgba,colorchannelmixer=aa=0.55[logo];[0][logo]overlay=W-w-26:H-h-22"
log = logging.getLogger(__name__)


def _stamp_logo(sandbox: modal.Sandbox) -> bytes:
    process = sandbox.exec(
        "ffmpeg", "-loglevel", "error", "-y", "-i", VIDEO_FILE, "-i", "logo.png", "-filter_complex", LOGO_OVERLAY,
        "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", BRANDED_FILE, workdir=WORK_DIR, timeout=60,
    )
    process.wait()
    if process.returncode == 0:
        return sandbox.filesystem.read_bytes(BRANDED_FILE)
    # A missing logo is not worth losing a good scene over.
    log.warning("Logo stamp failed: %s", process.stderr.read()[-500:])
    return sandbox.filesystem.read_bytes(VIDEO_FILE)


def render(code: str) -> tuple[bytes | None, str]:
    # AI-written code only ever runs here: isolated, no network, no secrets.
    sandbox = modal.Sandbox.create(image=MANIM_IMAGE, block_network=True, timeout=300, cpu=2, memory=2048)
    try:
        sandbox.exec("mkdir", "-p", WORK_DIR).wait()
        sandbox.filesystem.write_text(code, f"{WORK_DIR}/scene.py")
        sandbox.filesystem.write_text((KIT / "lerno_theme.py").read_text(encoding="utf-8"), f"{WORK_DIR}/lerno_theme.py")
        sandbox.filesystem.write_bytes((KIT / "logo.png").read_bytes(), f"{WORK_DIR}/logo.png")
        process = sandbox.exec(
            "manim", "-qm", "--progress_bar", "none", "scene.py", "LessonScene", workdir=WORK_DIR, timeout=180
        )
        process.wait()
        if process.returncode != 0:
            error = process.stderr.read()[-3000:].strip()
            return None, error or "Rendering took longer than 180 seconds. Make the animation shorter and simpler."
        try:
            return _stamp_logo(sandbox), ""
        except SandboxFilesystemNotFoundError:
            return None, "Manim produced no video. The scene needs at least one self.play() animation."
    finally:
        sandbox.terminate()
