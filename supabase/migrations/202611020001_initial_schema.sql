-- Ministros da Palavra: initial data model and row-level access policies.
create extension if not exists pgcrypto;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create table if not exists public.ministers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  whatsapp text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  event_date date not null,
  event_time time not null,
  kind text not null default 'Missa',
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  minister_id uuid not null references public.ministers(id),
  role text not null check (length(trim(role)) > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'not_completed')),
  created_at timestamptz not null default now(),
  unique (event_id, minister_id)
);

create index if not exists assignments_minister_id_idx on public.assignments(minister_id);
create index if not exists events_event_date_idx on public.events(event_date);

alter table public.ministers enable row level security;
alter table public.events enable row level security;
alter table public.assignments enable row level security;

drop policy if exists "authorized team can read ministers" on public.ministers;
create policy "authorized team can read ministers" on public.ministers
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can add ministers" on public.ministers;
create policy "authorized team can add ministers" on public.ministers
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can update ministers" on public.ministers;
create policy "authorized team can update ministers" on public.ministers
  for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));

drop policy if exists "authorized team can read events" on public.events;
create policy "authorized team can read events" on public.events
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can add events" on public.events;
create policy "authorized team can add events" on public.events
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can update events" on public.events;
create policy "authorized team can update events" on public.events
  for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can delete events" on public.events;
create policy "authorized team can delete events" on public.events
  for delete to authenticated using (public.current_app_role() in ('admin', 'editor'));

drop policy if exists "authorized team can read assignments" on public.assignments;
create policy "authorized team can read assignments" on public.assignments
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can add assignments" on public.assignments;
create policy "authorized team can add assignments" on public.assignments
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can update assignments" on public.assignments;
create policy "authorized team can update assignments" on public.assignments
  for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can delete assignments" on public.assignments;
create policy "authorized team can delete assignments" on public.assignments
  for delete to authenticated using (public.current_app_role() in ('admin', 'editor'));

