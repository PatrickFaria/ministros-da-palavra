-- Save optional time-of-day preferences directly with each minister.
alter table public.ministers
  add column if not exists preferred_times text[] not null default '{}';
