-- Each scene gets a thumbnail made when it renders, and its length, so pages show them without opening videos.
-- Run once in the Supabase SQL editor; schema.sql already has the result.
-- The length stays empty for old scenes until the one-time thumbnail script fills it.
alter table scenes add column duration_seconds real;

-- Public so browsers can cache the thumbnails by a fixed link. Paths are lesson ids, which can't be guessed; listing and
-- writing still need the service key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 524288, array['image/webp']);
