-- A scene's narration in another language, made the first time a student picks it: the same video with a new voice.
-- Run once in the Supabase SQL editor; schema.sql already has the result.
create table scene_voices (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  -- Kept here so the daily limit is one simple count, like notes and tutor messages.
  user_id uuid not null references auth.users on delete cascade,
  position int not null,
  language text not null check (language in ('hi', 'ta', 'bn')),
  status text not null default 'making' check (status in ('making', 'ready', 'failed')),
  narration text,
  word_starts_ms int[],
  video_path text,
  created_at timestamptz not null default now(),
  unique (lesson_id, position, language)
);
create index scene_voices_user_created on scene_voices (user_id, created_at);
alter table scene_voices enable row level security;
grant select, insert, update, delete on scene_voices to service_role;
