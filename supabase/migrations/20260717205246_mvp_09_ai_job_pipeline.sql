-- Implements: MVP-09
-- PRD: §10-11 (04-ai-meal-analysis.md), §09
--
-- MVP-08 yalnız doğrulanmış provider adaylarını `raw_response` olarak
-- saklıyordu. Bu migration üç eksik parçayı ekler:
--   1. RLS altında katalog eşleştirme (AI hiçbir nutrient değeri üretemez),
--   2. deterministik motorun ürettiği taslağın ayrı `result_response` alanı,
--   3. kullanıcının yalnız kendi job durumunu okuyabildiği GET-RPC'si.

alter table private.ai_jobs
  add column result_response jsonb,
  add column error_code text;

comment on column private.ai_jobs.result_response is
  'Katalog snapshot''larından deterministik hesaplanan kullanıcı taslağı. Provider''ın raw_response alanından bilinçli olarak ayrıdır.';

-- Bir provider çağrısı bir kez ücret/maliyet doğurur. Completion/failure
-- retry edilse dahi aynı job ikinci ledger satırını üretemez.
create unique index ai_usage_ledger_job_id_uidx
  on private.ai_usage_ledger (job_id);

-- ---------------------------------------------------------------------------
-- match_ai_food — provider aday adlarını görünür katalogla eşleştirir.
-- ---------------------------------------------------------------------------
create or replace function public.match_ai_food(
  p_candidate_names text[],
  p_locale text default 'tr'
)
returns table (
  food_id uuid,
  food_version_id uuid,
  matched_name text,
  matched_candidate text,
  matched_locale text,
  match_score real,
  source_key text,
  source_display_name text,
  energy_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  sugar_g numeric,
  fat_g numeric,
  saturated_fat_g numeric,
  fiber_g numeric,
  sodium_mg numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_locale not in ('tr', 'en') then
    raise exception 'Desteklenmeyen locale: %', p_locale using errcode = '22023';
  end if;

  return query
  with candidates as (
    -- Provider şeması en fazla üç aday kabul eder; fonksiyon ayrıca savunmacı
    -- bir üst sınır taşır ki doğrudan RPC çağrısı pahalı bir arama üretemesin.
    select
      c.candidate,
      c.ordinality::integer as candidate_order,
      catalog.immutable_unaccent(lower(c.candidate)) as normalized_candidate
    from unnest(p_candidate_names) with ordinality as c(candidate, ordinality)
    where btrim(c.candidate) <> '' and length(c.candidate) <= 120
    order by c.ordinality
    limit 5
  ), searchable_names as (
    select ft.food_id, ft.name, ft.locale
    from catalog.food_translations ft

    union all

    select fa.food_id, fa.alias, fa.locale
    from catalog.food_aliases fa
  ), scored as (
    select
      sn.food_id,
      sn.name,
      sn.locale,
      c.candidate,
      c.candidate_order,
      case
        when catalog.immutable_unaccent(lower(sn.name)) = c.normalized_candidate then 1.0::real
        when catalog.immutable_unaccent(lower(sn.name)) like c.normalized_candidate || '%'
          then greatest(
            0.85,
            extensions.similarity(catalog.immutable_unaccent(lower(sn.name)), c.normalized_candidate)
          )::real
        when catalog.immutable_unaccent(lower(sn.name)) like '%' || c.normalized_candidate || '%'
          or c.normalized_candidate like '%' || catalog.immutable_unaccent(lower(sn.name)) || '%'
          then greatest(
            0.72,
            extensions.similarity(catalog.immutable_unaccent(lower(sn.name)), c.normalized_candidate)
          )::real
        else extensions.similarity(
          catalog.immutable_unaccent(lower(sn.name)),
          c.normalized_candidate
        )::real
      end as score
    from candidates c
    cross join searchable_names sn
    where
      catalog.immutable_unaccent(lower(sn.name)) = c.normalized_candidate
      or catalog.immutable_unaccent(lower(sn.name)) like '%' || c.normalized_candidate || '%'
      or c.normalized_candidate like '%' || catalog.immutable_unaccent(lower(sn.name)) || '%'
      or catalog.immutable_unaccent(lower(sn.name))
        operator(extensions.%) c.normalized_candidate
  )
  select
    f.id,
    fv.id,
    s.name,
    s.candidate,
    s.locale,
    s.score,
    fs.key,
    fs.display_name,
    fn.energy_kcal,
    fn.protein_g,
    fn.carbs_g,
    fn.sugar_g,
    fn.fat_g,
    fn.saturated_fat_g,
    fn.fiber_g,
    fn.sodium_mg
  from scored s
  join catalog.foods f on f.id = s.food_id
  join catalog.food_versions fv on fv.id = f.current_version_id
  join catalog.food_sources fs on fs.id = fv.source_id
  join catalog.food_nutrients fn on fn.food_version_id = fv.id
  where f.deleted_at is null and s.score >= 0.30
  order by
    s.score desc,
    s.candidate_order,
    (s.locale = p_locale) desc,
    fs.priority,
    fv.quality_score desc nulls last,
    f.id
  limit 1;
end;
$$;

comment on function public.match_ai_food(text[], text) is
  'AI aday adlarını çağıranın RLS ile görebildiği katalogda eşleştirir; current food version, kaynak ve 100 g nutrient snapshot''ı döner.';

revoke execute on function public.match_ai_food(text[], text) from public;
revoke execute on function public.match_ai_food(text[], text) from anon;
grant execute on function public.match_ai_food(text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_ai_job_v2 — raw provider yanıtı ile deterministik sonucu ayırır.
-- ---------------------------------------------------------------------------
create or replace function public.complete_ai_job_v2(
  p_job_id uuid,
  p_raw_response jsonb,
  p_result_response jsonb,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select user_id, status into v_owner_id, v_status
  from private.ai_jobs
  where id = p_job_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Job bulunamadı veya erişilemiyor' using errcode = '42501';
  end if;

  -- Background task bir ağ retry'ı nedeniyle completion'ı tekrar gönderirse
  -- sonuç ve ledger değişmeden başarıyla döner.
  if v_status = 'needs_confirmation' then
    return;
  end if;

  if v_status <> 'processing' then
    raise exception 'Job tamamlanabilir durumda değil' using errcode = '55002';
  end if;

  update private.ai_jobs
  set status = 'needs_confirmation',
      raw_response = p_raw_response,
      result_response = p_result_response,
      model = p_model,
      error_message = null,
      updated_at = now()
  where id = p_job_id;

  insert into private.ai_usage_ledger (
    user_id, job_id, model, input_tokens, output_tokens, estimated_cost_usd
  ) values (
    v_user_id, p_job_id, p_model, p_input_tokens, p_output_tokens, p_estimated_cost_usd
  )
  on conflict (job_id) do nothing;
end;
$$;

comment on function public.complete_ai_job_v2 is
  'AI job''ını provider raw yanıtı ve yalnız katalog snapshot''ından hesaplanmış taslakla idempotent tamamlar.';

revoke execute on function public.complete_ai_job_v2(uuid, jsonb, jsonb, text, integer, integer, numeric) from public;
revoke execute on function public.complete_ai_job_v2(uuid, jsonb, jsonb, text, integer, integer, numeric) from anon;
grant execute on function public.complete_ai_job_v2(uuid, jsonb, jsonb, text, integer, integer, numeric) to authenticated;

create or replace function public.fail_ai_job_v2(
  p_job_id uuid,
  p_error_code text,
  p_error_message text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select user_id, status into v_owner_id, v_status
  from private.ai_jobs
  where id = p_job_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Job bulunamadı veya erişilemiyor' using errcode = '42501';
  end if;
  if v_status = 'failed' then return; end if;
  if v_status <> 'processing' then
    raise exception 'Job başarısız yapılabilir durumda değil' using errcode = '55002';
  end if;

  update private.ai_jobs
  set status = 'failed',
      error_code = p_error_code,
      error_message = p_error_message,
      model = p_model,
      updated_at = now()
  where id = p_job_id;

  if p_input_tokens is not null or p_output_tokens is not null then
    insert into private.ai_usage_ledger (
      user_id, job_id, model, input_tokens, output_tokens, estimated_cost_usd
    ) values (
      v_user_id, p_job_id, p_model, p_input_tokens, p_output_tokens, p_estimated_cost_usd
    )
    on conflict (job_id) do nothing;
  end if;
end;
$$;

revoke execute on function public.fail_ai_job_v2(uuid, text, text, text, integer, integer, numeric) from public;
revoke execute on function public.fail_ai_job_v2(uuid, text, text, text, integer, integer, numeric) from anon;
grant execute on function public.fail_ai_job_v2(uuid, text, text, text, integer, integer, numeric) to authenticated;

-- MVP-08 fail fonksiyonu retry-safe hale gelir; imza değişmediği için mevcut
-- deploy ile geriye uyumludur.
create or replace function public.fail_ai_job(
  p_job_id uuid,
  p_error_message text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_usd numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select user_id, status into v_owner_id, v_status
  from private.ai_jobs
  where id = p_job_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Job bulunamadı veya erişilemiyor' using errcode = '42501';
  end if;

  if v_status = 'failed' then
    return;
  end if;

  if v_status <> 'processing' then
    raise exception 'Job başarısız yapılabilir durumda değil' using errcode = '55002';
  end if;

  update private.ai_jobs
  set status = 'failed',
      error_message = p_error_message,
      model = p_model,
      updated_at = now()
  where id = p_job_id;

  if p_input_tokens is not null or p_output_tokens is not null then
    insert into private.ai_usage_ledger (
      user_id, job_id, model, input_tokens, output_tokens, estimated_cost_usd
    ) values (
      v_user_id, p_job_id, p_model, p_input_tokens, p_output_tokens, p_estimated_cost_usd
    )
    on conflict (job_id) do nothing;
  end if;
end;
$$;

-- CREATE OR REPLACE yeni varsayılan ACL üretebilir; açıkça tekrar kapat.
revoke execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) from public;
revoke execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) from anon;
grant execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- get_ai_job — GET /v1/ai/jobs/:id Edge Function'ının tek veri kaynağı.
-- ---------------------------------------------------------------------------
create or replace function public.get_ai_job(p_job_id uuid)
returns table (
  job_id uuid,
  status text,
  result_response jsonb,
  error_code text,
  error_message text,
  correlation_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  return query
  select
    j.id,
    j.status,
    j.result_response,
    j.error_code,
    j.error_message,
    j.correlation_id,
    j.created_at,
    j.updated_at
  from private.ai_jobs j
  where j.id = p_job_id and j.user_id = v_user_id;
end;
$$;

comment on function public.get_ai_job is
  'Çağıranın kendi AI job durumunu ve deterministik taslağını döndürür; storage path ve provider raw yanıtını yayınlamaz.';

revoke execute on function public.get_ai_job(uuid) from public;
revoke execute on function public.get_ai_job(uuid) from anon;
grant execute on function public.get_ai_job(uuid) to authenticated;
