-- One row per topic check, so the AI check behind "New lesson" has a daily limit, like tutor messages.
-- Run once in the Supabase SQL editor; schema.sql already has the result.
create table topic_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create index topic_checks_user_created on topic_checks (user_id, created_at);
alter table topic_checks enable row level security;
grant select, insert, update, delete on topic_checks to service_role;
