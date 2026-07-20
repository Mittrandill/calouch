-- Implements: MVP-05
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- Bu dosya iki gerçek üretim hatasını yakaladı ve düzeltmesini doğrular:
--
-- 1) log_meal SECURITY DEFINER olduğu için RLS'i bypass eder. İlk sürüm
--    "RLS zaten koruyor" varsayımıyla catalog.foods'u filtresiz sorguluyordu
--    ve Ayşe, Burak'ın özel besinini kullanarak öğün kaydedebiliyordu.
--    Düzeltme: WHERE koşuluna açık owner_id kontrolü eklendi.
-- 2) daily_nutrition_summary yalın SUM() kullanıyordu; Postgres'in SUM()'ı
--    NULL'ları yok sayıp kalanları topladığından, bir kalemde eksik olan
--    opsiyonel değer (ör. fiber_g) TAM bir toplam gibi görünen ama aslında
--    eksik bir sayı üretiyordu (§03 "sessizce sıfırlanmaz" ihlali).
--    Düzeltme: count(*) = count(alan) koşuluyla "hepsi doluysa topla,
--    biri eksikse NULL dön" semantiği eklendi.

begin;
select plan(23);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_meal@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_meal@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Kurulum: Burak'ın özel besini (izolasyon testi için)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

insert into catalog.foods (id, owner_id, category) values
  ('d1000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'custom');
insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status) values
  ('d1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 1,
   (select id from catalog.food_sources where key = 'user_custom'), 'unverified');
update catalog.foods set current_version_id = 'd1000000-0000-0000-0000-000000000002'
  where id = 'd1000000-0000-0000-0000-000000000001';
insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g) values
  ('d1000000-0000-0000-0000-000000000002', 500, 10, 50, 20);

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"b1111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
declare v_meal_id uuid;
begin
  -- Tavuk göğsü (150g) + beyaz pirinç (150g), seed verisiyle.
  v_meal_id := public.log_meal(
    'c0000000-0000-0000-0000-000000000001'::uuid, 'breakfast', now(),
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":150,"portionLabel":"1 porsiyon"},
      {"foodId":"10000000-0000-0000-0000-000000000002","quantityGrams":150,"portionLabel":"1 su bardağı"}]'::jsonb
  );
  perform set_config('test.meal_id', v_meal_id::text, true);
end $$;

select ok(current_setting('test.meal_id', true) is not null, 'POZİTİF: log_meal bir meal_id döner');
select is(
  (select count(*)::int from public.meal_entries where id = current_setting('test.meal_id')::uuid),
  1, 'meal_entries tek satır'
);
select is(
  (select count(*)::int from public.meal_entry_items where meal_entry_id = current_setting('test.meal_id')::uuid),
  2, 'iki kalem oluşturuldu'
);
select is(
  (select count(*)::int from public.meal_entry_snapshots s join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  2, 'iki snapshot oluşturuldu'
);
select is(
  (select s.energy_kcal from public.meal_entry_snapshots s join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid and i.food_id = '10000000-0000-0000-0000-000000000001'),
  247.5, 'snapshot kalorisi doğru hesaplandı (165 kcal/100g × 150g)'
);

-- ---------------------------------------------------------------------------
-- İDEMPOTENCY (§03 "tekrar gönderim çift öğün üretmez")
-- ---------------------------------------------------------------------------
do $$
declare v_meal_id2 uuid;
begin
  -- Aynı operation_id, FARKLI (yanlış) payload — yine de eski kayıt döner.
  v_meal_id2 := public.log_meal(
    'c0000000-0000-0000-0000-000000000001'::uuid, 'breakfast', now(),
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":999}]'::jsonb
  );
  perform set_config('test.meal_id2', v_meal_id2::text, true);
end $$;

select is(
  current_setting('test.meal_id2'), current_setting('test.meal_id'),
  'İDEMPOTENCY: aynı operation_id aynı meal_id döner'
);
select is(
  (select count(*)::int from public.meal_entries where user_id = 'b1111111-1111-1111-1111-111111111111'),
  1, 'İDEMPOTENCY: hâlâ tek meal_entries satırı var (999g ile tekrar YAZILMADI)'
);
select is(
  (select count(*)::int from public.meal_entry_items where meal_entry_id = current_setting('test.meal_id')::uuid),
  2, 'İDEMPOTENCY: hâlâ 2 kalem (999g eklenmedi)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: client'ın atomiklik dışı doğrudan yazması
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.meal_entries (user_id, operation_id, meal_type) values (auth.uid(), gen_random_uuid(), 'lunch') $$,
  '42501', null, 'NEGATİF: client meal_entries içine doğrudan INSERT yapamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkasının özel besiniyle öğün — GÜVENLİK DÜZELTMESİNİN testi
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select public.log_meal('e1000000-0000-0000-0000-000000000001'::uuid, 'lunch', now(),
       '[{"foodId":"d1000000-0000-0000-0000-000000000001","quantityGrams":100}]'::jsonb) $$,
  '22023', null, 'NEGATİF: başkasının özel besiniyle öğün kaydedilemez (log_meal DEFINER RLS bypass düzeltmesi)'
);
select is(
  (select count(*)::int from public.meal_entries where operation_id = 'e1000000-0000-0000-0000-000000000001'),
  0, 'başarısız çağrı meal_entries satırı BIRAKMADI (atomiklik)'
);

-- ---------------------------------------------------------------------------
-- SNAPSHOT DEĞİŞMEZLİĞİ — §03'ün çekirdek garantisi
-- ---------------------------------------------------------------------------
do $$
declare v_meal_id uuid;
begin
  v_meal_id := public.log_meal(
    'c0000000-0000-0000-0000-000000000002'::uuid, 'snack', now(),
    '[{"foodId":"10000000-0000-0000-0000-000000000005","quantityGrams":182}]'::jsonb -- Elma
  );
  perform set_config('test.apple_meal_id', v_meal_id::text, true);
end $$;

select is(
  (select s.energy_kcal from public.meal_entry_snapshots s join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.apple_meal_id')::uuid),
  94.64, 'kayıt anındaki elma kalorisi doğru (52 × 1.82)'
);

reset role; -- service-role gibi katalog güncellemesi
insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status) values
  ('10000000-0000-0000-0000-000000000099', '10000000-0000-0000-0000-000000000005', 2,
   (select id from catalog.food_sources where key = 'international_reference'), 'verified');
insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g, fiber_g) values
  ('10000000-0000-0000-0000-000000000099', 9999, 1, 1, 1, 1);
update catalog.foods set current_version_id = '10000000-0000-0000-0000-000000000099'
  where id = '10000000-0000-0000-0000-000000000005';

select is(
  (select energy_kcal from catalog.food_nutrients where food_version_id = '10000000-0000-0000-0000-000000000099'),
  9999::numeric, 'kontrol: katalogun GÜNCEL değeri gerçekten değişti'
);
select is(
  (select s.energy_kcal from public.meal_entry_snapshots s join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.apple_meal_id')::uuid),
  94.64, 'SNAPSHOT DEĞİŞMEDİ: katalog 9999 kcal olsa da eski kayıt hâlâ 94.64 (§03)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon log_meal çağıramaz
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select public.log_meal(gen_random_uuid(), 'lunch', now(), '[]'::jsonb) $$,
  '42501', null, 'NEGATİF: anon log_meal çalıştıramaz (PUBLIC EXECUTE revoke edildi)'
);
reset role;

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak, Ayşe'nin öğününü göremez
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.meal_entries where id = current_setting('test.meal_id')::uuid),
  0, 'NEGATİF: Burak Ayşe''nin öğününü göremez'
);
select is(
  (select count(*)::int from public.meal_entry_items where meal_entry_id = current_setting('test.meal_id')::uuid),
  0, 'NEGATİF: Burak kalemleri de göremez'
);
select is(
  (select count(*)::int from public.meal_entry_snapshots s join public.meal_entry_items i on i.id = s.meal_entry_item_id
   where i.meal_entry_id = current_setting('test.meal_id')::uuid),
  0, 'NEGATİF: Burak snapshot''ları da göremez'
);

-- ---------------------------------------------------------------------------
-- daily_nutrition_summary — eksik nutrient DOĞRULUK düzeltmesinin testi
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"b1111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into catalog.foods (id, owner_id, category) values
  ('d2000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'custom');
insert into catalog.food_versions (id, food_id, version_number, source_id, verification_status) values
  ('d2000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 1,
   (select id from catalog.food_sources where key = 'user_custom'), 'unverified');
update catalog.foods set current_version_id = 'd2000000-0000-0000-0000-000000000002'
  where id = 'd2000000-0000-0000-0000-000000000001';
-- fiber_g YOK (NULL) — tavuk göğsünün fiber_g=0'ı (dolu) ile karışacak.
insert into catalog.food_nutrients (food_version_id, energy_kcal, protein_g, carbs_g, fat_g) values
  ('d2000000-0000-0000-0000-000000000002', 200, 5, 20, 10);

do $$
begin
  perform public.log_meal(
    'e2000000-0000-0000-0000-000000000001'::uuid, 'lunch', now(),
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":100},
      {"foodId":"d2000000-0000-0000-0000-000000000001","quantityGrams":100}]'::jsonb
  );
end $$;

select is(
  (select sum(s.fiber_g) from public.meal_entry_snapshots s
   join public.meal_entry_items i on i.id = s.meal_entry_item_id
   join public.meal_entries m on m.id = i.meal_entry_id
   where m.operation_id = 'e2000000-0000-0000-0000-000000000001'),
  0::numeric, 'kontrol: ham SUM() hâlâ 0 döner (Postgres''in doğal davranışı, biz onu sarmaladık)'
);
select is(
  (select total_fiber_g from public.daily_nutrition_summary(current_date)),
  null, 'DÜZELTME: daily_nutrition_summary eksik alanda NULL döner, 0 değil (§03)'
);
-- daily_nutrition_summary GÜNÜN TÜMÜNÜ toplar: bu testte Ayşe'nin daha
-- önce kaydettiği kahvaltı (247.5+195) ve ara öğün (94.64) de dahildir —
-- yalnız son öğün değil. 247.5+195+94.64+165+200 = 902.14.
select is(
  (select total_energy_kcal from public.daily_nutrition_summary(current_date)),
  902.14, 'zorunlu alan (enerji) günün TÜM öğünleri için tam toplanır'
);

-- ---------------------------------------------------------------------------
-- photo_storage_path — tasarım dili yenilemesi (2026-07-20, Son öğün kartı)
-- daily_nutrition_summary testlerinden SONRA: yeni bir öğün eklemek yukarıdaki
-- kesin toplam (902.14) varsayımını bozar.
-- ---------------------------------------------------------------------------
select is(
  (select photo_storage_path from public.meal_entries where id = current_setting('test.meal_id')::uuid),
  null, 'p_photo_storage_path verilmeyen çağrıda kolon NULL kalır (geriye uyumluluk)'
);

do $$
declare v_meal_id uuid;
begin
  v_meal_id := public.log_meal(
    'e3000000-0000-0000-0000-000000000001'::uuid, 'dinner', now(),
    '[{"foodId":"10000000-0000-0000-0000-000000000001","quantityGrams":100}]'::jsonb,
    null, null, 'b1111111-1111-1111-1111-111111111111/photo-test.jpg'
  );
  perform set_config('test.photo_meal_id', v_meal_id::text, true);
end $$;

select is(
  (select photo_storage_path from public.meal_entries where id = current_setting('test.photo_meal_id')::uuid),
  'b1111111-1111-1111-1111-111111111111/photo-test.jpg', 'p_photo_storage_path verilen çağrıda kolona yazılır'
);

reset role;
select * from finish();
rollback;
