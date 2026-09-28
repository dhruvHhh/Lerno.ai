create table lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  topic text not null,
  audience text not null check (audience in ('school', 'high_school', 'college')),
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  step int not null default 0,
  error text,
  created_at timestamptz not null default now()
);
create index lessons_user_created on lessons (user_id, created_at desc);
create index lessons_created on lessons (created_at);

create table scenes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons on delete cascade,
  position int not null,
  title text not null,
  narration text not null,
  manim_code text not null,
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
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_lesson_created on notes (lesson_id, created_at);

-- Only the backend (service key) may touch these tables.
alter table lessons enable row level security;
alter table scenes enable row level security;
alter table notes enable row level security;
grant select, insert, update, delete on lessons, scenes, notes to service_role;

insert into storage.buckets (id, name, public) values ('videos', 'videos', false);
