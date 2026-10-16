-- Lessons get a short AI-written title and the time they finished.
-- Run once in the Supabase SQL editor; schema.sql already has the result.
-- Both stay empty for old lessons: the app falls back to the topic, and the wait estimate skips them.
alter table lessons
  add column title text,
  add column finished_at timestamptz;
