-- Implements: MVP-03
-- PRD: §12-13 (03-nutrition-core.md) kabul kriteri "Arama Türkçe/İngilizce
-- ad ve alias ile sonuç verir."
--
-- İstemcinin `catalog` şemasına erişmesinin TEK yolu. §09: "View'lar
-- security_invoker veya kapalı şema ile RLS sınırını korur." SECURITY
-- INVOKER: fonksiyon çağıranın izniyle çalışır, RLS'i atlamaz — bir
-- kullanıcı arama yapınca yalnız kendi görebileceği besinler (global +
-- kendi özel besinleri) sonuçta çıkar.

create or replace function public.search_foods(
  query text,
  only_locale text default null,
  limit_count integer default 20
)
returns table (
  food_id uuid,
  matched_name text,
  matched_locale text,
  match_score real,
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
  with matches as (
    select
      ft.food_id,
      ft.name as matched_name,
      ft.locale as matched_locale,
      extensions.similarity(
        catalog.immutable_unaccent(lower(ft.name)),
        catalog.immutable_unaccent(lower(query))
      ) as score
    from catalog.food_translations ft
    where (only_locale is null or ft.locale = only_locale)
      and (
        catalog.immutable_unaccent(lower(ft.name))
          ilike '%' || catalog.immutable_unaccent(lower(query)) || '%'
        or catalog.immutable_unaccent(lower(ft.name))
          operator(extensions.%) catalog.immutable_unaccent(lower(query))
      )

    union all

    select
      fa.food_id,
      fa.alias as matched_name,
      fa.locale as matched_locale,
      extensions.similarity(
        catalog.immutable_unaccent(lower(fa.alias)),
        catalog.immutable_unaccent(lower(query))
      ) as score
    from catalog.food_aliases fa
    where (only_locale is null or fa.locale = only_locale)
      and (
        catalog.immutable_unaccent(lower(fa.alias))
          ilike '%' || catalog.immutable_unaccent(lower(query)) || '%'
        or catalog.immutable_unaccent(lower(fa.alias))
          operator(extensions.%) catalog.immutable_unaccent(lower(query))
      )
  ),
  -- Bir besin hem isim hem alias'tan eşleşebilir; en iyi eşleşmeyi tut.
  best_per_food as (
    select distinct on (food_id) food_id, matched_name, matched_locale, score
    from matches
    order by food_id, score desc
  )
  select
    f.id,
    bm.matched_name,
    bm.matched_locale,
    bm.score,
    f.category,
    b.name,
    fn.energy_kcal,
    fn.protein_g,
    fn.carbs_g,
    fn.fat_g,
    (f.owner_id is not null)
  from best_per_food bm
  join catalog.foods f on f.id = bm.food_id
  left join catalog.brands b on b.id = f.brand_id
  left join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
  where f.deleted_at is null
  order by bm.score desc, bm.matched_name
  limit limit_count
$$;

comment on function public.search_foods is
  'Katalogda ve kullanıcının kendi özel besinlerinde TR/EN ad+alias araması. RLS çağıranın izniyle uygulanır (security invoker).';

-- ---------------------------------------------------------------------------
-- Tek besinin tam detayı: manuel öğün ekranı bunu çağırır.
-- ---------------------------------------------------------------------------
create or replace function public.food_detail(target_food_id uuid)
returns table (
  food_id uuid,
  category text,
  country_code text,
  brand_name text,
  is_custom boolean,
  name_tr text,
  name_en text,
  energy_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  sugar_g numeric,
  fat_g numeric,
  saturated_fat_g numeric,
  fiber_g numeric,
  sodium_mg numeric,
  micronutrients jsonb,
  portions jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    f.id,
    f.category,
    f.country_code,
    b.name,
    (f.owner_id is not null),
    (select ft.name from catalog.food_translations ft
     where ft.food_id = f.id and ft.locale = 'tr'),
    (select ft.name from catalog.food_translations ft
     where ft.food_id = f.id and ft.locale = 'en'),
    fn.energy_kcal, fn.protein_g, fn.carbs_g, fn.sugar_g, fn.fat_g,
    fn.saturated_fat_g, fn.fiber_g, fn.sodium_mg, fn.micronutrients,
    coalesce(
      (select jsonb_agg(
                jsonb_build_object('label', fp.label, 'grams', fp.grams, 'isDefault', fp.is_default)
                order by fp.is_default desc, fp.label
              )
       from catalog.food_portions fp
       where fp.food_id = f.id),
      '[]'::jsonb
    )
  from catalog.foods f
  left join catalog.brands b on b.id = f.brand_id
  left join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
  where f.id = target_food_id and f.deleted_at is null
$$;

comment on function public.food_detail is
  'Bir besinin tam detayı (çeviriler, nutrient, porsiyonlar). RLS çağıranın izniyle uygulanır.';

-- GÜVENLİK NOTU: Postgres yeni fonksiyonlara varsayılan olarak EXECUTE'u
-- PUBLIC'e (yani örtük olarak anon dahil HERKESE) açar. Yalnız
-- `revoke ... from anon` YETERSİZDİR — anon rolü PUBLIC'in bir üyesidir ve
-- PUBLIC grant'i durduğu sürece execute hakkı kalır. Bu, `has_function_
-- privilege('anon', ..., 'execute')` ile ampirik olarak doğrulanıp
-- düzeltildi (bkz. 20260717030000_revoke_public_execute_defaults.sql).
-- Önce PUBLIC'ten alınır, sonra yalnız authenticated'a verilir.
revoke execute on function public.search_foods(text, text, integer) from public;
revoke execute on function public.food_detail(uuid) from public;

grant execute on function public.search_foods(text, text, integer) to authenticated;
grant execute on function public.food_detail(uuid) to authenticated;
