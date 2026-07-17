-- Implements: MVP-08
-- PRD: §10-11 (04-ai-meal-analysis.md), §09
--
-- AI fotoğraf analizi altyapısı — "kontratlar ve private medya" dilimi.
-- KAPSAM: yalnız Gemini'den doğrulanmış HAM aday listesini (yiyecek adları,
-- porsiyon aralığı, güven) alıp saklamak. Katalog eşleştirme ve kalori/makro
-- hesabı BU İŞTE YOK — ayrı bir iş (MVP-09 "AI job pipeline").
--
-- MİMARİ KARAR: `private` şeması ilk kez açılıyor (FND-04 "kullanılmayan
-- yüzey önceden yayınlanmaz" — artık gerçekten kullanılıyor). Data API
-- yalnız `public` şemasını yayınlar (bkz. supabase/config.toml
-- `api.schemas`); client `private.ai_jobs`'a HİÇ erişemez, yalnız aşağıdaki
-- `public.*` SECURITY DEFINER fonksiyonları üzerinden — `log_meal()` ve
-- `catalog` şemasının `search_foods()` üzerinden açılması ile AYNI desen.
-- Bu, Edge Function'ın servis rolüne hiç ihtiyaç duymamasını sağlar:
-- kullanıcının kendi JWT'siyle çağırdığı bu fonksiyonlar `auth.uid()`'i
-- doğrudan kullanır, sahte user_id iddiası mümkün değildir.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- ai_jobs — bir fotoğraf analizi isteğinin durumu.
-- ---------------------------------------------------------------------------
create table private.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- §09/§03 aynı idempotency deseni: client üretir, ikinci çağrı yeni satır
  -- YARATMAZ, mevcut job'ı döner.
  operation_id uuid not null unique,
  -- Sunucu tarafı üretilir; log/hata takibi içindir (client'a döner, hata
  -- raporlarında operation_id yerine BU kullanılır — bkz. reportError.ts
  -- deseniyle tutarlılık).
  correlation_id uuid not null default gen_random_uuid(),

  status text not null default 'created',
  storage_path text not null,
  provider text not null default 'gemini',
  model text,

  -- Gemini'nin DOĞRULANMIŞ (Zod şemasından geçmiş) ham yanıtı. Katalog
  -- eşleşmesi/kalori hesabı burada YOK — yalnız aday adlar/porsiyon/güven.
  raw_response jsonb,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ai_jobs_status_valid check (
    status in ('created', 'processing', 'needs_confirmation', 'failed', 'expired')
  )
);

-- Rate limit sorgusu (bugünkü job sayısı) bu index'i kullanır.
create index ai_jobs_user_id_created_at_idx on private.ai_jobs (user_id, created_at desc);

alter table private.ai_jobs enable row level security;
alter table private.ai_jobs force row level security;

-- Data API `private` şemasını yayınlamıyor (config.toml `api.schemas`), yani
-- bu policy normal koşulda hiç devreye girmez — ama şema yayın kapsamı
-- ileride değişirse veya doğrudan bir DB bağlantısı kullanılırsa diye
-- defense-in-depth (codebase'in her yerdeki çift-katman felsefesiyle
-- tutarlı, bkz. progress_photos_path_matches_user CHECK'i).
create policy "ai_jobs_select_own" on private.ai_jobs
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- ai_usage_ledger — maliyet/token kaydı. §04 "kota ve maliyet".
-- ---------------------------------------------------------------------------
create table private.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references private.ai_jobs (id) on delete cascade,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);

create index ai_usage_ledger_user_id_created_at_idx on private.ai_usage_ledger (user_id, created_at desc);

alter table private.ai_usage_ledger enable row level security;
alter table private.ai_usage_ledger force row level security;

create policy "ai_usage_ledger_select_own" on private.ai_usage_ledger
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- ai_feature_flags — kill switch. §04 "global kill switch".
-- ---------------------------------------------------------------------------
create table private.ai_feature_flags (
  key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into private.ai_feature_flags (key, enabled) values ('meal_photo_analysis', true);

-- Bu tablo hiç RLS taşımaz: yalnız SECURITY DEFINER fonksiyonlar içinden
-- okunur, client'a hiçbir yoldan (Data API zaten `private`'ı yayınlamıyor,
-- ayrıca aşağıdaki fonksiyonlar da doğrudan SELECT vermiyor) açılmaz.

-- ---------------------------------------------------------------------------
-- create_ai_job — TEK yazma yolu (log_meal() ile aynı gerekçe: idempotency +
-- kill switch + rate limit kontrolü client'a bırakılamaz).
-- ---------------------------------------------------------------------------
create or replace function public.create_ai_job(p_operation_id uuid, p_storage_path text)
returns table (job_id uuid, is_new boolean, status text, raw_response jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing private.ai_jobs%rowtype;
  v_new_id uuid;
  v_kill_switch_enabled boolean;
  v_jobs_today integer;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  -- İDEMPOTENCY: aynı operation_id daha önce işlendiyse mevcut job'ı döner,
  -- kill switch/rate limit tekrar kontrol edilmez (zaten oluşmuş bir işi
  -- geriye dönük reddetmek anlamsız).
  select * into v_existing
  from private.ai_jobs
  where operation_id = p_operation_id and user_id = v_user_id;

  if found then
    job_id := v_existing.id;
    is_new := false;
    status := v_existing.status;
    raw_response := v_existing.raw_response;
    return next;
    return;
  end if;

  -- KILL SWITCH: §04 "global kill switch" — kapalıysa yeni iş açılmaz.
  select ff.enabled into v_kill_switch_enabled
  from private.ai_feature_flags ff
  where ff.key = 'meal_photo_analysis';

  if v_kill_switch_enabled is not true then
    raise exception 'AI fotoğraf analizi geçici olarak kapalı' using errcode = '55000';
  end if;

  -- RATE LIMIT: kullanıcı başına günde 10 istek (§04 kota — billing/
  -- entitlement sistemi (MVP-14/15) bloke olduğu için geçici sabit değer,
  -- bkz. 14-open-decisions.md).
  select count(*) into v_jobs_today
  from private.ai_jobs
  where user_id = v_user_id and created_at::date = current_date;

  if v_jobs_today >= 10 then
    raise exception 'Günlük AI fotoğraf analizi limitine ulaşıldı' using errcode = '55001';
  end if;

  insert into private.ai_jobs (user_id, operation_id, storage_path, status)
  values (v_user_id, p_operation_id, p_storage_path, 'processing')
  returning id into v_new_id;

  job_id := v_new_id;
  is_new := true;
  status := 'processing';
  raw_response := null;
  return next;
end;
$$;

comment on function public.create_ai_job is
  'AI fotoğraf analizi job''ı oluşturur. İdempotency + kill switch + rate limit tek yazma yolunda. SECURITY DEFINER: private.ai_jobs client''a hiç açılmaz.';

revoke execute on function public.create_ai_job(uuid, text) from public;
revoke execute on function public.create_ai_job(uuid, text) from anon;
grant execute on function public.create_ai_job(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_ai_job / fail_ai_job — Edge Function bu ikisiyle sonucu yazar.
-- Her ikisi de sahiplik kontrolü yapar (job.user_id = auth.uid()) — başka
-- kullanıcının job'ını tamamlayamaz/başarısızlayamaz.
-- ---------------------------------------------------------------------------
create or replace function public.complete_ai_job(
  p_job_id uuid,
  p_raw_response jsonb,
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
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select user_id into v_owner_id from private.ai_jobs where id = p_job_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Job bulunamadı veya erişilemiyor' using errcode = '42501';
  end if;

  update private.ai_jobs
  set status = 'needs_confirmation',
      raw_response = p_raw_response,
      model = p_model,
      updated_at = now()
  where id = p_job_id;

  insert into private.ai_usage_ledger (user_id, job_id, model, input_tokens, output_tokens, estimated_cost_usd)
  values (v_user_id, p_job_id, p_model, p_input_tokens, p_output_tokens, p_estimated_cost_usd);
end;
$$;

comment on function public.complete_ai_job is
  'AI job''ını doğrulanmış Gemini yanıtıyla tamamlar ve maliyet ledger''ına yazar. Sahiplik kontrolü açık.';

revoke execute on function public.complete_ai_job(uuid, jsonb, text, integer, integer, numeric) from public;
revoke execute on function public.complete_ai_job(uuid, jsonb, text, integer, integer, numeric) from anon;
grant execute on function public.complete_ai_job(uuid, jsonb, text, integer, integer, numeric) to authenticated;

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
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select user_id into v_owner_id from private.ai_jobs where id = p_job_id;

  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'Job bulunamadı veya erişilemiyor' using errcode = '42501';
  end if;

  update private.ai_jobs
  set status = 'failed',
      error_message = p_error_message,
      model = p_model,
      updated_at = now()
  where id = p_job_id;

  -- Token tüketildiyse (Gemini yanıt verdi ama şema doğrulaması başarısız
  -- oldu gibi) maliyet yine de gerçekleşmiştir — ledger'a yazılır.
  if p_input_tokens is not null or p_output_tokens is not null then
    insert into private.ai_usage_ledger (user_id, job_id, model, input_tokens, output_tokens, estimated_cost_usd)
    values (v_user_id, p_job_id, p_model, p_input_tokens, p_output_tokens, p_estimated_cost_usd);
  end if;
end;
$$;

comment on function public.fail_ai_job is
  'AI job''ını hata mesajıyla başarısızlar; token tüketildiyse maliyet ledger''ına yine de yazar.';

revoke execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) from public;
revoke execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) from anon;
grant execute on function public.fail_ai_job(uuid, text, text, integer, integer, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- ai-meal-photos — private bucket. progress-photos.sql ile BİREBİR AYNI
-- RLS deseni (yol sözleşmesi {user_id}/{uuid}.ext, storage.foldername
-- kaynak alınır, update policy yok).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ai-meal-photos', 'ai-meal-photos', false)
on conflict (id) do nothing;

create policy "ai_meal_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'ai-meal-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "ai_meal_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ai-meal-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "ai_meal_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ai-meal-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
