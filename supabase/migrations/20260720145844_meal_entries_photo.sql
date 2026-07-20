-- Implements: MVP-08/MVP-10 (tasarım dili yenilemesi — Son öğün kartı gerçek fotoğrafı)
-- PRD: §10-11, §09
--
-- `meal_entries`'e opsiyonel `photo_storage_path` eklenir. Bu, AI kamera
-- akışında `ai-meal-photos` bucket'ına yüklenen fotoğrafın kalıcı
-- referansıdır (manuel öğünlerde her zaman null kalır).
--
-- Bu migration, `14-open-decisions.md`'deki önceki kararı ("varsayılan HER
-- ZAMAN analiz sonrası silme") tersine çeviren bir davranış değişikliğinin
-- BİR PARÇASI — asıl silme mantığı `analyze-meal-photo` edge function'ında
-- ayrıca güncellenir (bkz. karar kaydı). Kullanıcı taslağı kaydetmez/vazgeçmezse
-- fotoğraf bucket'ta öksüz kalabilir — bilinçli, dokümante edilmiş bir sınır.
--
-- `log_meal()` imzası ADDITIVE genişler (log_meal_recipes.sql'deki desenle
-- aynı): yeni parametre `default null`, mevcut çağıranlar bozulmaz.

alter table public.meal_entries add column photo_storage_path text null;

-- Yeni parametre eklemek `create or replace function`'ı bir OVERLOAD olarak
-- yaratır (Postgres imza eşleşmesini TÜM parametre listesine göre yapar,
-- opsiyonel/default olsalar da) — eski 6 parametreli sürüm önce düşürülmeli,
-- aksi hâlde 4 pozisyonel argümanla çağrı "is not unique" hatası verir
-- (bu ortamda gerçekten yaşandı, canlı şemada düzeltildi).
drop function if exists public.log_meal(uuid, text, timestamptz, jsonb, text, text);

create or replace function public.log_meal(
  p_operation_id uuid,
  p_meal_type text,
  p_logged_at timestamptz,
  p_items jsonb,
  p_custom_label text default null,
  p_notes text default null,
  p_photo_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_meal_id uuid;
  v_item jsonb;
  v_item_kind text;
  v_item_id uuid;
  v_food_id uuid;
  v_version_id uuid;
  v_grams numeric;
  v_recipe_id uuid;
  v_recipe_version_id uuid;
  v_recipe_base_servings integer;
  v_recipe_servings numeric;
  v_recipe_item record;
  v_ri_energy numeric;
  v_ri_protein numeric;
  v_ri_carbs numeric;
  v_ri_fat numeric;
  v_ri_sugar numeric;
  v_ri_sugar_complete boolean;
  v_ri_sat_fat numeric;
  v_ri_sat_fat_complete boolean;
  v_ri_fiber numeric;
  v_ri_fiber_complete boolean;
  v_ri_sodium numeric;
  v_ri_sodium_complete boolean;
  v_recipe_item_count integer;
  v_recipe_resolved_count integer;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select id into v_meal_id
  from public.meal_entries
  where operation_id = p_operation_id and user_id = v_user_id;

  if v_meal_id is not null then
    return v_meal_id;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'En az bir öğün kalemi gerekli' using errcode = '22023';
  end if;

  if p_meal_type not in
    ('breakfast', 'snack', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'night', 'custom')
  then
    raise exception 'Geçersiz öğün türü: %', p_meal_type using errcode = '22023';
  end if;

  insert into public.meal_entries (
    user_id, operation_id, meal_type, custom_label, logged_at, notes, photo_storage_path
  )
  values (v_user_id, p_operation_id, p_meal_type, p_custom_label, p_logged_at, p_notes, p_photo_storage_path)
  returning id into v_meal_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_kind := coalesce(v_item ->> 'kind', 'food');

    if v_item_kind = 'food' then
      v_food_id := (v_item ->> 'foodId')::uuid;
      v_grams := (v_item ->> 'quantityGrams')::numeric;

      if v_grams is null or v_grams <= 0 then
        raise exception 'Geçersiz miktar: %', v_grams using errcode = '22023';
      end if;

      select current_version_id into v_version_id
      from catalog.foods
      where id = v_food_id
        and (owner_id is null or owner_id = v_user_id);

      if v_version_id is null then
        raise exception 'Besin bulunamadı veya erişilemiyor: %', v_food_id using errcode = '22023';
      end if;

      insert into public.meal_entry_items (meal_entry_id, food_id, food_version_id, quantity_grams, portion_label)
      values (v_meal_id, v_food_id, v_version_id, v_grams, v_item ->> 'portionLabel')
      returning id into v_item_id;

      insert into public.meal_entry_snapshots (
        meal_entry_item_id, food_version_id,
        energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg,
        micronutrients
      )
      select
        v_item_id, v_version_id,
        fn.energy_kcal * v_grams / 100,
        fn.protein_g * v_grams / 100,
        fn.carbs_g * v_grams / 100,
        fn.sugar_g * v_grams / 100,
        fn.fat_g * v_grams / 100,
        fn.saturated_fat_g * v_grams / 100,
        fn.fiber_g * v_grams / 100,
        fn.sodium_mg * v_grams / 100,
        fn.micronutrients
      from catalog.food_nutrients fn
      where fn.food_version_id = v_version_id;

    elsif v_item_kind = 'recipe' then
      v_recipe_id := (v_item ->> 'recipeId')::uuid;
      v_recipe_servings := (v_item ->> 'servings')::numeric;

      if v_recipe_servings is null or v_recipe_servings <= 0 then
        raise exception 'Geçersiz porsiyon: %', v_recipe_servings using errcode = '22023';
      end if;

      select r.current_version_id, rv.servings into v_recipe_version_id, v_recipe_base_servings
      from public.recipes r
      join public.recipe_versions rv on rv.id = r.current_version_id
      where r.id = v_recipe_id and r.user_id = v_user_id and r.deleted_at is null;

      if v_recipe_version_id is null then
        raise exception 'Tarif bulunamadı veya erişilemiyor: %', v_recipe_id using errcode = '22023';
      end if;

      select count(*) into v_recipe_item_count
      from public.recipe_items where recipe_version_id = v_recipe_version_id;

      v_ri_energy := 0; v_ri_protein := 0; v_ri_carbs := 0; v_ri_fat := 0;
      v_ri_sugar := 0; v_ri_sugar_complete := true;
      v_ri_sat_fat := 0; v_ri_sat_fat_complete := true;
      v_ri_fiber := 0; v_ri_fiber_complete := true;
      v_ri_sodium := 0; v_ri_sodium_complete := true;
      v_recipe_resolved_count := 0;

      for v_recipe_item in
        select fn.energy_kcal, fn.protein_g, fn.carbs_g, fn.sugar_g, fn.fat_g,
               fn.saturated_fat_g, fn.fiber_g, fn.sodium_mg, ri.quantity_grams
        from public.recipe_items ri
        join catalog.foods f on f.id = ri.food_id
        join catalog.food_nutrients fn on fn.food_version_id = f.current_version_id
        where ri.recipe_version_id = v_recipe_version_id
      loop
        v_recipe_resolved_count := v_recipe_resolved_count + 1;
        v_ri_energy := v_ri_energy + v_recipe_item.energy_kcal * v_recipe_item.quantity_grams / 100;
        v_ri_protein := v_ri_protein + v_recipe_item.protein_g * v_recipe_item.quantity_grams / 100;
        v_ri_carbs := v_ri_carbs + v_recipe_item.carbs_g * v_recipe_item.quantity_grams / 100;
        v_ri_fat := v_ri_fat + v_recipe_item.fat_g * v_recipe_item.quantity_grams / 100;

        if v_recipe_item.sugar_g is null then
          v_ri_sugar_complete := false;
        else
          v_ri_sugar := v_ri_sugar + v_recipe_item.sugar_g * v_recipe_item.quantity_grams / 100;
        end if;

        if v_recipe_item.saturated_fat_g is null then
          v_ri_sat_fat_complete := false;
        else
          v_ri_sat_fat := v_ri_sat_fat + v_recipe_item.saturated_fat_g * v_recipe_item.quantity_grams / 100;
        end if;

        if v_recipe_item.fiber_g is null then
          v_ri_fiber_complete := false;
        else
          v_ri_fiber := v_ri_fiber + v_recipe_item.fiber_g * v_recipe_item.quantity_grams / 100;
        end if;

        if v_recipe_item.sodium_mg is null then
          v_ri_sodium_complete := false;
        else
          v_ri_sodium := v_ri_sodium + v_recipe_item.sodium_mg * v_recipe_item.quantity_grams / 100;
        end if;
      end loop;

      if v_recipe_resolved_count <> v_recipe_item_count then
        raise exception 'Tarif malzemeleri eksik çözüldü: %/%', v_recipe_resolved_count, v_recipe_item_count
          using errcode = '22023';
      end if;

      insert into public.meal_entry_items (meal_entry_id, recipe_id, recipe_version_id, recipe_servings)
      values (v_meal_id, v_recipe_id, v_recipe_version_id, v_recipe_servings)
      returning id into v_item_id;

      insert into public.meal_entry_snapshots (
        meal_entry_item_id, food_version_id,
        energy_kcal, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg,
        micronutrients
      )
      values (
        v_item_id, null,
        v_ri_energy / v_recipe_base_servings * v_recipe_servings,
        v_ri_protein / v_recipe_base_servings * v_recipe_servings,
        v_ri_carbs / v_recipe_base_servings * v_recipe_servings,
        case when v_ri_sugar_complete then v_ri_sugar / v_recipe_base_servings * v_recipe_servings else null end,
        v_ri_fat / v_recipe_base_servings * v_recipe_servings,
        case when v_ri_sat_fat_complete then v_ri_sat_fat / v_recipe_base_servings * v_recipe_servings else null end,
        case when v_ri_fiber_complete then v_ri_fiber / v_recipe_base_servings * v_recipe_servings else null end,
        case when v_ri_sodium_complete then v_ri_sodium / v_recipe_base_servings * v_recipe_servings else null end,
        '{}'::jsonb
      );

    else
      raise exception 'Geçersiz kalem türü: %', v_item_kind using errcode = '22023';
    end if;
  end loop;

  return v_meal_id;
end;
$$;

-- GÜVENLİK NOTU (bkz. water_logs.sql/body_measurements.sql'deki aynı
-- başlık): yeni parametreli imza yeni bir fonksiyon nesnesi yaratır, önceki
-- revoke'lar bu imzaya TAŞINMAZ — anon tekrar EXECUTE alabilir (bu ortamda
-- pgTAP ile ampirik olarak yakalandı). Her yeni imza AÇIKÇA tekrar revoke
-- edilmelidir.
revoke execute on function public.log_meal(uuid, text, timestamptz, jsonb, text, text, text) from public;
revoke execute on function public.log_meal(uuid, text, timestamptz, jsonb, text, text, text) from anon;
grant execute on function public.log_meal(uuid, text, timestamptz, jsonb, text, text, text) to authenticated;
