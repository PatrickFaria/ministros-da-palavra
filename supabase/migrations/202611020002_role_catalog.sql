create table if not exists public.minister_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.minister_roles enable row level security;

drop policy if exists "authorized team can read minister roles" on public.minister_roles;
create policy "authorized team can read minister roles" on public.minister_roles
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));
drop policy if exists "authorized team can add minister roles" on public.minister_roles;
create policy "authorized team can add minister roles" on public.minister_roles
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));

insert into public.minister_roles(name) values
  ('Comentarista/preces'),
  ('Primeira Leitura'),
  ('Segunda Leitura')
on conflict (name) do nothing;
