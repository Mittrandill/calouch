-- Implements: MVP-07
-- PRD: §15-16 (05-health-activity.md §"Vücut ölçüleri"), §09
--
-- Vücut ölçüleri. §05: "Kilo, boy, yağ oranı, kas kütlesi; boyun, omuz,
-- göğüs, bel, kalça; sağ/sol kol, ön kol, üst bacak ve baldır desteklenir.
-- Her kayıtta birim, zaman, kaynak ve sürüm bulunur." "Kaynak kullanıcıya
-- gösterilir; aynı değerler sessizce birleştirilmez."
--
-- TASARIM KARARI: geniş tablo (her metrik kendi nullable kolonu), EAV değil.
-- Gerekçe: bir "kayıt" (bu migration'ın "her kayıtta" dediği birim) TEK BİR
-- ölçüm OTURUMU — kullanıcı bir seferde kilo+bel+kalça girebilir, bunlar
-- aynı source/measured_at'i paylaşır. Farklı kaynaklardan gelen değerler
-- (ör. manuel + akıllı tartı aynı gün) AYRI SATIRLAR olarak kalır — hiç
-- birleştirme mantığı yok, "sessizce birleştirilmez" kabul kriteri bunu
-- otomatik sağlar.
--
-- KAPSAM: yalnız MANUEL giriş yolu (bu iş, MVP-07). `source` kolonu
-- HealthKit/Health Connect/akıllı tartı değerlerini de kabul edecek
-- şekilde BAŞTAN geniş tutulur (§05 kaynak listesi) — MVP-12 (Health ve
-- aktivite) bu tabloyu senkronizasyon hedefi olarak kullanacak, şema
-- değişikliği gerektirmeyecek. Bu iş yalnız 'manual' yazma yolunu açar.
--
-- KAPSAM DIŞI (14-open-decisions.md'de kayıtlı): fotoğraftan ölçü tahmini
-- (§05 "deneysel ve ileri fazdır") — ayrı, ileri faz işi.

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  measured_at timestamptz not null default now(),
  source text not null default 'manual',

  weight_kg numeric(5, 2),
  height_cm numeric(5, 1),
  body_fat_pct numeric(4, 1),
  muscle_mass_kg numeric(5, 2),
  neck_cm numeric(4, 1),
  shoulder_cm numeric(4, 1),
  chest_cm numeric(4, 1),
  waist_cm numeric(4, 1),
  hip_cm numeric(4, 1),
  arm_right_cm numeric(4, 1),
  arm_left_cm numeric(4, 1),
  forearm_right_cm numeric(4, 1),
  forearm_left_cm numeric(4, 1),
  thigh_right_cm numeric(4, 1),
  thigh_left_cm numeric(4, 1),
  calf_right_cm numeric(4, 1),
  calf_left_cm numeric(4, 1),

  notes text,

  -- §03/§09'daki AYNI idempotency deseni — su takibiyle aynı gerekçe:
  -- tek tablo, atomiklik sorunu yok, UNIQUE(operation_id) yeterli.
  operation_id uuid not null unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint body_measurements_source_valid check (
    source in ('manual', 'apple_health', 'health_connect', 'smart_scale', 'professional', 'photo_estimate')
  ),
  -- Fiziksel akla yatkınlık sınırları — goalEngine'in kendi girdi
  -- doğrulamasıyla (packages/nutrition-engine) AYNI aralıklar, tek
  -- kaynaktan sapmasın diye kasıtlı olarak eşleştirildi.
  constraint body_measurements_weight_range check (weight_kg is null or weight_kg between 20 and 500),
  constraint body_measurements_height_range check (height_cm is null or height_cm between 80 and 260),
  constraint body_measurements_body_fat_range check (body_fat_pct is null or body_fat_pct between 2 and 70),
  -- En az bir metrik dolu olmalı — tamamen boş bir "ölçüm" anlamsızdır.
  constraint body_measurements_has_value check (
    num_nonnulls(
      weight_kg, height_cm, body_fat_pct, muscle_mass_kg, neck_cm, shoulder_cm, chest_cm,
      waist_cm, hip_cm, arm_right_cm, arm_left_cm, forearm_right_cm, forearm_left_cm,
      thigh_right_cm, thigh_left_cm, calf_right_cm, calf_left_cm
    ) > 0
  )
);

create index body_measurements_user_id_measured_at_idx
  on public.body_measurements (user_id, measured_at desc)
  where deleted_at is null;

alter table public.body_measurements enable row level security;
alter table public.body_measurements force row level security;

create policy "body_measurements_select_own" on public.body_measurements
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "body_measurements_insert_own" on public.body_measurements
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: yalnız düzeltme/soft-delete için (meta alanlar + deleted_at).
-- meal_entries/water_logs ile aynı desen.
create policy "body_measurements_update_own" on public.body_measurements
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.body_measurements to authenticated;
revoke delete on public.body_measurements from authenticated;
revoke all on public.body_measurements from anon;

-- ---------------------------------------------------------------------------
-- Kilo trendi — belirli bir tarih aralığında yalnız kilo taşıyan kayıtlar,
-- grafik/liste için hafif bir sorgu (client'ın her satırın TÜM 17 kolonunu
-- çekmesine gerek kalmaz).
-- ---------------------------------------------------------------------------
create or replace function public.weight_trend(since_date date default null)
returns table (
  id uuid,
  measured_at timestamptz,
  weight_kg numeric,
  source text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id, m.measured_at, m.weight_kg, m.source
  from public.body_measurements m
  where m.user_id = (select auth.uid())
    and m.deleted_at is null
    and m.weight_kg is not null
    and (since_date is null or m.measured_at::date >= since_date)
  order by m.measured_at desc
$$;

comment on function public.weight_trend is
  'Kilo geçmişi (yalnız weight_kg dolu satırlar). SECURITY INVOKER + RLS: yalnız çağıranın kendi verisi.';

-- GÜVENLİK NOTU: bkz. water_logs.sql'deki aynı başlıklı not — anon'un
-- ayrı varsayılan ACL grant'i var, revoke ... from public tek başına
-- yetersiz.
revoke execute on function public.weight_trend(date) from public;
revoke execute on function public.weight_trend(date) from anon;
grant execute on function public.weight_trend(date) to authenticated;
