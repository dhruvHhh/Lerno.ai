# Lerno.ai v1 — Design Spec

Date: 2026-09-25 · Status: approved in brainstorming, pending written review

Lerno.ai turns a topic into a short animated lesson: 3 scenes, each with a Manim video, narration
text, a multiple-choice question and a free-response question, plus an AI tutor and notes.
This is a from-scratch, production-ready rebuild of the hackathon prototype
(analysis in `docs/rebuild-handoff.md`).

## 1. Goals and scope

**In v1**
- Email + password and Google sign-in (Supabase Auth)
- Create a lesson from a topic + audience; live progress while it generates
- Lesson view: scene tabs, video, narration text, quiz, AI tutor chat, notes
- "My lessons" history
- Hosted for free (Cloudflare Workers, Modal, Supabase)

**Not in v1** (deferred): narration audio / TTS, translation, phone tutor (Vapi/Twilio), pricing,
deleting lessons, shareable lessons, saved chat history, saved quiz scores, error tracking (Sentry).

## 2. Working rules

- User is learning: after each file, explain in 1–2 plain-English sentences what it does.
- Code: clean, simple, modular, DRY. Comments only where absolutely necessary, short and plain.
- API is strictly CRUD / resource-oriented.
- No test files.
- Frontend is built one page at a time; backend one file at a time. Each page/file waits for the
  user's review and approval before the next starts.

## 3. Architecture

```
Browser (React + Aceternity, Cloudflare Workers)
  │ login ─────────────────► Supabase Auth (JWT)
  │ API calls + JWT ───────► FastAPI on Modal (single web endpoint)
  │                            ├ verifies JWT, enforces limits
  │                            ├ inserts lesson (status=queued)
  │                            └ generate_lesson.spawn(lesson_id)
  │ poll GET /lessons/{id} every 3s
  ▼
generate_lesson (Modal function, 15 min timeout)
  1. Sonnet: plan lesson (3 scenes, structured output)
  2. Sonnet ×3 in parallel: Manim code per scene
  3. Modal Sandbox ×3 in parallel: render (no network, no secrets, 2 min cap)
     └ on error: send stderr + code to Claude for a fix, up to 2 retries
  4. upload MP4s to Supabase Storage (private bucket)
  5. status = ready | failed
```

- The frontend talks to Supabase **only for auth**; all data goes through FastAPI.
- AI-generated code runs **only** inside Modal Sandboxes (gVisor, `block_network=True`).

## 4. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite, React, TypeScript, Tailwind 4, Aceternity UI (free components via shadcn CLI), React Router, axios, `@supabase/supabase-js` |
| Backend | Python, FastAPI, `anthropic` SDK, `supabase` Python client, PyJWT, Pydantic, `uv` |
| Compute | Modal: `@modal.asgi_app` for the API, a Modal function for generation, Modal Sandboxes for rendering |
| Data | Supabase Postgres, Auth, Storage (free plan) |
| LLMs | Claude Sonnet 5 (`claude-sonnet-5`) for lesson plan + Manim code; Claude Haiku 4.5 (`claude-haiku-4-5`) for the tutor |
| Hosting | Cloudflare Workers static assets (frontend), Modal (backend), Supabase |

No LangChain, no Wikipedia lookup, no TanStack Query.

## 5. Backend

### 5.1 Layout
```
backend/
  pyproject.toml, uv.lock, .env.example
  modal_app.py          Modal app: images, secret, web endpoint, generate_lesson
  app/
    main.py             FastAPI app, CORS, routers
    config.py           settings from env
    auth.py             verifies Supabase JWT via the project's JWKS (PyJWT) → user id
    db.py               Supabase client
    schemas.py          Pydantic request/response models
    routes/  lessons.py, notes.py, messages.py, usage.py
    services/
      prompts.py        all prompt texts
      llm.py            Claude calls, structured output parsing
      pipeline.py       generate_lesson steps
      renderer.py       render one scene in a Modal Sandbox
```

### 5.2 API (all require auth except `/health`)

| Method | Path | Behaviour |
|---|---|---|
| GET | `/health` | Runs one tiny DB query; returns `{ok: true}` |
| GET | `/usage` | `{used, limit}` for today (UTC) |
| POST | `/lessons` | Body `{topic, audience}` → `201 {id}`; spawns generation. `429` if daily limit reached |
| GET | `/lessons` | Caller's lessons, newest first: id, topic, audience, status, created_at |
| GET | `/lessons/{id}` | Lesson + step + scenes; scenes include 1-hour signed `video_url` (or null) |
| POST | `/lessons/{id}/notes` | Body `{title, content}` → created note |
| GET | `/lessons/{id}/notes` | Notes for that lesson |
| PATCH | `/lessons/{id}/notes/{note_id}` | Partial update `{title?, content?}` |
| DELETE | `/lessons/{id}/notes/{note_id}` | `204` |
| POST | `/lessons/{id}/messages` | Body `{messages: [{role, content}]}` → `{reply}`; nothing stored |

Validation: `topic` 3–200 chars; `audience` ∈ `school | high_school | college`;
note title ≤ 120 chars, content ≤ 5,000; chat: at most 10 messages, each ≤ 500 chars.
Another user's lesson/note → `404`.

### 5.3 Database (`supabase/schema.sql`)

- **lessons**: `id uuid pk`, `user_id uuid → auth.users`, `topic text`, `audience text`,
  `status text` (`queued | generating | ready | failed`), `step int` (0–3), `error text`,
  `created_at timestamptz`
- **scenes**: `id uuid pk`, `lesson_id → lessons (cascade)`, `position int` (1–3), `title`,
  `narration`, `manim_code`, `video_path` (null if render failed), `mcq_question`,
  `mcq_choices jsonb`, `mcq_correct_index int`, `fr_question`, `fr_answer`
- **notes**: `id uuid pk`, `lesson_id → lessons (cascade)`, `user_id`, `title`, `content`,
  `created_at`, `updated_at`
- RLS **enabled with no policies** on all tables (anon key can read nothing; backend uses the
  service-role key).
- Storage: private bucket `videos`, path `{user_id}/{lesson_id}/scene_{n}.mp4`.

### 5.4 Rules
- **Daily limit:** 3 lessons per user per UTC day; `failed` lessons don't count.
- **Stale jobs:** a lesson not `ready`/`failed` 20 minutes after creation is returned as `failed`.
- **Errors:** users see friendly messages; technical details go to logs only.

### 5.5 Generation pipeline
| step | status | label (frontend) | work |
|---|---|---|---|
| 0 | queued | Queued | — |
| 1 | generating | Planning your lesson | 1 Sonnet call, structured output: 3 scenes × {title, narration (≤30 words), animation description, MCQ (4 choices, random correct index), free-response Q + A} |
| 2 | generating | Writing animations | 3 parallel Sonnet calls → Manim CE code, class `Scene{n}` |
| 3 | generating | Rendering videos | 3 parallel sandboxes; fix-and-retry ×2 per scene; upload MP4 |
| — | ready / failed | — | `ready` if ≥1 video rendered, else `failed` |

- Prompts are passed without `str.format` brace-escaping (fixes the prototype's broken LaTeX,
  e.g. `\vec` rendered as `ecv`).
- The Manim prompt keeps the prototype's proven rules (simple sequential animations, no loops,
  no overlapping text, safe coordinates, font sizes).
- Anthropic SDK auto-retries transient errors (2 retries); then the lesson fails.
- Claude calls use `client.messages.parse(output_format=<Pydantic model>)` for structured output.
  Sonnet 5 rejects `temperature`/`top_p` and assistant prefill, so neither is used.

### 5.6 Sandbox renderer
- Image: Debian + Manim CE + LaTeX (minimal TeX packages) + ffmpeg, defined once in `modal_app.py`.
- Per scene: create sandbox (`block_network=True`, 2 min timeout) → write code → run
  `manim -ql --media_dir ... scene.py Scene{n}` → read MP4 bytes → terminate.
- No secrets or Modal credentials inside the sandbox.

### 5.7 AI tutor
Haiku, system prompt with topic, audience and the 3 narrations; replies in the language of the
question (English, Hindi/Hinglish → Hindi); 2–4 sentences; max 400 output tokens.

## 6. Frontend

### 6.1 Layout
```
frontend/src/
  main.tsx                 router + providers
  lib/        supabase.ts, api.ts (axios instance + token interceptor), utils.ts
  hooks/      useAuth.ts, useLessons.ts, useNotes.ts, usePolling.ts
  components/ ui/ (Aceternity, untouched), Navbar, Footer, ProtectedRoute, AuthForm
  pages/      Home, Login, Signup, NewLesson, MyLessons, Lesson
    lesson/   SceneVideo, NarrationCard, QuizCard, TutorChat, NotesPanel, GeneratingView
```
Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

### 6.2 Pages (build + review order)
1. **Home** `/` — hero (Wavy Background), app preview (Container Scroll), How it works (3 steps),
   features (Card Hover Effect), CTA, footer. Only real claims and working links.
2. **Login / Signup** `/login`, `/signup` — shared `AuthForm`, email + Google, Sparkles background.
3. **New lesson** `/new` — Placeholders And Vanish Input for topic, audience pills
   (School / High school / College), "N of 3 lessons left today".
4. **Lesson** `/lessons/:id` — Multi Step Loader while generating (labels from §5.5);
   when ready: scene tabs 1–3, video, narration, quiz (MCQ instant feedback, free response shows
   model answer), tutor chat, notes drawer (Floating Dock). Failed scenes show content without video.
5. **My lessons** `/lessons` — grid with status badges.

`/new`, `/lessons`, `/lessons/:id` require login; after login → `/new`.
Style: dark theme, sparkles, purple/blue gradients — the prototype's look, more polished.

## 7. Hosting and operations

| Piece | Host | Deploy |
|---|---|---|
| Frontend | Cloudflare Workers (static assets) | Workers Builds: auto on push to `main`; `wrangler.jsonc` with SPA fallback (`not_found_handling: single-page-application`) |
| Backend | Modal | GitHub Action `modal deploy` on changes to `backend/` |
| DB/Auth/Storage | Supabase | `supabase/schema.sql` run once in SQL editor |

**Secrets**
- Modal secret `lerno-secrets`: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FRONTEND_URL`
- Cloudflare build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- GitHub Actions: `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`
- Local `.env` files are gitignored.

**Operations**
- Weekly GitHub Action cron hits `/health` so Supabase never auto-pauses.
- CORS allows only `FRONTEND_URL` and `http://localhost:5173`.
- Spend caps: Anthropic console monthly limit, Modal budget limit, 3 lessons/user/day.
- Local dev: `uv run modal serve modal_app.py` + `npm run dev`.

**Free-tier budget**
- Modal: $30/month credit; ~$0.003 compute per lesson.
- Supabase: 500 MB DB, 1 GB storage (~1,000 lessons at 480p), 5 GB egress/month.
- Claude: ~$0.05–0.15 per lesson (paid, capped).

## 8. Build order
1. Repo + Supabase schema
2. Backend: config/db/auth → lessons/usage/notes/messages routes → pipeline + renderer → Modal app;
   verify with real calls via `modal serve`
3. Frontend, one page at a time with review: Home → Auth → New lesson → Lesson → My lessons
4. Deploy: Supabase config (Google OAuth, redirect URLs) → Modal deploy + Action → Cloudflare Workers
   → keep-alive cron
