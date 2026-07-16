-- Implements: MVP-02
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- Bu migration sağlık verisi (doğum yılı, boy, kilo, cinsiyet, hedefler)
-- ekliyor. Negatif testler asıl değerli olanlardır: pozitif test, RLS tamamen
-- kapalıyken de geçer.
--
-- Kısıt testleri ayrıca nutrition-engine'in assertValidInput sınırlarını
-- aynalar — ikisi ayrışırsa motorun reddettiği bir satır veritabanına girer.

begin;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse2@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak2@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Varsayılanlar
-- ---------------------------------------------------------------------------
select is(
  (select biological_sex from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'unspecified',
  'Cinsiyet varsayılanı unspecified — adım atlanabilir (§00)'
);

select is(
  (select onboarding_completed_at from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  null,
  'Onboarding başlangıçta tamamlanmamış (§02 "yarıda kalınca devam eder")'
);

select is(
  (select goal_overrides::text from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  '{}',
  'Manuel override boş başlar'
);

-- ---------------------------------------------------------------------------
-- POZİTİF: sahibi kendi verisini yazar
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok(
  $$ update public.profiles set
       birth_year = 1996, height_cm = 180, weight_kg = 80, target_weight_kg = 75,
       biological_sex = 'male', activity_level = 'moderate',
       primary_goal = 'lose_weight', weekly_change_kg = 0.5
     where id = '33333333-3333-3333-3333-333333333333' $$,
  'POZİTİF: sahibi onboarding verisini yazar'
);

-- nutrition-engine'in referans senaryosuyla aynı değerler.
select lives_ok(
  $$ update public.profiles set
       bmr_kcal = 1780, tdee_kcal = 2759, target_calories_kcal = 2209,
       protein_g = 135, carbs_g = 280, fat_g = 61, fiber_g = 31, water_ml = 2800,
       goal_formula_version = 'mifflin-st-jeor-v1', goals_confidence = 'high',
       goals_calculated_at = now()
     where id = '33333333-3333-3333-3333-333333333333' $$,
  'POZİTİF: hesaplanan hedefler ve formül sürümü yazılır (§8.4)'
);

select lives_ok(
  $$ update public.profiles set goal_overrides = '{"targetCaloriesKcal":2000}'::jsonb
     where id = '33333333-3333-3333-3333-333333333333' $$,
  'POZİTİF: manuel override yazılır (§02 "manuel override korunur")'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başka kullanıcının sağlık verisi
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  0,
  'NEGATİF: başka kullanıcının sağlık verisi görünmez'
);

update public.profiles set weight_kg = 99 where id = '44444444-4444-4444-4444-444444444444';
select is(
  (select count(*)::int from public.profiles
   where id = '44444444-4444-4444-4444-444444444444' and weight_kg = 99),
  0,
  'NEGATİF: başka kullanıcının kilosu değiştirilemez'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: kısıtlar (§09 "Kısıtlar veritabanında")
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.profiles set biological_sex = 'other'
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: geçersiz cinsiyet değeri reddedilir'
);

select throws_ok(
  $$ update public.profiles set weight_kg = 600
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: 600 kg reddedilir (motor da reddediyor)'
);

select throws_ok(
  $$ update public.profiles set weekly_change_kg = 3
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: haftada 3 kg reddedilir'
);

select throws_ok(
  $$ update public.profiles set primary_goal = 'get_rich'
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: §8.3 dışı hedef reddedilir'
);

select throws_ok(
  $$ update public.profiles set target_calories_kcal = 2000, protein_g = null
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: yarım hedef seti reddedilir (kalori var, protein yok)'
);

select throws_ok(
  $$ update public.profiles set goal_overrides = '"metin"'::jsonb
     where id = '33333333-3333-3333-3333-333333333333' $$,
  '23514', null, 'NEGATİF: override JSON nesnesi olmalı'
);

reset role;
select * from finish();
rollback;
