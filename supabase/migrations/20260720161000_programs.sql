-- Implements: TRN-02
-- PRD: §06-training.md "Programlar"
--
-- Antrenman programları. recipes/recipe_versions/recipe_items ile BİREBİR
-- AYNI mimari: ebeveyn tablo (mutable meta) + immutable, `operation_id`
-- idempotent versiyon tablosu + versiyona bağlı çocuk tablolar. Bir
-- workout_session, oluşturulduğu program_version_id'ye sabitlenir — program
-- düzenlemesi (yeni versiyon) geçmiş antrenmanı ASLA değiştirmez (PRD kabul
-- kriteri "Program versiyonu geçmiş antrenmanı değiştirmez").
--
-- HAZIR PROGRAMLAR: owner_id null + is_template true = herkese görünen
-- şablon (yalnız migration/seed yazar). Kullanıcı "kopyala" derse
-- copy_program() kendi owner_id'siyle bağımsız bir kopya yaratır — recipes
-- kopyalama deseninin (save_recipe p_recipe_id=null ile yeniden çağrılması)
-- programlar için RPC'ye çıkarılmış hâli, çünkü kaynak kullanıcının OLMAYAN
-- bir programa (şablon) da uygulanabilmesi gerekiyor.
--
-- KAPSAM DIŞI (bu turda bilinçli olarak bırakıldı):
--   * Superset/dropset gruplama için builder UI kontrolü — `superset_group`
--     kolonu şemada hazır, program-builder.tsx bunu göstermez.
--   * Egzersiz başına set-bazında farklı hedef — v1 tüm setlere aynı hedefi
--     uygular (`target_sets` yine de dizi olarak modellenir, ileride
--     set-bazında düzenlemeye şema değişikliği gerektirmeden geçilebilir).

-- ---------------------------------------------------------------------------
-- programs
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  -- null = hazır/şablon program (herkese görünür, yalnız migration/seed
  -- yazar); dolu = kullanıcının kendi programı.
  owner_id uuid references auth.users (id) on delete cascade,

  name text not null,
  is_template boolean not null default false,
  current_version_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint programs_name_not_blank check (length(trim(name)) > 0),
  -- Şablon her zaman sahipsizdir, kullanıcı programı her zaman sahiplidir.
  constraint programs_template_ownership check (
    (is_template and owner_id is null) or (not is_template and owner_id is not null)
  )
);

create index programs_owner_id_idx on public.programs (owner_id) where deleted_at is null;
create index programs_is_template_idx on public.programs (is_template) where deleted_at is null and is_template;

-- ---------------------------------------------------------------------------
-- program_versions — immutable. "Program kopyalanabilir ve sürümlenebilir."
-- ---------------------------------------------------------------------------
create table public.program_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  version_number integer not null,

  -- Deload haftası modellemesi için toplam hafta sayısı (program_days
  -- week_number 1..weeks arası döngü kurar).
  weeks smallint not null default 1,

  operation_id uuid not null unique,
  created_at timestamptz not null default now(),

  constraint program_versions_program_version_unique unique (program_id, version_number),
  constraint program_versions_weeks_positive check (weeks > 0)
);

create index program_versions_program_id_idx on public.program_versions (program_id);

alter table public.programs
  add constraint programs_current_version_id_fkey
  foreign key (current_version_id) references public.program_versions (id);

-- ---------------------------------------------------------------------------
-- program_days
-- ---------------------------------------------------------------------------
create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_version_id uuid not null references public.program_versions (id) on delete cascade,

  week_number smallint not null default 1,
  day_index smallint not null,
  name text not null,
  is_deload boolean not null default false,

  created_at timestamptz not null default now(),

  constraint program_days_unique_slot unique (program_version_id, week_number, day_index),
  constraint program_days_week_number_positive check (week_number > 0),
  constraint program_days_day_index_nonneg check (day_index >= 0),
  constraint program_days_name_not_blank check (length(trim(name)) > 0)
);

create index program_days_program_version_id_idx on public.program_days (program_version_id);

-- ---------------------------------------------------------------------------
-- program_exercises — bir güne ait egzersiz slotu + hedef set konfigürasyonu.
-- ---------------------------------------------------------------------------
create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days (id) on delete cascade,
  exercise_id uuid not null references catalog.exercises (id),

  order_index smallint not null,
  -- Aynı değeri paylaşan egzersizler bir superset oluşturur (v1 builder UI
  -- bunu göstermez — bkz. üstteki KAPSAM DIŞI).
  superset_group smallint,

  -- Dizi: {setNumber, targetReps, targetWeightKg, isWarmup, isDropset, restSeconds}
  -- v1'de tüm elemanlar aynı hedefi taşır (program-builder.tsx tarafından
  -- doldurulur); şema set-bazında farklılaşmaya izin verir.
  target_sets jsonb not null,

  notes text,
  created_at timestamptz not null default now(),

  constraint program_exercises_order_nonneg check (order_index >= 0),
  constraint program_exercises_target_sets_is_array check (jsonb_typeof(target_sets) = 'array'),
  constraint program_exercises_target_sets_not_empty check (jsonb_array_length(target_sets) > 0)
);

create index program_exercises_program_day_id_idx on public.program_exercises (program_day_id);
create index program_exercises_exercise_id_idx on public.program_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.programs enable row level security;
alter table public.program_versions enable row level security;
alter table public.program_days enable row level security;
alter table public.program_exercises enable row level security;

alter table public.programs force row level security;
alter table public.program_versions force row level security;
alter table public.program_days force row level security;
alter table public.program_exercises force row level security;

create policy "programs_select_visible" on public.programs
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

create policy "program_versions_select_visible" on public.program_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_versions.program_id
        and (p.owner_id is null or p.owner_id = (select auth.uid()))
    )
  );

create policy "program_days_select_visible" on public.program_days
  for select to authenticated
  using (
    exists (
      select 1 from public.program_versions pv
      join public.programs p on p.id = pv.program_id
      where pv.id = program_days.program_version_id
        and (p.owner_id is null or p.owner_id = (select auth.uid()))
    )
  );

create policy "program_exercises_select_visible" on public.program_exercises
  for select to authenticated
  using (
    exists (
      select 1 from public.program_days pd
      join public.program_versions pv on pv.id = pd.program_version_id
      join public.programs p on p.id = pv.program_id
      where pd.id = program_exercises.program_day_id
        and (p.owner_id is null or p.owner_id = (select auth.uid()))
    )
  );

-- UPDATE: yalnız programs üstünde, yalnız meta (name, deleted_at). Kompozisyon
-- değişikliği YENİ sürüm demektir (save_program() üzerinden).
create policy "programs_update_own" on public.programs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- INSERT policy'si YOK (recipes ile aynı gerekçe): program + ilk versiyon +
-- gün + egzersiz çoklu-tablo yazması tek yolu SECURITY DEFINER
-- `save_program()`/`copy_program()` fonksiyonlarıdır (program_functions.sql).

grant select, update on public.programs to authenticated;
grant select on public.program_versions to authenticated;
grant select on public.program_days to authenticated;
grant select on public.program_exercises to authenticated;

revoke insert, delete on public.programs from authenticated;
revoke insert, update, delete on public.program_versions from authenticated;
revoke insert, update, delete on public.program_days from authenticated;
revoke insert, update, delete on public.program_exercises from authenticated;

revoke all on public.programs, public.program_versions, public.program_days, public.program_exercises from anon;
