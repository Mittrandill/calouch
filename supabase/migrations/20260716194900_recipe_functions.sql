-- Implements: MVP-06
-- PRD: §14, §09
--
-- Tarif kaydının/düzenlemesinin TEK yazma yolu. §09 atomiklik ilkesi
-- meal_entries/log_meal ile aynı gerekçeyle burada da geçerli: recipe +
-- recipe_version + recipe_items çoklu-tablo yazması client'a bırakılmaz.
--
-- SECURITY DEFINER GEREKÇESİ VE GÜVENLİK KONTROLÜ: log_meal()'de ampirik
-- olarak bulunan hatadan (bkz. meal_entries.sql / log_meal_function.sql)
-- öğrenilen ders burada BAŞTAN uygulanır: SECURITY DEFINER fonksiyon RLS'i
-- bypass eder, bu yüzden catalog.foods sorgusuna açık owner_id kontrolü
-- (aşağıda) konur — "RLS zaten korur" varsayımına güvenilmez.

create or replace function public.save_recipe(
  p_operation_id uuid,
  p_name text,
  p_servings integer,
  p_items jsonb,
  p_recipe_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_recipe_id uuid;
  v_version_id uuid;
  v_version_number integer;
  v_item jsonb;
  v_food_id uuid;
  v_grams numeric;
  v_food_owned boolean;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  -- §03 "tekrar gönderim çift kayıt üretmez": aynı operation_id daha önce
  -- işlendiyse (ilk oluşturma VEYA bir düzenleme), yeni sürüm YARATMADAN
  -- o sürümün tarifini döner. Yalnız çağıranın kendi tarifine bakar.
  select r.id into v_recipe_id
  from public.recipe_versions rv
  join public.recipes r on r.id = rv.recipe_id
  where rv.operation_id = p_operation_id and r.user_id = v_user_id;

  if v_recipe_id is not null then
    return v_recipe_id;
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Tarif adı gerekli' using errcode = '22023';
  end if;

  if p_servings is null or p_servings <= 0 then
    raise exception 'Geçersiz porsiyon sayısı: %', p_servings using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'En az bir malzeme gerekli' using errcode = '22023';
  end if;

  if p_recipe_id is null then
    insert into public.recipes (user_id, name) values (v_user_id, p_name)
    returning id into v_recipe_id;
    v_version_number := 1;
  else
    select id into v_recipe_id
    from public.recipes
    where id = p_recipe_id and user_id = v_user_id and deleted_at is null;

    if v_recipe_id is null then
      raise exception 'Tarif bulunamadı veya erişilemiyor: %', p_recipe_id using errcode = '22023';
    end if;

    update public.recipes set name = p_name, updated_at = now() where id = v_recipe_id;

    select coalesce(max(version_number), 0) + 1 into v_version_number
    from public.recipe_versions where recipe_id = v_recipe_id;
  end if;

  insert into public.recipe_versions (recipe_id, version_number, servings, operation_id)
  values (v_recipe_id, v_version_number, p_servings, p_operation_id)
  returning id into v_version_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_food_id := (v_item ->> 'foodId')::uuid;
    v_grams := (v_item ->> 'quantityGrams')::numeric;

    if v_grams is null or v_grams <= 0 then
      raise exception 'Geçersiz miktar: %', v_grams using errcode = '22023';
    end if;

    -- bkz. log_meal_function.sql "GÜVENLİK DÜZELTMESİ" notu — aynı
    -- açık owner_id kontrolü burada baştan uygulanır.
    select exists(
      select 1 from catalog.foods
      where id = v_food_id and (owner_id is null or owner_id = v_user_id)
    ) into v_food_owned;

    if not v_food_owned then
      raise exception 'Besin bulunamadı veya erişilemiyor: %', v_food_id using errcode = '22023';
    end if;

    insert into public.recipe_items (recipe_version_id, food_id, quantity_grams)
    values (v_version_id, v_food_id, v_grams);
  end loop;

  update public.recipes set current_version_id = v_version_id, updated_at = now()
  where id = v_recipe_id;

  return v_recipe_id;
end;
$$;

comment on function public.save_recipe is
  'Tarif oluşturma/düzenleme tek yazma yolu (§09 atomiklik). p_recipe_id null ise yeni tarif, doluysa var olan (sahip olunan) tarife yeni sürüm ekler.';

-- GÜVENLİK NOTU (ampirik olarak bulundu, has_function_privilege ile
-- doğrulandı — bkz. water_logs.sql'deki aynı başlıklı not): bu projede
-- `public` şemasında `postgres` rolünün fonksiyonlar için varsayılan
-- ACL'i `anon`'u AYRI ve DOĞRUDAN içeriyor; `revoke ... from public`
-- tek başına yetersiz, `anon`'dan da açıkça revoke edilmeli.
revoke execute on function public.save_recipe(uuid, text, integer, jsonb, uuid) from public;
revoke execute on function public.save_recipe(uuid, text, integer, jsonb, uuid) from anon;
grant execute on function public.save_recipe(uuid, text, integer, jsonb, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tarif detayı: güncel sürümün malzemeleri + porsiyon başı hesaplanmış
-- besin değeri. nutrition-engine'deki nutrientsForRecipe ile AYNI formül
-- (malzeme toplamı / porsiyon sayısı) — istemci önizleme için TS motorunu
-- kullanabilir, ama bu RPC sunucu tarafı tek doğru kaynaktır.
-- ---------------------------------------------------------------------------
create or replace function public.recipe_detail(target_recipe_id uuid)
returns table (
  recipe_id uuid,
  name text,
  servings integer,
  version_number integer,
  items jsonb,
  per_serving_energy_kcal numeric,
  per_serving_protein_g numeric,
  per_serving_carbs_g numeric,
  per_serving_fat_g numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with current_version as (
    select rv.id, rv.recipe_id, rv.servings, rv.version_number, r.name
    from public.recipes r
    join public.recipe_versions rv on rv.id = r.current_version_id
    where r.id = target_recipe_id and r.user_id = (select auth.uid()) and r.deleted_at is null
  ),
  resolved_items as (
    select
      ri.id, ri.food_id, ri.quantity_grams,
      fd.matched_name,
      fn.energy_kcal * ri.quantity_grams / 100 as energy_kcal,
      fn.protein_g * ri.quantity_grams / 100 as protein_g,
      fn.carbs_g * ri.quantity_grams / 100 as carbs_g,
      fn.fat_g * ri.quantity_grams / 100 as fat_g
    from current_version cv
    join public.recipe_items ri on ri.recipe_version_id = cv.id
    join catalog.foods f on f.id = ri.food_id
    join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
    join lateral (
      select coalesce(
        (select ft.name from catalog.food_translations ft
         where ft.food_id = f.id and ft.locale = 'tr' limit 1),
        (select ft.name from catalog.food_translations ft
         where ft.food_id = f.id limit 1)
      ) as matched_name
    ) fd on true
  )
  select
    cv.recipe_id,
    cv.name,
    cv.servings,
    cv.version_number,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
        'id', ri.id, 'foodId', ri.food_id, 'name', ri.matched_name, 'quantityGrams', ri.quantity_grams
      )) from resolved_items ri),
      '[]'::jsonb
    ),
    (select sum(energy_kcal) from resolved_items) / cv.servings,
    (select sum(protein_g) from resolved_items) / cv.servings,
    (select sum(carbs_g) from resolved_items) / cv.servings,
    (select sum(fat_g) from resolved_items) / cv.servings
  from current_version cv
$$;

comment on function public.recipe_detail is
  'Tarif detayı + porsiyon başı hesaplanmış değer. SECURITY INVOKER + RLS: yalnız çağıranın kendi tarifi.';

revoke execute on function public.recipe_detail(uuid) from public;
revoke execute on function public.recipe_detail(uuid) from anon;
grant execute on function public.recipe_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Kullanıcının tarif listesi (özet — malzeme detayı olmadan).
-- ---------------------------------------------------------------------------
create or replace function public.list_recipes()
returns table (
  recipe_id uuid,
  name text,
  servings integer,
  per_serving_energy_kcal numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.id,
    r.name,
    rv.servings,
    (
      select sum(fn.energy_kcal * ri.quantity_grams / 100)
      from public.recipe_items ri
      join catalog.foods f on f.id = ri.food_id
      join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
      where ri.recipe_version_id = rv.id
    ) / rv.servings
  from public.recipes r
  join public.recipe_versions rv on rv.id = r.current_version_id
  where r.user_id = (select auth.uid()) and r.deleted_at is null
  order by r.updated_at desc
$$;

comment on function public.list_recipes is
  'Kullanıcının tariflerinin özeti. SECURITY INVOKER + RLS: yalnız çağıranın kendi tarifleri.';

revoke execute on function public.list_recipes() from public;
revoke execute on function public.list_recipes() from anon;
grant execute on function public.list_recipes() to authenticated;
