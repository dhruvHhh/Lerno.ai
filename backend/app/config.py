import os

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
# A comma-separated list: the live site and local development.
FRONTEND_URLS = [url.strip().rstrip("/") for url in os.environ["FRONTEND_URL"].split(",")]
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "production") == "production"
# Optional: without it, lessons are made without a voice.
MURF_API_KEY = os.environ.get("MURF_API_KEY")

SCENES_PER_LESSON = 3
DAILY_LESSON_LIMIT = 3
# Failed lessons are free but still cost us, so all tries have their own limit.
DAILY_ATTEMPT_LIMIT = 6
GLOBAL_DAILY_LESSON_LIMIT = 50
NOTES_PER_LESSON_LIMIT = 100
# The largest page of lessons the sidebar may ask for; it picks its own size up to this.
LESSON_PAGE_LIMIT = 50
TUTOR_MESSAGE_LIMIT = 20
# Each new lesson's topic is checked by AI first; turned-away topics would otherwise cost us without limit.
TOPIC_CHECK_LIMIT = 20
STALE_AFTER_MINUTES = 25
# Languages a student adds to their lessons; a voice already made is free.
DAILY_VOICE_LIMIT = 6
VOICE_STALE_AFTER_MINUTES = 12
VIDEO_BUCKET = "videos"
VIDEO_URL_TTL_SECONDS = 3600
THUMBNAIL_BUCKET = "thumbnails"
# A thumbnail never changes once made, so browsers may keep it for good.
THUMBNAIL_CACHE_SECONDS = 365 * 24 * 3600
