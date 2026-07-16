-- Implements: MVP-02
-- PRD: §8.2 (onboarding alanları), §8.3 (hedefler), §8.4 (günlük hedef hesabı), §09
--
-- Onboarding girdileri ve hesaplanan günlük hedefler.
--
-- KAPSAM DIŞI, bilinçli olarak:
--   * Alerji bilgisi (§8.2 "İsteğe bağlı alerji bilgisi") — §09, özel sağlık
--     notu için envelope encryption'ı "değerlendirilir" diyor ve anahtar
--     rotasyonu/arama gereksinimi henüz kararlaştırılmadı (14-open-decisions).
--     Şifrelenmemiş bir alerji kolonu açmak, o kararı sessizce vermek olurdu.
--   * Kilo geçmişi — MVP-07'nin (ölçü ve kilo) konusu. Buradaki weight_kg
--     hedefin girdisidir, zaman serisi değil.
--   * Hedef geçmişi — §8.4 istemiyor. Formül sürümü saklandığı için ileride
--     geçmiş tablosu eklemek geriye dönük uyumsuzluk yaratmaz.

-- ---------------------------------------------------------------------------
-- Onboarding girdileri (§8.2)
-- ---------------------------------------------------------------------------
alter table public.profiles
  -- §8.2 yalnız doğum YILI istiyor: tam tarih, hesaba katkısı olmadan
  -- hassasiyeti artırırdı (§09 veri minimizasyonu).
  add column birth_year smallint,
  add column height_cm numeric(5, 1),
  add column weight_kg numeric(5, 1),
  add column target_weight_kg numeric(5, 1),

  -- §8.2'de YOK; hedef motoru için eklendi (karar: 14-open-decisions.md).
  -- 'unspecified' bir eksiklik değil, kullanıcının adımı atlama hakkıdır
  -- (§00 "veri reddedilse de temel kullanım çalışır"). Bu yüzden NOT NULL
  -- + default: "bilinmiyor" ile "henüz sorulmadı" ayrımına gerek yok.
  add column biological_sex text not null default 'unspecified',

  add column activity_level text,
  add column primary_goal text,
  add column weekly_change_kg numeric(3, 2),
  add column diet_preference text,
  -- §8.2 "Günlük öğün düzeni" — günde kaç öğün.
  add column meals_per_day smallint,
  add column unit_system text not null default 'metric',

  -- §02: "Onboarding yarıda kalınca devam eder." Null = tamamlanmadı.
  add column onboarding_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Hesaplanan hedefler (§8.4)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column bmr_kcal integer,
  add column tdee_kcal integer,
  add column target_calories_kcal integer,
  add column protein_g integer,
  add column carbs_g integer,
  add column fat_g integer,
  add column fiber_g integer,
  add column water_ml integer,

  -- §8.4: "Formül ve sürümü kaydedilir."
  -- Sürüm olmadan, formül değiştiğinde eski kullanıcıların hedefleri
  -- açıklanamaz hâle gelirdi: hangi hesaptan çıktıkları bilinmezdi.
  add column goal_formula_version text,
  add column goals_calculated_at timestamptz,

  -- §00 "Belirsizlik görünürdür": cinsiyet verilmediyse hedef ±83 kcal
  -- belirsizlik taşır ve bu kullanıcıdan saklanmaz.
  add column goals_confidence text,
  add column goal_warnings text[] not null default '{}',

  -- §02 kabul kriteri: "manuel override korunur."
  -- Hesaplanan değerlerin ÜZERİNE yazmak yerine ayrı tutulur: kullanıcı kilo
  -- girince hedefler yeniden hesaplanır ve elle ayarladığı değer kaybolmamalı.
  -- Etkin hedef = override ?? hesaplanan.
  -- Örn: {"targetCaloriesKcal": 2000, "proteinG": 150}
  add column goal_overrides jsonb not null default '{}'::jsonb;

comment on column public.profiles.goal_overrides is
  'Kullanıcının elle değiştirdiği hedefler (§8.4). Etkin değer = override ?? hesaplanan. Yeniden hesaplama bunu silmez.';

comment on column public.profiles.goal_formula_version is
  '§8.4 formül sürümü. Değişince eski hedefler otomatik yeniden hesaplanmaz.';

-- ---------------------------------------------------------------------------
-- Kısıtlar
-- ---------------------------------------------------------------------------
-- §09: "Kısıtlar veritabanında: istemci doğrulaması atlanabilir."
-- Aşağıdaki aralıklar nutrition-engine'deki assertValidInput ile AYNI olmalı;
-- ikisi ayrışırsa motorun reddettiği bir satır veritabanına girebilir.
alter table public.profiles
  add constraint profiles_biological_sex_valid
    check (biological_sex in ('male', 'female', 'unspecified')),

  add constraint profiles_unit_system_valid
    check (unit_system in ('metric', 'imperial')),

  add constraint profiles_activity_level_valid
    check (activity_level is null or activity_level in
      ('sedentary', 'light', 'moderate', 'active', 'very_active')),

  -- §8.3'teki sekiz hedef, birebir.
  add constraint profiles_primary_goal_valid
    check (primary_goal is null or primary_goal in
      ('lose_weight', 'gain_weight', 'maintain_weight', 'build_muscle',
       'eat_healthy', 'increase_activity', 'training_routine', 'improve_measurements')),

  add constraint profiles_height_range
    check (height_cm is null or height_cm between 80 and 260),

  add constraint profiles_weight_range
    check (weight_kg is null or weight_kg between 20 and 500),

  add constraint profiles_target_weight_range
    check (target_weight_kg is null or target_weight_kg between 20 and 500),

  -- Motor 13-120 yaş kabul ediyor. CHECK içinde now() kullanılamaz
  -- (immutable değil), bu yüzden burada geniş ama akla yatkın bir aralık
  -- tutulur; yaş kuralını motor uygular.
  add constraint profiles_birth_year_range
    check (birth_year is null or birth_year between 1900 and 2100),

  add constraint profiles_weekly_change_range
    check (weekly_change_kg is null or weekly_change_kg between 0 and 2),

  add constraint profiles_meals_per_day_range
    check (meals_per_day is null or meals_per_day between 1 and 10),

  add constraint profiles_goals_confidence_valid
    check (goals_confidence is null or goals_confidence in ('high', 'low')),

  -- Hesaplanan hedefler ya hep birlikte vardır ya hiç yoktur: yarım hedef
  -- seti (kalori var, protein yok) UI'da açıklanamaz bir durum üretir.
  add constraint profiles_goals_complete_or_absent
    check (
      (target_calories_kcal is null and goal_formula_version is null)
      or (
        target_calories_kcal is not null
        and goal_formula_version is not null
        and protein_g is not null
        and carbs_g is not null
        and fat_g is not null
        and fiber_g is not null
        and water_ml is not null
        and goals_confidence is not null
      )
    ),

  add constraint profiles_goal_overrides_is_object
    check (jsonb_typeof(goal_overrides) = 'object');

-- ---------------------------------------------------------------------------
-- Not: RLS
-- ---------------------------------------------------------------------------
-- profiles üzerindeki RLS ve dört policy 20260715000001'de kuruldu ve tabloya
-- yenidir; yeni kolonlar aynı satır sahipliğine tabidir. Kolon eklemek policy
-- gerektirmez — ama bu migration'ın RLS testi, sağlık verisi taşıyan bu
-- kolonların gerçekten korunduğunu ayrıca doğrular (§09).
