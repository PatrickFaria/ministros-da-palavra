-- Save optional role preferences directly with each minister.
alter table public.ministers
  add column if not exists preferred_roles text[] not null default '{}';
