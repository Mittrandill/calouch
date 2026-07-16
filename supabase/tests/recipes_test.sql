-- Implements: MVP-06
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- save_recipe() ve log_meal()'in tarif dalı için kapsam: atomiklik,
-- idempotency, sürümleme (düzenleme yeni versiyon), snapshot
-- değişmezliği, çapraz kullanıcı izolasyonu (hem tarif hem tarifte
-- kullanılan özel besin), eksik opsiyonel nutrient'in NULL kalması
-- (daily_nutrition_summary'deki aynı sınıf hatanın tarif toplamasında
-- tekrarlanmadığının kanıtı) ve anon reddi.

begin;
select plan(31);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('aa111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_recipe@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('aa222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_recipe@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Kurulum: Burak'ın özel besini (izolasyon testi için)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aa222222-2222-2222-2222-222222222222","role":"authenticated"}';

insert into catalog.foods (id, owner_id, category) values
  ('d9000000-0000-0000-0000-000000000001', 'aa222222-2222-2222-2222-222222222222', 'custom');
insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status) values
  ('d9000000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000001', 1,
   (select id from catalog.food_sources where key = 'user_custom'), 'unverified');
update catalog.foods set current_version_id = 'd9000000-0000-0000-0000-000000000002'
  where id = 'd9000000-0000-0000-0000-000000000001';
insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g) values
  ('d9000000-0000-0000-0000-000000000002', 500, 10, 50, 20);

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış — tavuk (001, sugar_g YOK) + pirinç (002, sugar_g VAR)
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aa111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
declare v_recipe_id uuid;
begin
  v_recipe_id := public.save_recipe(
    'bb000000-0000-0000-0000-000000000001'::uuid, 'Tavuklu pilav', 2,
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":100},
      {"foodId":"10000000-0000-0000-0000-000000000002","quantityGrams":100}]'::jsonb
  );
  perform set_config('test.recipe_id', v_recipe_id::text, true);
end $$;

select ok(current_setting('test.recipe_id', true) is not null, 'POZİTİF: save_recipe bir recipe_id döner');
select is(
  (select count(*)::int from public.recipes where id = current_setting('test.recipe_id')::uuid),
  1, 'recipes tek satır'
);
select is(
  (select version_number from public.recipe_versions
   where recipe_id = current_setting('test.recipe_id')::uuid),
  1, 'ilk sürüm numarası 1'
);
select is(
  (select count(*)::int from public.recipe_items ri
   join public.recipe_versions rv on rv.id = ri.recipe_version_id
   where rv.recipe_id = current_setting('test.recipe_id')::uuid),
  2, 'iki malzeme oluşturuldu'
);

-- ---------------------------------------------------------------------------
-- İDEMPOTENCY
-- ---------------------------------------------------------------------------
do $$
declare v_recipe_id2 uuid;
begin
  -- Aynı operation_id, FARKLI (yanlış) isim — yine de eski kayıt döner.
  v_recipe_id2 := public.save_recipe(
    'bb000000-0000-0000-0000-000000000001'::uuid, 'YANLIŞ AD', 99, '[]'::jsonb
  );
  perform set_config('test.recipe_id2', v_recipe_id2::text, true);
end $$;

select is(
  current_setting('test.recipe_id2'), current_setting('test.recipe_id'),
  'İDEMPOTENCY: aynı operation_id aynı recipe_id döner'
);
select is(
  (select count(*)::int from public.recipe_versions
   where recipe_id = current_setting('test.recipe_id')::uuid),
  1, 'İDEMPOTENCY: hâlâ tek sürüm var (99 porsiyon ile tekrar YAZILMADI)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: client'ın atomiklik dışı doğrudan yazması
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.recipes (user_id, name) values (auth.uid(), 'x') $$,
  '42501', null, 'NEGATİF: client recipes içine doğrudan INSERT yapamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkasının özel besiniyle tarif — log_meal'deki aynı düzeltme
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select public.save_recipe('cc000000-0000-0000-0000-000000000001'::uuid, 'Çalıntı', 1,
       '[{"foodId":"d9000000-0000-0000-0000-000000000001","quantityGrams":100}]'::jsonb) $$,
  '22023', null, 'NEGATİF: başkasının özel besiniyle tarif oluşturulamaz'
);
select is(
  (select count(*)::int from public.recipe_versions where operation_id = 'cc000000-0000-0000-0000-000000000001'),
  0, 'başarısız çağrı recipe_versions satırı BIRAKMADI (atomiklik)'
);

-- ---------------------------------------------------------------------------
-- list_recipes / recipe_detail — porsiyon başı doğru hesap
-- (100g tavuk + 100g pirinç) / 2 porsiyon = 147.5 kcal/porsiyon
-- ---------------------------------------------------------------------------
select is(
  (select per_serving_energy_kcal from public.list_recipes()
   where recipe_id = current_setting('test.recipe_id')::uuid),
  147.5, 'list_recipes: porsiyon başı kalori doğru'
);
select is(
  (select per_serving_protein_g from public.recipe_detail(current_setting('test.recipe_id')::uuid)),
  16.85, 'recipe_detail: porsiyon başı protein doğru'
);
select is(
  (select per_serving_carbs_g from public.recipe_detail(current_setting('test.recipe_id')::uuid)),
  14, 'recipe_detail: porsiyon başı karbonhidrat doğru'
);

-- ---------------------------------------------------------------------------
-- log_meal: tarifi öğüne ekle (1 porsiyon)
-- ---------------------------------------------------------------------------
do $$
declare v_meal_id uuid;
begin
  v_meal_id := public.log_meal(
    'dd000000-0000-0000-0000-000000000001'::uuid, 'lunch', now(),
    ('[{"kind":"recipe","recipeId":"' || current_setting('test.recipe_id') || '","servings":1}]')::jsonb
  );
  perform set_config('test.meal_id', v_meal_id::text, true);
end $$;

select is(
  (select count(*)::int from public.meal_entry_items
   where meal_entry_id = current_setting('test.meal_id')::uuid and recipe_id is not null),
  1, 'log_meal: tarif kalemi oluşturuldu'
);
select is(
  (select recipe_version_id from public.meal_entry_items
   where meal_entry_id = current_setting('test.meal_id')::uuid),
  (select current_version_id from public.recipes where id = current_setting('test.recipe_id')::uuid),
  'log_meal: kalem GÜNCEL (v1) tarif sürümüne pinlendi'
);
select is(
  (select s.energy_kcal from public.meal_entry_snapshots s
   join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  147.5, 'log_meal: tarif snapshot kalorisi doğru (1 porsiyon)'
);
select is(
  (select s.fiber_g from public.meal_entry_snapshots s
   join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  0.2, 'log_meal: iki malzeme de fiber_g taşıyor -> doğru toplanır'
);
select is(
  (select s.sugar_g from public.meal_entry_snapshots s
   join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  null, 'DÜZELTME: tavukta sugar_g YOK -> tarif toplamı NULL kalır, pirincin 0.1''i sessizce tam toplam gibi görünmez (§03)'
);

-- ---------------------------------------------------------------------------
-- DÜZENLEME: yeni sürüm oluşturur, eski sürüm/kalemler DEĞİŞMEZ
-- ---------------------------------------------------------------------------
do $$
begin
  perform public.save_recipe(
    'bb000000-0000-0000-0000-000000000002'::uuid, 'Tavuklu pilav (yumurtalı)', 3,
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":100},
      {"foodId":"10000000-0000-0000-0000-000000000002","quantityGrams":100},
      {"foodId":"10000000-0000-0000-0000-000000000003","quantityGrams":50}]'::jsonb,
    current_setting('test.recipe_id')::uuid
  );
end $$;

select is(
  (select count(*)::int from public.recipe_versions where recipe_id = current_setting('test.recipe_id')::uuid),
  2, 'DÜZENLEME: iki sürüm var artık'
);
select is(
  (select version_number from public.recipe_versions
   where recipe_id = current_setting('test.recipe_id')::uuid and operation_id = 'bb000000-0000-0000-0000-000000000002'),
  2, 'DÜZENLEME: yeni sürüm numarası 2'
);
select is(
  (select rv.id from public.recipes r join public.recipe_versions rv on rv.id = r.current_version_id
   where r.id = current_setting('test.recipe_id')::uuid),
  (select id from public.recipe_versions
   where recipe_id = current_setting('test.recipe_id')::uuid and version_number = 2),
  'DÜZENLEME: current_version_id yeni sürüme güncellendi'
);
select is(
  (select count(*)::int from public.recipe_items ri
   join public.recipe_versions rv on rv.id = ri.recipe_version_id
   where rv.recipe_id = current_setting('test.recipe_id')::uuid and rv.version_number = 1),
  2, 'DÜZENLEME: eski sürümün (v1) malzemeleri DOKUNULMADAN duruyor'
);

-- SNAPSHOT DEĞİŞMEZLİĞİ: düzenlemeden ÖNCE kaydedilen öğün hâlâ v1'i
-- referanslar ve kalorisi hâlâ 147.5 (yeni sürümün 3 porsiyonluk hesabı
-- eski kaydı etkilemez).
select isnt(
  (select recipe_version_id from public.meal_entry_items
   where meal_entry_id = current_setting('test.meal_id')::uuid),
  (select id from public.recipe_versions
   where recipe_id = current_setting('test.recipe_id')::uuid and version_number = 2),
  'SNAPSHOT DEĞİŞMEZLİĞİ: eski öğün YENİ sürümü değil, kaydedildiği sürümü referanslar'
);
select is(
  (select s.energy_kcal from public.meal_entry_snapshots s
   join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  147.5, 'SNAPSHOT DEĞİŞMEDİ: tarif düzenlense de eski kayıt hâlâ 147.5 kcal (§03)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin tarifini düzenleyemez / göremez
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aa222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  format(
    $$ select public.save_recipe('ee000000-0000-0000-0000-000000000001'::uuid, 'Ele geçirme', 1,
         '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":100}]'::jsonb, %L::uuid) $$,
    current_setting('test.recipe_id')
  ),
  '22023', null, 'NEGATİF: Burak Ayşe''nin tarifini düzenleyemez'
);
select throws_ok(
  format(
    $$ select public.log_meal(gen_random_uuid(), 'lunch', now(),
         ('[{"kind":"recipe","recipeId":"%s","servings":1}]')::jsonb) $$,
    current_setting('test.recipe_id')
  ),
  '22023', null, 'NEGATİF: Burak Ayşe''nin tarifini öğüne ekleyemez'
);
select is(
  (select count(*)::int from public.recipes where id = current_setting('test.recipe_id')::uuid),
  0, 'NEGATİF: Burak Ayşe''nin tarifini SELECT ile de göremez'
);
select is(
  (select count(*)::int from public.recipe_versions where recipe_id = current_setting('test.recipe_id')::uuid),
  0, 'NEGATİF: Burak sürümleri de göremez'
);
select is(
  (select count(*)::int from public.recipe_items ri
   join public.recipe_versions rv on rv.id = ri.recipe_version_id
   where rv.recipe_id = current_setting('test.recipe_id')::uuid),
  0, 'NEGATİF: Burak malzemeleri de göremez'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select public.save_recipe(gen_random_uuid(), 'x', 1, '[]'::jsonb) $$,
  '42501', null, 'NEGATİF: anon save_recipe çalıştıramaz'
);
select throws_ok(
  $$ select public.list_recipes() $$,
  '42501', null, 'NEGATİF: anon list_recipes çalıştıramaz'
);
select throws_ok(
  $$ select public.recipe_detail(gen_random_uuid()) $$,
  '42501', null, 'NEGATİF: anon recipe_detail çalıştıramaz'
);
reset role;

select * from finish();
rollback;
