-- Implements: MVP-06
-- PRD: §14 (03-nutrition-core.md §"Temel veri modeli" — "favorite_foods ve
-- özel besin sahipliği"), §09
--
-- Favori besin işaretleme. meal_entries/recipes'in aksine tek satırlık bir
-- yıldızlama — atomik çoklu-tablo yazma yok, bu yüzden SECURITY DEFINER
-- RPC gerekmez (§09 "yalnız zorunluysa"): client normal RLS altında
-- doğrudan INSERT/DELETE yapar.

create table public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references catalog.foods (id),
  created_at timestamptz not null default now(),

  constraint favorite_foods_unique unique (user_id, food_id)
);

create index favorite_foods_user_id_idx on public.favorite_foods (user_id);

alter table public.favorite_foods enable row level security;
alter table public.favorite_foods force row level security;

create policy "favorite_foods_select_own" on public.favorite_foods
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "favorite_foods_insert_own" on public.favorite_foods
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "favorite_foods_delete_own" on public.favorite_foods
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.favorite_foods to authenticated;
revoke update on public.favorite_foods from authenticated;
revoke all on public.favorite_foods from anon;

-- ---------------------------------------------------------------------------
-- Favori besinlerin zenginleştirilmiş listesi — search_foods ile AYNI
-- dönüş şekli, add-meal arama ekranı doğrudan aynı satır bileşenini
-- (FoodSearchResultRow) kullanabilsin diye.
-- ---------------------------------------------------------------------------
create or replace function public.list_favorite_foods(only_locale text default null)
returns table (
  food_id uuid,
  matched_name text,
  category text,
  brand_name text,
  energy_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  is_custom boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    f.id,
    coalesce(
      (select ft.name from catalog.food_translations ft
       where ft.food_id = f.id and ft.locale = coalesce(only_locale, 'tr') limit 1),
      (select ft.name from catalog.food_translations ft where ft.food_id = f.id limit 1)
    ),
    f.category,
    b.name,
    fn.energy_kcal, fn.protein_g, fn.carbs_g, fn.fat_g,
    (f.owner_id is not null)
  from public.favorite_foods ff
  join catalog.foods f on f.id = ff.food_id
  left join catalog.brands b on b.id = f.brand_id
  left join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
  where ff.user_id = (select auth.uid()) and f.deleted_at is null
  order by ff.created_at desc
$$;

comment on function public.list_favorite_foods is
  'Kullanıcının favori besinleri, search_foods ile aynı şekilde döner. SECURITY INVOKER + RLS: yalnız çağıranın kendi favorileri ve görebildiği besinler.';

-- GÜVENLİK NOTU: bkz. water_logs.sql/recipe_functions.sql'deki aynı
-- başlıklı not — bu projede `anon`'un kendi ayrı varsayılan ACL grant'i
-- var, `revoke ... from public` tek başına yetersiz.
revoke execute on function public.list_favorite_foods(text) from public;
revoke execute on function public.list_favorite_foods(text) from anon;
grant execute on function public.list_favorite_foods(text) to authenticated;
