create table lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  topic text not null,
  title text,
  audience text not null check (audience in ('school', 'high_school', 'college')),
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  step int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  -- When the lesson became ready or failed; used to estimate the wait.
  finished_at timestamptz
);
create index lessons_user_created on lessons (user_id, created_at desc);
create index lessons_created on lessons (created_at);

create table scenes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  position int not null,
  title text not null,
  narration text not null,
  manim_code text,
  video_path text,
  mcq_question text not null,
  mcq_choices jsonb not null,
  mcq_correct_index int not null,
  fr_question text not null,
  fr_answer text not null,
  unique (lesson_id, position)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  -- Where in the lesson the note was taken: which scene, and how far into its video.
  scene_position int not null check (scene_position between 1 and 3),
  time_seconds real not null check (time_seconds >= 0),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_lesson_moment on notes (lesson_id, scene_position, time_seconds);

create table tutor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create index tutor_messages_user_created on tutor_messages (user_id, created_at);

-- Only the backend (service key) may touch these tables.
alter table lessons enable row level security;
alter table scenes enable row level security;
alter table notes enable row level security;
alter table tutor_messages enable row level security;
grant select, insert, update, delete on lessons, scenes, notes, tutor_messages to service_role;

insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
