-- Implements: MVP-03
-- PRD: §12-13 (03-nutrition-core.md), §09
--
-- Besin kataloğu şeması. §03 "Temel veri modeli": foods, food_translations,
-- food_aliases, food_nutrients, food_portions, food_sources, food_versions,
-- brands, barcodes.
--
-- MİMARİ KARAR (14-open-decisions.md'de gerekçeli): `catalog` şeması
-- PostgREST Data API'sine DOĞRUDAN açılmaz. Supabase'in `authenticator`
-- rolünün db_schemas ayarını genişletmek proje genelinde bir API-yüzeyi
-- değişikliğidir ve bu migration'ın kapsamını aşar. Bunun yerine §09'un
-- zaten önerdiği desen kullanılır: "View'lar security_invoker veya kapalı
-- şema ile RLS sınırını korur." Client yalnız `public` şemasındaki
-- SECURITY INVOKER fonksiyonlar üzerinden (search_foods, food_detail)
-- kataloğa erişir; bu fonksiyonlar çağıranın izinleriyle çalışır, RLS'i
-- atlamaz.
--
-- NOT (dosya geçmişi): Bu dosya remote'ta iki adımda uygulandı — önce bu
-- hâliyle, sonra `catalog_immutable_unaccent_search_path` adlı ayrı bir
-- migration `immutable_unaccent`e `set search_path = ''` ekledi (Supabase
-- güvenlik denetçisinin "Function Search Path Mutable" uyarısına karşılık).
-- O düzeltme burada GERİYE gömülüdür — dosya baştan doğru hâliyle duruyor,
-- ayrı bir "fix" migration'ı tekrarlanmıyor. Bu yüzden yerel migration
-- klasörü remote'un migration SAYISINDAN bir eksik görünür; bu kasıtlıdır
-- ve 14-open-decisions.md'de kayıtlıdır.

create schema if not exists catalog;
revoke all on schema catalog from anon;

-- SECURITY INVOKER fonksiyonların catalog nesnelerine erişebilmesi için
-- authenticated'a USAGE/SELECT gerekir; bu Data API'ye açık olmakla AYNI
-- şey değildir — yalnız plain Postgres izni. Data API yüzeyi hâlâ
-- yalnızca `public`tir.
grant usage on schema catalog to authenticated;

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- `extensions.unaccent(text)` (tek argümanlı) STABLE'dır: geçerli arama
-- yoluna bağlıdır ve Postgres onu index ifadesinde reddeder ("functions in
-- index expression must be marked IMMUTABLE"). Sözlüğü açıkça sabitleyen
-- iki argümanlı form gerçekten değişmezdir; bu sarmalayıcı onu IMMUTABLE
-- olarak işaretlemeyi güvenli kılar. Standart Postgres/Supabase çözümü.
create function catalog.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ---------------------------------------------------------------------------
-- food_sources — §03 "Kaynak önceliği" sıralamasının lookup tablosu.
-- ---------------------------------------------------------------------------
create table catalog.food_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  -- Düşük sayı = yüksek öncelik. §03 sırası birebir: doğrulanmış Calouch ->
  -- Türk yemekleri -> güvenilir uluslararası -> markalı/barkodlu -> kullanıcı özel.
  priority smallint not null,
  created_at timestamptz not null default now()
);

insert into catalog.food_sources (key, display_name, priority) values
  ('calouch_verified', 'Doğrulanmış Calouch verisi', 1),
  ('turkish_dishes', 'Türk yemekleri', 2),
  ('international_reference', 'Güvenilir uluslararası kaynak', 3),
  ('branded_product', 'Markalı/barkodlu ürün', 4),
  ('user_custom', 'Kullanıcı özel besini', 5);

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
create table catalog.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- foods — karma sahiplik: owner_id null = global katalog, dolu = kullanıcı
-- özel besini (§03 "kullanıcı özel besini sahipliği").
-- ---------------------------------------------------------------------------
create table catalog.foods (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references catalog.brands (id),
  -- null = global katalog girdisi; dolu = bu kullanıcının özel besini.
  -- Global girdiler yalnız migration/seed/gelecekteki admin panelinden
  -- (service-role) yazılır — istemci INSERT policy'si yalnız kendi
  -- owner_id'sini kabul eder (aşağıda).
  owner_id uuid references auth.users (id) on delete cascade,
  category text,
  -- ISO 3166-1 alpha-2; null = uluslararası/genel besin.
  country_code text,
  -- "En güncel sürüm" için her okuma sorgusunda ayrı bir MAX(version_number)
  -- alt sorgusu gerekmesin diye önbelleklenmiş işaretçi. food_versions
  -- tablosu henüz yokken tanımlanamaz; FK aşağıda ALTER TABLE ile eklenir.
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Hard delete yok: geçmiş öğün snapshot'ları (MVP-05) bir besine referans
  -- taşıyabilir. Silme yalnız soft-delete'tir; DELETE policy'si bilinçli
  -- olarak tanımlanmaz (aşağıda).
  deleted_at timestamptz,

  constraint foods_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create index foods_owner_id_idx on catalog.foods (owner_id) where owner_id is not null;
create index foods_category_idx on catalog.foods (category) where category is not null;

-- ---------------------------------------------------------------------------
-- food_versions — §03 "Snapshot ve sürümleme": katalog değişse bile eski
-- öğünün kalori/makrosu değişmez. Nutrient güncellemesi YENİ versiyon
-- yaratır, mevcut satırı değiştirmez.
-- ---------------------------------------------------------------------------
create table catalog.food_versions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references catalog.foods (id) on delete cascade,
  version_number integer not null,
  source_id uuid not null references catalog.food_sources (id),
  -- Dış kaynağın kendi sürüm/tarih bilgisi (ör. USDA release tarihi).
  source_reference text,
  -- §03 "doğrulama durumu ve kalite skoru".
  verification_status text not null default 'unverified',
  quality_score numeric(3, 2),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint food_versions_unique_number unique (food_id, version_number),
  constraint food_versions_status_valid
    check (verification_status in ('verified', 'unverified', 'flagged')),
  constraint food_versions_quality_score_range
    check (quality_score is null or quality_score between 0 and 1)
);

create index food_versions_food_id_idx on catalog.food_versions (food_id);

alter table catalog.foods
  add constraint foods_current_version_fk
    foreign key (current_version_id) references catalog.food_versions (id);

-- ---------------------------------------------------------------------------
-- food_nutrients — HER ZAMAN 100 g başına (§03 "100 g besin değerleri").
-- Porsiyona çevirme nutrition-engine'de yapılır, burada değil.
-- ---------------------------------------------------------------------------
create table catalog.food_nutrients (
  id uuid primary key default gen_random_uuid(),
  food_version_id uuid not null references catalog.food_versions (id) on delete cascade,

  energy_kcal numeric(7, 2) not null,
  protein_g numeric(6, 2) not null,
  carbs_g numeric(6, 2) not null,
  sugar_g numeric(6, 2),
  fat_g numeric(6, 2) not null,
  saturated_fat_g numeric(6, 2),
  fiber_g numeric(6, 2),
  sodium_mg numeric(8, 2),

  -- §03 "desteklenen mikro besinler" — sabit kolon yerine esnek anahtar/değer;
  -- her yeni mikro besin için migration gerektirmez.
  -- Örn: {"vitamin_c_mg": 12, "iron_mg": 1.4}
  micronutrients jsonb not null default '{}'::jsonb,

  constraint food_nutrients_unique_version unique (food_version_id),
  constraint food_nutrients_energy_nonneg check (energy_kcal >= 0),
  constraint food_nutrients_protein_range check (protein_g between 0 and 100),
  constraint food_nutrients_carbs_range check (carbs_g between 0 and 100),
  constraint food_nutrients_fat_range check (fat_g between 0 and 100),
  constraint food_nutrients_sugar_range
    check (sugar_g is null or sugar_g between 0 and 100),
  constraint food_nutrients_saturated_fat_range
    check (saturated_fat_g is null or saturated_fat_g between 0 and 100),
  constraint food_nutrients_fiber_range
    check (fiber_g is null or fiber_g between 0 and 100),
  constraint food_nutrients_sodium_nonneg
    check (sodium_mg is null or sodium_mg >= 0),
  -- Veri kalitesi tutarlılığı: şeker karbonhidratın, doymuş yağ toplam
  -- yağın bir alt kümesidir.
  constraint food_nutrients_sugar_le_carbs
    check (sugar_g is null or sugar_g <= carbs_g),
  constraint food_nutrients_saturated_le_fat
    check (saturated_fat_g is null or saturated_fat_g <= fat_g),
  constraint food_nutrients_micronutrients_is_object
    check (jsonb_typeof(micronutrients) = 'object')
);

-- ---------------------------------------------------------------------------
-- food_portions — §03 "porsiyonlar". Sürümden bağımsız: "1 su bardağı"nın
-- gram karşılığı besinin fiziksel kimliğine aittir, nutrient doğrulama
-- döngüsüne değil.
-- ---------------------------------------------------------------------------
create table catalog.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references catalog.foods (id) on delete cascade,
  label text not null,
  grams numeric(7, 2) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),

  constraint food_portions_grams_positive check (grams > 0)
);

create index food_portions_food_id_idx on catalog.food_portions (food_id);

-- ---------------------------------------------------------------------------
-- food_translations — §03 "yerelleştirilmiş ad". Uygulamanın desteklediği
-- iki dil (@calouch/localization SUPPORTED_LOCALES ile aynı).
-- ---------------------------------------------------------------------------
create table catalog.food_translations (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references catalog.foods (id) on delete cascade,
  locale text not null,
  name text not null,

  constraint food_translations_unique_locale unique (food_id, locale),
  constraint food_translations_locale_valid check (locale in ('tr', 'en'))
);

create index food_translations_food_id_idx on catalog.food_translations (food_id);
-- Aksan-duyarsız bulanık arama (ör. "yogurt" -> "yoğurt").
create index food_translations_name_trgm_idx
  on catalog.food_translations using gin ((catalog.immutable_unaccent(name)) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- food_aliases — §03 alias arama.
-- ---------------------------------------------------------------------------
create table catalog.food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references catalog.foods (id) on delete cascade,
  locale text not null,
  alias text not null,

  constraint food_aliases_locale_valid check (locale in ('tr', 'en'))
);

create index food_aliases_food_id_idx on catalog.food_aliases (food_id);
create index food_aliases_alias_trgm_idx
  on catalog.food_aliases using gin ((catalog.immutable_unaccent(alias)) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- barcodes
-- ---------------------------------------------------------------------------
create table catalog.barcodes (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references catalog.foods (id) on delete cascade,
  barcode text not null unique,
  created_at timestamptz not null default now()
);

create index barcodes_food_id_idx on catalog.barcodes (food_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- §09: "İstemciden erişilebilen her tabloda RLS zorunlu." catalog Data
-- API'ye doğrudan açık olmasa da, SECURITY INVOKER fonksiyonlar bu
-- tablolara ÇAĞIRANIN izniyle erişir — RLS burada da zorunlu ve tek
-- koruma katmanıdır.

alter table catalog.food_sources enable row level security;
alter table catalog.brands enable row level security;
alter table catalog.foods enable row level security;
alter table catalog.food_versions enable row level security;
alter table catalog.food_nutrients enable row level security;
alter table catalog.food_portions enable row level security;
alter table catalog.food_translations enable row level security;
alter table catalog.food_aliases enable row level security;
alter table catalog.barcodes enable row level security;

alter table catalog.food_sources force row level security;
alter table catalog.brands force row level security;
alter table catalog.foods force row level security;
alter table catalog.food_versions force row level security;
alter table catalog.food_nutrients force row level security;
alter table catalog.food_portions force row level security;
alter table catalog.food_translations force row level security;
alter table catalog.food_aliases force row level security;
alter table catalog.barcodes force row level security;

-- Lookup tabloları: herkese okunur, yazma yok (yalnız service-role/migration).
create policy "food_sources_select_all" on catalog.food_sources
  for select to authenticated using (true);
create policy "brands_select_all" on catalog.brands
  for select to authenticated using (true);

-- foods: global (owner_id null) + kendi özel besinin görünür.
create policy "foods_select_visible" on catalog.foods
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

-- Yalnız KENDİ özel besinini oluşturabilir; global girdi istemciden
-- yaratılamaz (§00 "kullanılmayan ürün yüzeyi yayınlanmaz" — katalog
-- küratörlüğü bu fazda istemci özelliği değil).
create policy "foods_insert_own" on catalog.foods
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "foods_update_own" on catalog.foods
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- DELETE policy'si YOK: silme yalnız soft-delete (deleted_at) ile, UPDATE
-- üzerinden yapılır. Hard delete, gelecekteki meal_entry_snapshot'ları
-- (MVP-05) sahipsiz bırakabilirdi.

-- Çocuk tablolar: görünürlük ebeveyn `foods` satırından miras alınır.
create policy "food_versions_select_visible" on catalog.food_versions
  for select to authenticated
  using (
    exists (
      select 1 from catalog.foods f
      where f.id = food_versions.food_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "food_versions_insert_own" on catalog.food_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from catalog.foods f
      where f.id = food_versions.food_id and f.owner_id = (select auth.uid())
    )
  );
-- UPDATE policy'si YOK: bir versiyon yayınlandıktan sonra değişmez
-- (§03 "Katalog verisi değişse bile eski öğünün kalori/makrosu değişmez").
-- Düzeltme YENİ versiyon eklemekle yapılır.

create policy "food_nutrients_select_visible" on catalog.food_nutrients
  for select to authenticated
  using (
    exists (
      select 1 from catalog.food_versions v
      join catalog.foods f on f.id = v.food_id
      where v.id = food_nutrients.food_version_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "food_nutrients_insert_own" on catalog.food_nutrients
  for insert to authenticated
  with check (
    exists (
      select 1 from catalog.food_versions v
      join catalog.foods f on f.id = v.food_id
      where v.id = food_nutrients.food_version_id and f.owner_id = (select auth.uid())
    )
  );

create policy "food_portions_select_visible" on catalog.food_portions
  for select to authenticated
  using (
    exists (
      select 1 from catalog.foods f
      where f.id = food_portions.food_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "food_portions_insert_own" on catalog.food_portions
  for insert to authenticated
  with check (
    exists (select 1 from catalog.foods f where f.id = food_portions.food_id and f.owner_id = (select auth.uid()))
  );

create policy "food_portions_update_own" on catalog.food_portions
  for update to authenticated
  using (
    exists (select 1 from catalog.foods f where f.id = food_portions.food_id and f.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from catalog.foods f where f.id = food_portions.food_id and f.owner_id = (select auth.uid()))
  );

create policy "food_translations_select_visible" on catalog.food_translations
  for select to authenticated
  using (
    exists (
      select 1 from catalog.foods f
      where f.id = food_translations.food_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "food_translations_insert_own" on catalog.food_translations
  for insert to authenticated
  with check (
    exists (select 1 from catalog.foods f where f.id = food_translations.food_id and f.owner_id = (select auth.uid()))
  );

create policy "food_translations_update_own" on catalog.food_translations
  for update to authenticated
  using (
    exists (select 1 from catalog.foods f where f.id = food_translations.food_id and f.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from catalog.foods f where f.id = food_translations.food_id and f.owner_id = (select auth.uid()))
  );

create policy "food_aliases_select_visible" on catalog.food_aliases
  for select to authenticated
  using (
    exists (
      select 1 from catalog.foods f
      where f.id = food_aliases.food_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "food_aliases_insert_own" on catalog.food_aliases
  for insert to authenticated
  with check (
    exists (select 1 from catalog.foods f where f.id = food_aliases.food_id and f.owner_id = (select auth.uid()))
  );

create policy "barcodes_select_visible" on catalog.barcodes
  for select to authenticated
  using (
    exists (
      select 1 from catalog.foods f
      where f.id = barcodes.food_id
        and (f.owner_id is null or f.owner_id = (select auth.uid()))
    )
  );

create policy "barcodes_insert_own" on catalog.barcodes
  for insert to authenticated
  with check (
    exists (select 1 from catalog.foods f where f.id = barcodes.food_id and f.owner_id = (select auth.uid()))
  );

-- Plain Postgres GRANT'leri: SECURITY INVOKER fonksiyonların RLS altında
-- çalışabilmesi için gerekli. Data API yüzeyini GENİŞLETMEZ — yalnız
-- `public` şemasındaki fonksiyonlar bu izinleri devralır.
grant select on
  catalog.food_sources, catalog.brands, catalog.foods, catalog.food_versions,
  catalog.food_nutrients, catalog.food_portions, catalog.food_translations,
  catalog.food_aliases, catalog.barcodes
to authenticated;

grant insert on
  catalog.foods, catalog.food_versions, catalog.food_nutrients,
  catalog.food_portions, catalog.food_translations, catalog.food_aliases,
  catalog.barcodes
to authenticated;

grant update on
  catalog.foods, catalog.food_portions, catalog.food_translations
to authenticated;

revoke all on catalog.food_sources, catalog.brands, catalog.foods,
  catalog.food_versions, catalog.food_nutrients, catalog.food_portions,
  catalog.food_translations, catalog.food_aliases, catalog.barcodes
from anon;
