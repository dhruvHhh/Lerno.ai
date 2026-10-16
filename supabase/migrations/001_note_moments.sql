-- Notes are pinned to a moment in a scene and no longer have a title.
-- Run once in the Supabase SQL editor; schema.sql already has the result.
alter table notes
  drop column title,
  add column scene_position int not null default 1 check (scene_position between 1 and 3),
  add column time_seconds real not null default 0 check (time_seconds >= 0);

-- The defaults only fill rows that already exist; new notes must say where they belong.
alter table notes
  alter column scene_position drop default,
  alter column time_seconds drop default;

drop index notes_lesson_created;
create index notes_lesson_moment on notes (lesson_id, scene_position, time_seconds);
