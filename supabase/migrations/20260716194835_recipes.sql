-- Implements: MVP-06
-- PRD: §14 (03-nutrition-core.md §"Tarifler"), §09
--
-- Tarifler. §03: "Kullanıcı tarif oluşturur, malzeme ve gram ekler,
-- porsiyon sayısı belirler, porsiyon değerini görür, kopyalar, özel tutar
-- ve öğüne ekler. Tarif sürümlüdür; eski öğün eski tarif snapshot'ını
-- korur."
--
-- catalog.foods'tan BİLİNÇLİ OLARAK BAĞIMSIZ: §03 kullanıcı içeriğini
-- `recipes`/`recipe_versions`/`recipe_items` olarak ayrı sayıyor (foods'un
-- "kullanıcı özel besini" ile karıştırılmaz). Bir tarifi öğüne katmak
-- catalog.foods'ta sahte bir "besin" satırı YARATMAZ — meal_entry_items
-- aşağıda tarif kaynağını da kabul edecek şekilde genişletilir.
--
-- SÜRÜMLEME MODELİ: recipe_items food_version_id PIN ETMEZ (meal_entry_
-- items'ın aksine). Sebep: recipe_version'ın koruduğu şey MALZEME
-- KOMPOZİSYONU (hangi besin, kaç gram) — kullanıcının kendi düzenlemesine
-- karşı sabitlik. Malzemenin GÜNCEL besin değeri (current_version_id
-- üzerinden) her görüntülemede/eklemede canlı okunur; bu normaldir çünkü
-- tarif bir "kayıt" değil bir "tarif tanımı"dır. Kalori/makronun KATALOG
-- güncellemesinden asla etkilenmemesi gereken tek yer meal_entry_snapshots
-- — bir tarif öğüne eklendiğinde o anki hesap orada donar (log_meal_
-- recipes.sql).
--
-- KAPSAM DIŞI (14-open-decisions.md'de kayıtlı):
--   * Herkese açık/paylaşılan tarif kataloğu — bu dalgada tarifler yalnız
--     sahibi tarafından görülür, §03'ün "başkası tarafından okunamaz"
--     kabul kriteri budur.
--   * "Kopyalar" akışı ayrı bir backend yüzeyi gerektirmez: istemci var
--     olan bir tarifin güncel malzemelerini okuyup save_recipe()'i
--     p_recipe_id=null ile tekrar çağırır (yeni, bağımsız bir tarif
--     oluşur).

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  -- İlk sürüm oluşturulana kadar null; save_recipe() atomik olarak
  -- recipe + ilk recipe_version'ı birlikte yazar.
  current_version_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint recipes_name_not_blank check (length(trim(name)) > 0)
);

create index recipes_user_id_idx on public.recipes (user_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- recipe_versions — immutable. §03 "Tarif sürümlüdür": kompozisyon her
-- düzenlemede YENİ bir satır olarak eklenir, var olan satır asla UPDATE
-- edilmez (aşağıda UPDATE/DELETE policy'si yok, GRANT de yok).
-- ---------------------------------------------------------------------------
create table public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  version_number integer not null,

  -- Bu SÜRÜMDEKİ porsiyon sayısı — kullanıcı düzenlerken porsiyon
  -- sayısını da değiştirebilir, bu yüzden recipes'te değil burada.
  servings integer not null check (servings > 0),

  -- §03 "tekrar gönderim çift kayıt üretmez" — save_recipe() çağrısının
  -- idempotency anahtarı (hem ilk oluşturma hem her düzenleme kendi
  -- operation_id'sini taşır).
  operation_id uuid not null unique,

  created_at timestamptz not null default now(),

  constraint recipe_versions_recipe_version_unique unique (recipe_id, version_number)
);

create index recipe_versions_recipe_id_idx on public.recipe_versions (recipe_id);

alter table public.recipes
  add constraint recipes_current_version_id_fkey
  foreign key (current_version_id) references public.recipe_versions (id);

-- ---------------------------------------------------------------------------
-- recipe_items — immutable, bir recipe_version'ın malzeme listesi.
-- ---------------------------------------------------------------------------
create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_version_id uuid not null references public.recipe_versions (id) on delete cascade,
  food_id uuid not null references catalog.foods (id),

  quantity_grams numeric(7, 2) not null,

  created_at timestamptz not null default now(),

  constraint recipe_items_quantity_positive check (quantity_grams > 0)
);

create index recipe_items_recipe_version_id_idx on public.recipe_items (recipe_version_id);
create index recipe_items_food_id_idx on public.recipe_items (food_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.recipes enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.recipe_items enable row level security;

alter table public.recipes force row level security;
alter table public.recipe_versions force row level security;
alter table public.recipe_items force row level security;

create policy "recipes_select_own" on public.recipes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "recipe_versions_select_own" on public.recipe_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_versions.recipe_id and r.user_id = (select auth.uid())
    )
  );

create policy "recipe_items_select_own" on public.recipe_items
  for select to authenticated
  using (
    exists (
      select 1 from public.recipe_versions rv
      join public.recipes r on r.id = rv.recipe_id
      where rv.id = recipe_items.recipe_version_id and r.user_id = (select auth.uid())
    )
  );

-- UPDATE: yalnız recipes üstünde, yalnız meta alanlar (name, deleted_at).
-- Kompozisyon değişikliği YENİ sürüm demektir (save_recipe() üzerinden).
create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- INSERT policy'si YOK (meal_entries ile aynı gerekçe, §09 atomiklik):
-- recipe + ilk sürüm + malzemeler tek yazma yolu SECURITY DEFINER
-- `public.save_recipe()` fonksiyonudur (recipe_functions.sql).

grant select, update on public.recipes to authenticated;
grant select on public.recipe_versions to authenticated;
grant select on public.recipe_items to authenticated;

revoke insert, delete on public.recipes from authenticated;
revoke insert, update, delete on public.recipe_versions from authenticated;
revoke insert, update, delete on public.recipe_items from authenticated;

revoke all on public.recipes, public.recipe_versions, public.recipe_items from anon;

-- ---------------------------------------------------------------------------
-- meal_entry_items — tarif kaynağını da kabul edecek şekilde genişletilir.
-- Bir kalem YA bir besin YA bir tarif referanslar, ikisi birden değil.
-- ---------------------------------------------------------------------------
alter table public.meal_entry_items
  alter column food_id drop not null,
  alter column food_version_id drop not null,
  alter column quantity_grams drop not null,
  add column recipe_id uuid references public.recipes (id),
  add column recipe_version_id uuid references public.recipe_versions (id),
  add column recipe_servings numeric(6, 2),
  add constraint meal_entry_items_recipe_servings_positive check (recipe_servings > 0),
  add constraint meal_entry_items_source_check check (
    (
      food_id is not null and food_version_id is not null and quantity_grams is not null
      and recipe_id is null and recipe_version_id is null and recipe_servings is null
    ) or (
      recipe_id is not null and recipe_version_id is not null and recipe_servings is not null
      and food_id is null and food_version_id is null and quantity_grams is null
    )
  );

create index meal_entry_items_recipe_id_idx on public.meal_entry_items (recipe_id) where recipe_id is not null;

-- meal_entry_snapshots — tarif kalemlerinde tek bir food_version_id yok
-- (birden çok malzeme karışık), bu yüzden nullable olur. Kalemin hangi
-- tarif/sürümden geldiği zaten meal_entry_items.recipe_version_id'de
-- kayıtlı; burası yalnız DONMUŞ TOPLAM sayıları taşımaya devam eder.
alter table public.meal_entry_snapshots
  alter column food_version_id drop not null;
