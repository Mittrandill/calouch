-- Implements: MVP-05
-- PRD: §14 (03-nutrition-core.md), §09
--
-- Manuel öğün kaydı. §03 "Temel veri modeli" kullanıcı içeriği:
-- meal_entries, meal_entry_items, meal_entry_snapshots.
--
-- KAPSAM DIŞI (bilinçli, 14-open-decisions.md'de kayıtlı):
--   * Su takibi, tarifler, favorite_foods — MVP-06.
--   * Öğün kompozisyonunu (kalem ekleme/çıkarma) sonradan düzenleme —
--     bu dalgada kullanıcı yanlış girdiği öğünü soft-delete edip yeniden
--     kaydeder. Ayrı bir "edit" akışı sonraki işte.
--   * Barkod/etiket/fotoğraf giriş yöntemleri — AI'a bağlı, MVP-08+.
--   * Tam offline outbox (SQLite kuyruğu) — bu, tek bir MVP işine değil
--     mobil mimarinin geneline ait ayrı bir altyapı çalışması. Bu migration
--     yalnız SUNUCU tarafı idempotency'yi (operation_id) sağlar; cihaz
--     kapalıyken kuyruğa alma istemci tarafında henüz yok.

-- ---------------------------------------------------------------------------
-- meal_entries
-- ---------------------------------------------------------------------------
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- §03 öğün türleri, birebir + kullanıcı tanımlı.
  meal_type text not null,
  -- meal_type='custom' iken kullanıcının kendi adlandırdığı öğün.
  custom_label text,

  -- Kullanıcı geçmişe dönük giriş yapabilir (ör. sabahki kahvaltıyı akşam
  -- girer); bu yüzden logged_at created_at'tan bağımsızdır.
  logged_at timestamptz not null default now(),
  notes text,

  -- §03 "tekrar gönderim çift öğün üretmez". Client tarafından üretilir
  -- (UUID); aynı operation_id ile ikinci çağrı log_meal() içinde mevcut
  -- satırı döner, yeni satır YARATMAZ.
  operation_id uuid not null unique,

  -- §03 kullanıcı tablosu standardı: id, user_id, created_at, updated_at,
  -- deleted_at, version.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- §09 "öğün ... version kontrolü" — iyimser eşzamanlılık. Client
  -- okuduğu version'ı günceller; uyuşmazsa güncelleme reddedilir
  -- (sessiz overwrite yok).
  version integer not null default 1,

  constraint meal_entries_type_valid check (
    meal_type in ('breakfast', 'snack', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'night', 'custom')
  ),
  constraint meal_entries_custom_label_required
    check (meal_type <> 'custom' or custom_label is not null)
);

create index meal_entries_user_id_logged_at_idx
  on public.meal_entries (user_id, logged_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- meal_entry_items — bir öğündeki her besin kalemi.
-- ---------------------------------------------------------------------------
create table public.meal_entry_items (
  id uuid primary key default gen_random_uuid(),
  meal_entry_id uuid not null references public.meal_entries (id) on delete cascade,
  food_id uuid not null references catalog.foods (id),
  -- Kayıt anında hangi sürüm kullanıldı — food_versions ile birebir,
  -- meal_entry_snapshots'taki dondurulmuş değerlerin kaynağını izler.
  food_version_id uuid not null references catalog.food_versions (id),

  quantity_grams numeric(7, 2) not null,
  -- Kullanıcının seçtiği gösterim: "1 su bardağı (150 g)". Hesaplama HER
  -- ZAMAN quantity_grams'tan gider; bu yalnız arayüz metnidir.
  portion_label text,

  created_at timestamptz not null default now(),

  constraint meal_entry_items_quantity_positive check (quantity_grams > 0)
);

create index meal_entry_items_meal_entry_id_idx on public.meal_entry_items (meal_entry_id);
create index meal_entry_items_food_id_idx on public.meal_entry_items (food_id);

-- ---------------------------------------------------------------------------
-- meal_entry_snapshots — §03 "Snapshot ve sürümleme": katalog değişse bile
-- eski öğünün kalori/makrosu değişmez. Kayıt anında hesaplanan değerler
-- burada DONDURULUR; sonradan asla güncellenmez (aşağıda UPDATE policy yok).
-- ---------------------------------------------------------------------------
create table public.meal_entry_snapshots (
  id uuid primary key default gen_random_uuid(),
  meal_entry_item_id uuid not null unique references public.meal_entry_items (id) on delete cascade,
  food_version_id uuid not null references catalog.food_versions (id),

  -- quantity_grams için ÇÖZÜLMÜŞ değerler (100g başına değil).
  energy_kcal numeric(9, 2) not null,
  protein_g numeric(8, 2) not null,
  carbs_g numeric(8, 2) not null,
  sugar_g numeric(8, 2),
  fat_g numeric(8, 2) not null,
  saturated_fat_g numeric(8, 2),
  fiber_g numeric(8, 2),
  sodium_mg numeric(10, 2),
  micronutrients jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint meal_entry_snapshots_micronutrients_is_object
    check (jsonb_typeof(micronutrients) = 'object')
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.meal_entries enable row level security;
alter table public.meal_entry_items enable row level security;
alter table public.meal_entry_snapshots enable row level security;

alter table public.meal_entries force row level security;
alter table public.meal_entry_items force row level security;
alter table public.meal_entry_snapshots force row level security;

-- SELECT: normal RLS, istemci kendi geçmişini doğrudan okuyabilir.
create policy "meal_entries_select_own" on public.meal_entries
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "meal_entry_items_select_own" on public.meal_entry_items
  for select to authenticated
  using (
    exists (
      select 1 from public.meal_entries m
      where m.id = meal_entry_items.meal_entry_id and m.user_id = (select auth.uid())
    )
  );

create policy "meal_entry_snapshots_select_own" on public.meal_entry_snapshots
  for select to authenticated
  using (
    exists (
      select 1 from public.meal_entry_items i
      join public.meal_entries m on m.id = i.meal_entry_id
      where i.id = meal_entry_snapshots.meal_entry_item_id and m.user_id = (select auth.uid())
    )
  );

-- UPDATE: yalnız meal_entries üstünde, yalnız meta alanlar (meal_type,
-- custom_label, logged_at, notes). Kalem/snapshot değişikliği bu dalgada
-- desteklenmiyor (yukarıdaki KAPSAM DIŞI notu) — istemci ilgili satırları
-- zaten INSERT edemediği için (aşağıda GRANT yok) buna zorlanmıyor.
create policy "meal_entries_update_own" on public.meal_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- INSERT policy'si YOK: §09 "Öğün + kalem/snapshot ... atomiktir. Client'ın
-- birden çok bağımsız write yapmasına bırakılmaz." İstemciye bu üç tabloda
-- INSERT GRANT'i verilmez (aşağıda) — tek yazma yolu SECURITY DEFINER
-- `public.log_meal()` fonksiyonudur. RLS INSERT policy'si burada anlamsız
-- olurdu çünkü client zaten INSERT çağıramaz; policy eksikliği kasıtlı.

-- DELETE policy'si YOK: silme yalnız soft-delete (deleted_at) — UPDATE
-- policy'si bunu zaten kapsıyor.

grant select, update on public.meal_entries to authenticated;
grant select on public.meal_entry_items to authenticated;
grant select on public.meal_entry_snapshots to authenticated;

revoke insert, delete on public.meal_entries from authenticated;
revoke insert, update, delete on public.meal_entry_items from authenticated;
revoke insert, update, delete on public.meal_entry_snapshots from authenticated;

revoke all on public.meal_entries, public.meal_entry_items, public.meal_entry_snapshots from anon;
