-- Implements: MVP-05
-- PRD: §14, §09
--
-- Öğün kaydının TEK yazma yolu. §09: "Öğün + kalem/snapshot ... atomiktir.
-- Client'ın birden çok bağımsız write yapmasına bırakılmaz."
--
-- SECURITY DEFINER GEREKÇESİ (§09: "yalnız zorunluysa ... kullanılır"):
-- Atomiklik şartı, istemciye meal_entries/items/snapshots üzerinde doğrudan
-- INSERT izni verilmesiyle BİRLİKTE var olamaz — client'a izin verilirse
-- "yalnız log_meal() üzerinden yazılır" bir kural değil bir temenni olur.
-- Bu yüzden istemciye o üç tabloda INSERT verilmez (bkz. meal_entries.sql);
-- tek yazma yolu, fonksiyon sahibinin izniyle çalışan bu DEFINER fonksiyon.
-- Açık auth kontrolü: fonksiyon `auth.uid()`'i doğrudan kullanır, çağıranın
-- iddia ettiği bir user_id parametresi YOKTUR — sahte kullanıcı adına
-- yazma imkânsızdır. EXECUTE yalnız authenticated'a verilir (aşağıda).

create or replace function public.log_meal(
  p_operation_id uuid,
  p_meal_type text,
  p_logged_at timestamptz,
  p_items jsonb,
  p_custom_label text default null,
  p_notes text default null
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
  v_item_id uuid;
  v_food_id uuid;
  v_version_id uuid;
  v_grams numeric;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  -- §03 "tekrar gönderim çift öğün üretmez": aynı operation_id daha önce
  -- işlendiyse, yeni satır YARATMADAN mevcut kaydı döner. Bu satır
  -- SADECE çağıranın kendi kaydına bakar (user_id filtresi) — başka
  -- kullanıcının operation_id'siyle çakışma bilgi sızdırmaz.
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

  insert into public.meal_entries (user_id, operation_id, meal_type, custom_label, logged_at, notes)
  values (v_user_id, p_operation_id, p_meal_type, p_custom_label, p_logged_at, p_notes)
  returning id into v_meal_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_food_id := (v_item ->> 'foodId')::uuid;
    v_grams := (v_item ->> 'quantityGrams')::numeric;

    if v_grams is null or v_grams <= 0 then
      raise exception 'Geçersiz miktar: %', v_grams using errcode = '22023';
    end if;

    -- GÜVENLİK DÜZELTMESİ (ampirik olarak bulundu, bkz. commit notu):
    -- Bu yorum ÖNCE "RLS zaten koruyor" diyordu — YANLIŞTI. Fonksiyon
    -- SECURITY DEFINER olduğu için fonksiyon SAHİBİNİN yetkileriyle
    -- çalışır ve o rol RLS'i bypass eder (force row level security bile
    -- superuser/bypassrls yetkili sahibi etkilemez). Gerçek testte Ayşe,
    -- Burak'ın özel besinini kullanarak öğün kaydedebildi — §03 "Özel
    -- besin/tarif başka kullanıcı tarafından okunamaz" kriterini ihlal
    -- ediyordu. §09'un istediği "açık auth kontrolü" tam olarak bu satır:
    -- görünürlük RLS'e bırakılmaz, WHERE koşuluna yazılır.
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

    -- Değerler 100g başınadan v_grams'a ÇÖZÜLEREK dondurulur. Bu tek
    -- satırlık oran hesabı, nutrition-engine'deki nutrientsForGrams ile
    -- AYNI formüldür (value * grams / 100); istemci tarafı önizleme için
    -- TS motorunu kullanır, ama kalıcı kaydın kaynağı burasıdır — snapshot
    -- client'ın hesabına değil, sunucudaki versiyonlu katalog değerine
    -- dayanır. NULL alanlar (§03 "eksik nutrient sessizce sıfırlanmaz")
    -- çarpımda NULL kalır, 0 olmaz.
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
  end loop;

  return v_meal_id;
end;
$$;

comment on function public.log_meal is
  'Öğün + kalem + snapshot atomik yazma yolu. Tek yazma yolu budur (§09) — istemciye tablolarda doğrudan INSERT verilmez.';

-- GÜVENLİK NOTU: bkz. food_search_functions.sql üstündeki aynı başlıklı not
-- — `revoke ... from anon` tek başına yetersizdi, PUBLIC'ten de alınması
-- gerekiyordu. Burada özellikle önemli çünkü bu fonksiyon SECURITY
-- DEFINER: anon'un çağırabilmesi, RLS/GRANT'i atlayan bir yazma yolu
-- açardı (fiilen auth.uid() null kontrolü tarafından engellendi ama buna
-- güvenilemez).
revoke execute on function public.log_meal(uuid, text, timestamptz, jsonb, text, text) from public;
grant execute on function public.log_meal(uuid, text, timestamptz, jsonb, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Günlük özet: bir günün tüm öğün toplamlarını tek sorguda döner.
--
-- GÜVENLİK/DOĞRULUK NOTU (ampirik olarak bulundu): ilk hâli yalın SUM()
-- kullanıyordu ve YANLIŞTI. Postgres'in SUM()'ı NULL'ları YOK SAYAR ve
-- kalanları toplar — yani bir kalemde fiber_g NULL, diğerinde 0 ise
-- SUM = 0 döner: TAM bir toplam gibi görünen ama aslında EKSİK bir sayı.
-- Bu tam olarak §03'ün yasakladığı şey: "Eksik nutrient değerini sıfırmış
-- gibi sessizce sunmaz." nutrition-engine'deki sumNutrients() "hepsi
-- doluysa topla, biri eksikse alan tanımsız kalır" kuralını uygular;
-- burası da AYNI semantiği taşımalı — count(*) = count(alan) kontrolü
-- bunu sağlar: yalnız o alanı taşıyan satır sayısı TOPLAM satır sayısına
-- eşitse toplanır, aksi hâlde NULL döner.
-- ---------------------------------------------------------------------------
create or replace function public.daily_nutrition_summary(target_date date)
returns table (
  meal_count integer,
  total_energy_kcal numeric,
  total_protein_g numeric,
  total_carbs_g numeric,
  total_fat_g numeric,
  total_fiber_g numeric,
  total_sodium_mg numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(distinct m.id)::integer,
    -- Zorunlu alanlar (§03: catalog.food_nutrients'ta NOT NULL) her
    -- zaman tam toplanır.
    sum(s.energy_kcal),
    sum(s.protein_g),
    sum(s.carbs_g),
    sum(s.fat_g),
    -- Opsiyonel alanlar: yalnız TÜM kalemler değer taşıyorsa toplanır.
    case when count(*) = count(s.fiber_g) then sum(s.fiber_g) else null end,
    case when count(*) = count(s.sodium_mg) then sum(s.sodium_mg) else null end
  from public.meal_entries m
  join public.meal_entry_items i on i.meal_entry_id = m.id
  join public.meal_entry_snapshots s on s.meal_entry_item_id = i.id
  where m.user_id = (select auth.uid())
    and m.deleted_at is null
    and m.logged_at::date = target_date
$$;

comment on function public.daily_nutrition_summary is
  'Bir günün öğün toplamları. SECURITY INVOKER + RLS: yalnız çağıranın kendi verisi.';

revoke execute on function public.daily_nutrition_summary(date) from public;
grant execute on function public.daily_nutrition_summary(date) to authenticated;
