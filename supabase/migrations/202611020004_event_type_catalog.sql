create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

insert into public.event_types(name)
select distinct trim(kind)
from public.events
where kind is not null and length(trim(kind)) > 0
union
select name from (values ('Missa'), ('Evento')) as defaults(name)
on conflict (name) do nothing;

alter table public.event_types enable row level security;

grant select, insert on table public.event_types to authenticated;

drop policy if exists "authorized team can read event types" on public.event_types;
create policy "authorized team can read event types" on public.event_types
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));

drop policy if exists "authorized team can add event types" on public.event_types;
create policy "authorized team can add event types" on public.event_types
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and conname = 'events_kind_event_types_name_fkey'
  ) then
    alter table public.events
      add constraint events_kind_event_types_name_fkey
      foreign key (kind) references public.event_types(name)
      on update cascade on delete restrict;
  end if;
end
$$;
