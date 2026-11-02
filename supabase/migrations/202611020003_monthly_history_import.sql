-- Monthly legacy participation records without event-level details.
create table if not exists public.minister_monthly_history (
  id uuid primary key default gen_random_uuid(),
  minister_id uuid not null references public.ministers(id) on delete cascade,
  month_start date not null check (extract(day from month_start) = 1),
  created_at timestamptz not null default now(),
  unique (minister_id, month_start)
);

create index if not exists minister_monthly_history_month_idx
  on public.minister_monthly_history(month_start);

alter table public.minister_monthly_history enable row level security;

drop policy if exists "authorized team can read monthly history" on public.minister_monthly_history;
create policy "authorized team can read monthly history" on public.minister_monthly_history
  for select to authenticated using (public.current_app_role() in ('admin', 'editor'));

drop policy if exists "authorized team can add monthly history" on public.minister_monthly_history;
create policy "authorized team can add monthly history" on public.minister_monthly_history
  for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));

drop policy if exists "authorized team can delete monthly history" on public.minister_monthly_history;
create policy "authorized team can delete monthly history" on public.minister_monthly_history
  for delete to authenticated using (public.current_app_role() in ('admin', 'editor'));

create or replace function public.import_legacy_minister_roster(p_ministers jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_item jsonb;
  v_name text;
  v_whatsapp text;
  v_month text;
  v_minister_id uuid;
  v_minister_count integer := 0;
  v_history_count integer := 0;
begin
  if public.current_app_role() not in ('admin', 'editor') then
    raise exception 'Acesso não autorizado para importar ministros.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_ministers) <> 'array' or jsonb_array_length(p_ministers) = 0 then
    raise exception 'A importação precisa conter ao menos um ministro.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_ministers)
  loop
    v_name := trim(coalesce(v_item ->> 'name', ''));
    v_whatsapp := trim(coalesce(v_item ->> 'whatsapp', ''));

    if v_name = '' then
      raise exception 'Foi encontrado um ministro sem nome.' using errcode = '22023';
    end if;

    if exists (
      select 1 from public.ministers
      where lower(trim(name)) = lower(v_name)
    ) then
      raise exception 'O ministro % já está cadastrado. Resolva os nomes duplicados antes da importação.', v_name
        using errcode = '23505';
    end if;

    insert into public.ministers(name, whatsapp, active)
    values (v_name, v_whatsapp, true)
    returning id into v_minister_id;
    v_minister_count := v_minister_count + 1;

    for v_month in
      select jsonb_array_elements_text(coalesce(v_item -> 'participatedMonths', '[]'::jsonb))
    loop
      if v_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
        raise exception 'Mês inválido na importação: %.', v_month using errcode = '22023';
      end if;

      insert into public.minister_monthly_history(minister_id, month_start)
      values (v_minister_id, to_date(v_month || '-01', 'YYYY-MM-DD'));
      v_history_count := v_history_count + 1;
    end loop;
  end loop;

  return jsonb_build_object('ministers', v_minister_count, 'history', v_history_count);
end;
$$;

revoke all on function public.import_legacy_minister_roster(jsonb) from public, anon;
grant execute on function public.import_legacy_minister_roster(jsonb) to authenticated;
