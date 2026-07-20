-- Implements: TRN-01 (Faz 2 — bkz. docs/prd/13-agent-work-orders.md "Faz 2+ İleri fazlar")
-- PRD: §06-training.md "Egzersiz kataloğu"
--
-- Egzersiz kataloğu. catalog.foods ile AYNI karma-sahiplik desenini
-- kullanır: owner_id null = global katalog girdisi (yalnız migration/seed
-- yazar), dolu = kullanıcının kendi egzersizi.
--
-- PRD "Kas grupları ve ekipmanlar PRD §18'deki katalogla seed edilir" diyor
-- ama §18 hiç yazılmadı (docs yalnız 00-14) — enum değerleri burada ilk kez
-- tanımlanıyor.
--
-- KAPSAM DIŞI (bu turda bilinçli olarak bırakıldı):
--   * Kullanıcının yeni egzersiz gönderip moderasyona sunması — `moderation_
--     status` kolonu PRD'nin istediği alan olduğu için burada, ama gönderim/
--     moderasyon RPC'si yok (water_logs.version'daki "reserved for future"
--     emsaliyle aynı gerekçe: alan PRD'de var, akış henüz değil).
--   * Lisanslı/üretilmiş medya varlık yönetimi — yalnız nullable
--     media_url/thumbnail_url kolonu var, yükleme pipeline'ı yok.

-- catalog.immutable_unaccent + pg_trgm zaten var (20260716151233_catalog_foods.sql).

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
create table catalog.exercises (
  id uuid primary key default gen_random_uuid(),
  -- null = global katalog girdisi; dolu = kullanıcının özel egzersizi.
  owner_id uuid references auth.users (id) on delete cascade,

  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  difficulty text not null default 'intermediate',

  -- MET (Metabolic Equivalent of Task) — kalori yakım hesabının girdisi
  -- (calories = MET × kilo(kg) × süre(saat)). Compendium of Physical
  -- Activities'ten yaklaşık değerler, seed dosyasında egzersiz başına atanır.
  met_value numeric(4, 2) not null,

  -- true: set'te ağırlık yerine kullanıcının kendi kilosu kullanılır
  -- (finish_workout_session hacim/kalori hesabında).
  is_bodyweight boolean not null default false,

  -- PRD "moderasyon durumu taşır" — bkz. üstteki KAPSAM DIŞI notu.
  moderation_status text not null default 'approved',

  media_url text,
  thumbnail_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint exercises_primary_muscle_valid check (primary_muscle in (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'full_body', 'cardio'
  )),
  constraint exercises_equipment_valid check (equipment in (
    'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell',
    'band', 'bench', 'cardio_machine'
  )),
  constraint exercises_difficulty_valid check (difficulty in ('beginner', 'intermediate', 'advanced')),
  constraint exercises_moderation_status_valid check (moderation_status in ('pending', 'approved', 'rejected')),
  constraint exercises_met_value_positive check (met_value > 0)
);

create index exercises_owner_id_idx on catalog.exercises (owner_id) where owner_id is not null;
create index exercises_primary_muscle_idx on catalog.exercises (primary_muscle);
create index exercises_equipment_idx on catalog.exercises (equipment);

-- ---------------------------------------------------------------------------
-- exercise_translations
-- ---------------------------------------------------------------------------
create table catalog.exercise_translations (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references catalog.exercises (id) on delete cascade,
  locale text not null,

  name text not null,
  description text,
  -- Adım adım uygulama talimatı.
  steps text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  safety_notes text,

  constraint exercise_translations_unique_locale unique (exercise_id, locale),
  constraint exercise_translations_locale_valid check (locale in ('tr', 'en'))
);

create index exercise_translations_exercise_id_idx on catalog.exercise_translations (exercise_id);
-- Aksan-duyarsız bulanık arama — food_translations ile aynı desen.
create index exercise_translations_name_trgm_idx
  on catalog.exercise_translations using gin ((catalog.immutable_unaccent(name)) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table catalog.exercises enable row level security;
alter table catalog.exercise_translations enable row level security;

alter table catalog.exercises force row level security;
alter table catalog.exercise_translations force row level security;

create policy "exercises_select_visible" on catalog.exercises
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

create policy "exercises_insert_own" on catalog.exercises
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "exercises_update_own" on catalog.exercises
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- DELETE policy'si YOK: silme yalnız soft-delete (deleted_at), UPDATE
-- üzerinden — foods.sql ile aynı gerekçe (program_exercises geçmiş
-- egzersize referans taşıyabilir).

create policy "exercise_translations_select_visible" on catalog.exercise_translations
  for select to authenticated
  using (
    exists (
      select 1 from catalog.exercises e
      where e.id = exercise_translations.exercise_id
        and (e.owner_id is null or e.owner_id = (select auth.uid()))
    )
  );

create policy "exercise_translations_insert_own" on catalog.exercise_translations
  for insert to authenticated
  with check (
    exists (select 1 from catalog.exercises e where e.id = exercise_translations.exercise_id and e.owner_id = (select auth.uid()))
  );

create policy "exercise_translations_update_own" on catalog.exercise_translations
  for update to authenticated
  using (
    exists (select 1 from catalog.exercises e where e.id = exercise_translations.exercise_id and e.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from catalog.exercises e where e.id = exercise_translations.exercise_id and e.owner_id = (select auth.uid()))
  );

grant select, insert, update on catalog.exercises to authenticated;
grant select, insert, update on catalog.exercise_translations to authenticated;

revoke all on catalog.exercises, catalog.exercise_translations from anon;

-- ---------------------------------------------------------------------------
-- search_exercises — search_foods ile aynı iskelet (bulanık ad araması +
-- kas/ekipman/zorluk filtresi).
-- ---------------------------------------------------------------------------
create or replace function public.search_exercises(
  query text,
  only_locale text default null,
  muscle_group text default null,
  equipment_filter text default null,
  limit_count integer default 50
)
returns table (
  exercise_id uuid,
  matched_name text,
  matched_locale text,
  match_score real,
  primary_muscle text,
  equipment text,
  difficulty text,
  met_value numeric,
  is_bodyweight boolean,
  is_custom boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with matches as (
    select
      et.exercise_id,
      et.name as matched_name,
      et.locale as matched_locale,
      case
        when query is null or trim(query) = '' then 1.0::real
        else extensions.similarity(
          catalog.immutable_unaccent(lower(et.name)),
          catalog.immutable_unaccent(lower(query))
        )
      end as score
    from catalog.exercise_translations et
    where (only_locale is null or et.locale = only_locale)
      and (
        query is null or trim(query) = ''
        or catalog.immutable_unaccent(lower(et.name))
          ilike '%' || catalog.immutable_unaccent(lower(query)) || '%'
        or catalog.immutable_unaccent(lower(et.name))
          operator(extensions.%) catalog.immutable_unaccent(lower(query))
      )
  ),
  best_per_exercise as (
    select distinct on (exercise_id) exercise_id, matched_name, matched_locale, score
    from matches
    order by exercise_id, score desc
  )
  select
    e.id,
    bm.matched_name,
    bm.matched_locale,
    bm.score,
    e.primary_muscle,
    e.equipment,
    e.difficulty,
    e.met_value,
    e.is_bodyweight,
    (e.owner_id is not null)
  from best_per_exercise bm
  join catalog.exercises e on e.id = bm.exercise_id
  where e.deleted_at is null
    and (muscle_group is null or e.primary_muscle = muscle_group)
    and (equipment_filter is null or e.equipment = equipment_filter)
  order by bm.score desc, bm.matched_name
  limit limit_count
$$;

comment on function public.search_exercises is
  'Egzersiz kataloğunda TR/EN ad araması + kas/ekipman filtresi. SECURITY INVOKER: yalnız çağıranın görebileceği (global + kendi) egzersizler.';

-- ---------------------------------------------------------------------------
-- exercise_detail — istenen dil, yoksa herhangi bir mevcut dile düşer
-- (recipe_detail'deki matched_name coalesce deseniyle aynı fikir).
-- ---------------------------------------------------------------------------
create or replace function public.exercise_detail(target_exercise_id uuid, preferred_locale text default 'tr')
returns table (
  exercise_id uuid,
  name text,
  description text,
  steps text[],
  common_mistakes text[],
  safety_notes text,
  primary_muscle text,
  secondary_muscles text[],
  equipment text,
  difficulty text,
  met_value numeric,
  is_bodyweight boolean,
  media_url text,
  thumbnail_url text,
  is_custom boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id,
    coalesce(
      (select et.name from catalog.exercise_translations et where et.exercise_id = e.id and et.locale = preferred_locale),
      (select et.name from catalog.exercise_translations et where et.exercise_id = e.id limit 1)
    ),
    coalesce(
      (select et.description from catalog.exercise_translations et where et.exercise_id = e.id and et.locale = preferred_locale),
      (select et.description from catalog.exercise_translations et where et.exercise_id = e.id limit 1)
    ),
    coalesce(
      (select et.steps from catalog.exercise_translations et where et.exercise_id = e.id and et.locale = preferred_locale),
      (select et.steps from catalog.exercise_translations et where et.exercise_id = e.id limit 1)
    ),
    coalesce(
      (select et.common_mistakes from catalog.exercise_translations et where et.exercise_id = e.id and et.locale = preferred_locale),
      (select et.common_mistakes from catalog.exercise_translations et where et.exercise_id = e.id limit 1)
    ),
    coalesce(
      (select et.safety_notes from catalog.exercise_translations et where et.exercise_id = e.id and et.locale = preferred_locale),
      (select et.safety_notes from catalog.exercise_translations et where et.exercise_id = e.id limit 1)
    ),
    e.primary_muscle,
    e.secondary_muscles,
    e.equipment,
    e.difficulty,
    e.met_value,
    e.is_bodyweight,
    e.media_url,
    e.thumbnail_url,
    (e.owner_id is not null)
  from catalog.exercises e
  where e.id = target_exercise_id and e.deleted_at is null
$$;

comment on function public.exercise_detail is
  'Bir egzersizin tam detayı, tercih edilen dile düşerek. RLS çağıranın izniyle uygulanır.';

-- GÜVENLİK NOTU (bkz. recipe_functions.sql'deki aynı başlıklı not): `public`
-- şemasındaki fonksiyonlara varsayılan EXECUTE hem PUBLIC hem de anon'a
-- AYRI AYRI açılır — ikisinden de açıkça revoke edilmesi gerekir.
revoke execute on function public.search_exercises(text, text, text, text, integer) from public;
revoke execute on function public.search_exercises(text, text, text, text, integer) from anon;
grant execute on function public.search_exercises(text, text, text, text, integer) to authenticated;

revoke execute on function public.exercise_detail(uuid, text) from public;
revoke execute on function public.exercise_detail(uuid, text) from anon;
grant execute on function public.exercise_detail(uuid, text) to authenticated;
