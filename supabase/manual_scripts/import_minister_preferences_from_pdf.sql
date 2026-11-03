-- Import minister role and time preferences from TABELA DIAS E HORÁRIOS.pdf.
-- Apply migrations 202611030001 and 202611030002 before running this script.
-- "Qualquer horário", blank, and unknown hours map to no time preference.
-- "Leitura" maps to Primeira Leitura and Segunda Leitura. "Comentário ou leitura"
-- maps to those two roles plus Comentarista/preces. Pastoral and Sunday-availability
-- notes are not represented by the current preference columns and are not changed.

begin;

create temporary table minister_preferences_from_pdf (
  pdf_name text primary key,
  minister_name text not null,
  preferred_times text[] not null,
  preferred_roles text[] not null
) on commit drop;

insert into minister_preferences_from_pdf (pdf_name, minister_name, preferred_times, preferred_roles) values
  ('SILVANE GOMES', 'SILVANE GOMES', array[]::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('EVA APARECIDA', 'EVA PIMENTA', array['07']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('ANDRÉ VIANA', 'ANDRÉ', array['07', '09']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('ELIANA MARIA GUERRA', 'ELIANA MARIA', array['07', '19']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('DORA', 'MARIA AUXILIADORA (DORA)', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('LESSIO CORDEIRO', 'LESSIO CORDEIRO', array['19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('NATHÁLIA REZENDE', 'NATHÁLIA REZENDE', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('LUANA CRISTINA', 'LUANA CRISTINA', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('APARECIDA MORAES', 'APARECIDA MORAES', array['07', '19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('JHENIFER ISABELLE', 'JHENIFER ISABELLE', array[]::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('VALDIRENE MENDES', 'VALDIRENE MENDES', array['07']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('SAULO GOMES', 'SAULO GOMES', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('SONIA MARIA LOPES', 'SÔNIA MARIA LOPES', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('EDISON LOPES', 'EDISON LOPES', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('TATIANE COSTA', 'TATIANE COSTA', array['09']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('JUSCELIA REZENDE', 'JUSCELIA REZENDE', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('GEYSIMARA FERREIRA', 'GEYSIMARA FERREIRA', array['19']::text[], array['Primeira Leitura']::text[]),
  ('LOURDES MARIA', 'LOURDES MARIA', array['07']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MARCOS TORREZANI', 'MARCOS TORREZANI', array['07']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MARIA DO CARMO DE SOUZA', 'MARIA DO CARMO DE SOUZA', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MARLENE MARTINS', 'MARLENE MARTINS BONFIM', array['19']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MARIA LUCIA AMBRÓZIO', 'LUCIA AMBRÓSIO', array[]::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('THÁCILA', 'THÁCILA AMBRÓSIO', array[]::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('GILCELIO CORDEIRO', 'GILCELIO CORDEIRO', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('SELMA MARIA BARBOSA', 'SELMA BARBOSA', array['09']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('NEILIANE', 'NELIANE DE LOURDES', array['07', '09']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('TEREZINHA DAMASCENO', 'TEREZINHA DAMASCENO', array['19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('VERÔNICA MORAIS', 'VERONICA MORAIS', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('DORA SILVA', 'DORA SILVA', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('ROSIANE FONSECA', 'ROSIANE FONSECA', array['19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('HENRIQUE GERALDO', 'HENRIQUE GERALDO', array['19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('WILLES', 'WILLES', array[]::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('GEISIANE TORRES', 'GEISIANE TORRES', array['09', '19']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('EDIVALDO MOREIRA', 'EDIVALDO ALMEIDA', array['07']::text[], array['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MARIA DE LOURDES LACERDA', 'MARIA DE LOURDES LACERDA', array['07']::text[], array['Primeira Leitura', 'Segunda Leitura']::text[]),
  ('MANOEL REZENDE', 'MANOEL REZENDE', array['07']::text[], array['Comentarista/preces']::text[]);

do $$
declare
  v_issues text;
begin
  select string_agg(
    format('%s -> %s (%s correspondências)', pdf_name, minister_name, match_count),
    E'\n' order by pdf_name
  )
  into v_issues
  from (
    select p.pdf_name, p.minister_name, count(m.id) as match_count
    from minister_preferences_from_pdf p
    left join public.ministers m
      on regexp_replace(upper(btrim(m.name)), '[[:space:]]+', ' ', 'g')
       = regexp_replace(upper(btrim(p.minister_name)), '[[:space:]]+', ' ', 'g')
    group by p.pdf_name, p.minister_name
    having count(m.id) <> 1
  ) unmatched;

  if v_issues is not null then
    raise exception 'Nenhuma preferência foi alterada. Confira os cadastros sem correspondência única:% %', E'\n', v_issues;
  end if;
end $$;

update public.ministers m
set preferred_times = p.preferred_times,
    preferred_roles = p.preferred_roles
from minister_preferences_from_pdf p
where regexp_replace(upper(btrim(m.name)), '[[:space:]]+', ' ', 'g')
    = regexp_replace(upper(btrim(p.minister_name)), '[[:space:]]+', ' ', 'g')
returning m.name as ministro_atualizado, m.preferred_times as horarios_preferidos, m.preferred_roles as papeis_preferidos;

commit;
