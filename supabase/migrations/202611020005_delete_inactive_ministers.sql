-- Allow authorized team members to permanently remove an inactive minister.
grant delete on table public.ministers to authenticated;

drop policy if exists "authorized team can delete inactive ministers" on public.ministers;
create policy "authorized team can delete inactive ministers" on public.ministers
  for delete to authenticated
  using (
    active = false
    and public.current_app_role() in ('admin', 'editor')
  );

-- A minister deletion removes their event assignments and monthly history.
alter table public.assignments
  drop constraint if exists assignments_minister_id_fkey;

alter table public.assignments
  add constraint assignments_minister_id_fkey
  foreign key (minister_id) references public.ministers(id)
  on delete cascade;
