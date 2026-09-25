# Lerno.ai — Production Rebuild Handoff

Context notes from the analysis of the hackathon prototype (this repo), for continuing the
rebuild in a new folder. Written 2026-09-25.

**How to resume:** copy this file into the new project folder (e.g. `C:\Users\surya\dev\lerno\docs\`),
open Claude Code there, and say: "Read docs/rebuild-handoff.md and continue the brainstorming."

---

## 1. What the prototype does

**User flow:** Landing → Login/Signup (Firebase Auth) → `/chat` prompt input → `POST /input-data`
→ `/learning` page (videos + narration + quiz + AI chatbot + notes).

**Backend** (`backend/main.py`, single 559-line FastAPI file) — pipeline per request:

1. Classify prompt into `{topic, audience}` (Gemini if `GOOGLE_API_KEY` set, else Claude).
2. Fetch Wikipedia context → Claude generates a 3-frame storyboard (JSON).
3. Per frame, Claude generates: narration (≤30 words), animation description, MCQ (4 choices +
   correct index), free-response Q&A.
4. Per frame, Claude generates Manim CE 0.19 code → `subprocess` runs `manim -ql` → MP4 uploaded to
   Firebase Storage, made public.
5. All synchronous in one HTTP request: ~8 LLM calls + 3 renders ≈ minutes.

The prompts (storyboard, scene, Manim code rules) in `main.py` are worth reusing as a starting point.

**Frontend:** React 18 + Vite + Tailwind 4 + Aceternity UI components (`src/ui/`).

- `LearningPage.tsx` is a 1,143-line god component.
- Murf (TTS + translation), Vapi (phone call) and Gemini (chatbot) are called directly from the browser.
- Notes stored in Firestore `userNotes/{userId}`, userId from `localStorage`.
- `backend/twilio.cjs`: separate Express server for Twilio→Vapi voice, not wired in.

## 2. Problems found

### Security — act on these regardless of the rebuild

- [ ] **Firebase admin service-account key committed in git history**
      (`backend/lerno-998e4-firebase-adminsdk-fbsvc-e467c59e40.json`). If the repo is/was public,
      revoke it in Google Cloud Console → IAM → Service Accounts → Keys.
- [ ] Current key `...091c2c1fa8.json` is untracked but **not in `.gitignore`** — add
      `*adminsdk*.json` to `.gitignore`.
- [ ] **Murf, Vapi and Gemini API keys are shipped to the browser** via `VITE_*` env vars —
      extractable from the JS bundle. Rotate them.
- LLM-generated Python is executed on the server with no sandbox (prompt injection → RCE / key
  exfiltration).
- No auth or rate limiting on the API; CORS `*`. Anyone can burn the Claude credits.

### Correctness

- Every request **deletes all `.mp4`s in the bucket**; `/learning` lists the _whole bucket_ rather
  than this request's videos → concurrent users clobber each other.
- Frontend hardcodes `http://localhost:8000`.
- Vapi call sends a hardcoded "Vectors" topic.
- Lesson data only lives in router state → refreshing `/learning` loses it; no lesson history.

### Hosting blockers

- Rendering needs Manim + LaTeX + ffmpeg + cairo: large image, lots of RAM, long jobs. Most free
  PaaS tiers time out or OOM.
- Firebase Storage requires the paid Blaze plan for new buckets (since late 2024).
- Claude API is paid — LLM cost must be planned.

## 3. Decisions made so far

- **New project from scratch**, in a new folder **outside OneDrive** (sync fights with
  `node_modules`/`venv`). This repo stays as read-only reference.
- **v1 scope = B:** auth; prompt → rendered lesson (videos, narration text, quiz); lesson history;
  AI tutor chatbot (moved server-side); notes.
  Deferred: Murf TTS/translation, Vapi/Twilio phone tutor, pricing.

## 4. Open question (next to answer)

**LLM budget:**

- A. Claude only — best Manim quality, ~$0.05–0.15/lesson, needs spend cap + per-user limits.
- B. Gemini free tier only — $0, rate-limited, more render failures, needs retry loop.
- C. **Hybrid (recommended)** — Gemini free for classify/storyboard/quiz/chatbot; Claude only for
  Manim code generation, with render-error-feedback retries.

Remaining brainstorming steps after that: propose architecture approaches → present design in
sections → write spec → implementation plan.

## 5. Free hosting sketch (to be finalized)

| Piece               | Candidate (free)                                                                        | Notes                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Frontend            | Cloudflare Pages / Vercel                                                               | Static Vite build                                                                                                               |
| API + render worker | Hugging Face Spaces (Docker) or Oracle Cloud Always Free ARM VM                         | HF: 2 vCPU/16 GB RAM, sleeps when idle. Oracle: 4 OCPU/24 GB, always on, harder signup. Render/Railway free too small for Manim |
| Auth + DB           | Supabase (auth + Postgres) or Firebase Auth + Firestore (Spark)                         |                                                                                                                                 |
| Video storage       | Cloudflare R2 (10 GB, zero egress) or Supabase Storage (1 GB)                           |                                                                                                                                 |
| Job flow            | Submit → `lessonId` → poll/SSE progress; lessons persisted                              | Replaces the minutes-long sync request                                                                                          |
| Render isolation    | Sandboxed subprocess: no env secrets, no network, CPU/time/memory limits, AST allowlist |                                                                                                                                 |
