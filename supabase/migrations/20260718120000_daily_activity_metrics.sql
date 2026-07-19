-- Implements: MVP-12
-- PRD: §17 (05-health-activity.md §"HealthKit ve Health Connect"), §09
--
-- Health platformundan (HealthKit/Health Connect) senkronlanan günlük
-- adım/aktif enerji toplamı. §17: "Yeniden sync çift kayıt üretmez ...
-- Manuel kayıt ile health kaydı otomatik olarak aynı kayıt sayılmaz."
--
-- WATER_LOGS/BODY_MEASUREMENTS İLE FARKI: onlar ayrık OLAYLAR (kullanıcı bir
-- anda X ml su içti / bir ölçüm aldı) — bu ise OS'un gün içinde güncellediği
-- KÜMÜLATİF bir günlük toplam. Bu yüzden append-only + operation_id yerine
-- UPSERT semantiği kullanılır: `unique (user_id, activity_date, source)`,
-- istemci `.upsert(..., { onConflict: 'user_id,activity_date,source' })`
-- ile yazar. Bu repo'da "kullanıcı+gün başına tek satır, upsert" deseni
-- İLK KEZ burada kuruluyor (daily_nutrition_summary/daily_water_summary
-- append-only log üzerinden RPC ile hesaplanan görünümlerdir, TABLO değil).
--
-- Farklı kaynaklar (apple_health/health_connect) AYRI SATIR kalır —
-- body_measurements.source ile AYNI ilke: "asla sessizce birleştirilmez."
--
-- KAPSAM DIŞI, bilinçli olarak (14-open-decisions.md'de kayıtlı):
--   * Mesafe, antrenman, kilo/boy senkronu — §17 "İlk veri türleri"nde var
--     ama MVP-12 iş tanımı yalnız "temel adım/aktif enerji" diyor. Kilo/boy
--     zaten body_measurements.source CHECK'inde açık (20260716210454), ayrı
--     bir işte bağlanacak.
--   * Arka plan senkronu — native kapı (§01) bunu HealthKit/Health
--     Connect'ten AYRI, kendi başına gated bir yetenek sayıyor. v1 yalnız
--     ön planda (dashboard açılınca) senkronlar.
--   * Disconnect'te geçmiş verinin silinmesi — §17 "korunur veya silinir"
--     diyor, burada muhafazakâr seçenek (korunur) seçildi; DELETE grant'i
--     bilerek yok.

create table public.daily_activity_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  activity_date date not null,
  source text not null check (source in ('apple_health', 'health_connect')),

  steps integer,
  active_energy_kcal numeric(6, 1),

  -- §17 "her kaynak kayıt platform record ID, kaynak app/cihaz ... taşır."
  -- Tam dedup/izlenebilirlik burada tutulur; asıl dedup UNIQUE ile sağlanır.
  platform_record_id text,
  synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_activity_metrics_unique_source_day
    unique (user_id, activity_date, source),

  constraint daily_activity_metrics_has_value
    check (steps is not null or active_energy_kcal is not null),

  constraint daily_activity_metrics_steps_range
    check (steps is null or steps between 0 and 200000),

  constraint daily_activity_metrics_energy_range
    check (active_energy_kcal is null or active_energy_kcal between 0 and 20000)
);

comment on constraint daily_activity_metrics_steps_range on public.daily_activity_metrics is
  '200.000 üst sınır fiziksel bir üst sınır değil, sensör/adaptör hatasına karşı akla yatkınlık kontrolüdür.';

create index daily_activity_metrics_user_id_date_idx
  on public.daily_activity_metrics (user_id, activity_date desc);

create trigger daily_activity_metrics_set_updated_at
  before update on public.daily_activity_metrics
  for each row
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.daily_activity_metrics enable row level security;
alter table public.daily_activity_metrics force row level security;

create policy "daily_activity_metrics_select_own" on public.daily_activity_metrics
  for select to authenticated
  using (user_id = (select auth.uid()));

-- INSERT: water_logs ile AYNI gerekçe — tek tablo, RLS'in kendisi (with
-- check) user_id sahteciliğini engeller, SECURITY DEFINER gerekmez.
create policy "daily_activity_metrics_insert_own" on public.daily_activity_metrics
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: istemcinin `.upsert()` çağrısının ON CONFLICT DO UPDATE dalı bunu
-- kullanır (yeniden sync aynı (user,date,source) satırının ÜZERİNE yazar).
create policy "daily_activity_metrics_update_own" on public.daily_activity_metrics
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.daily_activity_metrics to authenticated;
revoke delete on public.daily_activity_metrics from authenticated;
revoke all on public.daily_activity_metrics from anon;

-- ---------------------------------------------------------------------------
-- Günlük aktivite özeti — daily_water_summary ile AYNI desende.
-- ---------------------------------------------------------------------------
create or replace function public.daily_activity_summary(target_date date)
returns table (
  steps integer,
  active_energy_kcal numeric,
  source text,
  synced_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  -- Nadiren birden fazla kaynak aynı günü doldurursa (ör. kullanıcı hem
  -- HealthKit hem Health Connect'e bağlıysa — pratikte tek platform), en
  -- son senkronlanan satır otoritatif sayılır. Gerçek çoklu-kaynak
  -- önceliklendirmesi ihtiyaç doğunca eklenir (bkz. 14-open-decisions.md).
  select m.steps, m.active_energy_kcal, m.source, m.synced_at
  from public.daily_activity_metrics m
  where m.user_id = (select auth.uid())
    and m.activity_date = target_date
  order by m.synced_at desc
  limit 1
$$;

comment on function public.daily_activity_summary is
  'Bir günün adım/aktif enerji değeri (§17). Birden fazla kaynak varsa en son senkronlanan satır döner — çoklu-kaynak önceliklendirmesi v1 kapsamı dışı.';

-- GÜVENLİK NOTU: bkz. daily_water_summary'deki aynı başlıklı not — anon'un
-- ayrı varsayılan ACL grant'i var, revoke ... from public tek başına
-- yetersiz.
revoke execute on function public.daily_activity_summary(date) from public;
revoke execute on function public.daily_activity_summary(date) from anon;
grant execute on function public.daily_activity_summary(date) to authenticated;
