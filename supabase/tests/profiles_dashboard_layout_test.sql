-- Implements: MVP-11
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- `dashboard_layout` `goal_overrides` ile AYNI desen (tek satır/kullanıcı,
-- obje şekli CHECK, mevcut profiles RLS/grant'i kullanır — yeni policy yok).
-- Bu dosya yalnız yeni kolona özgü davranışı doğrular; genel profiles
-- sahiplik/anon testleri `profiles_rls_test.sql`'de zaten var.

begin;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse3@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak3@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Varsayılan
-- ---------------------------------------------------------------------------
select is(
  (select dashboard_layout::text from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  '{}',
  'Bugün ekranı yerleşimi boş obje ile başlar — istemci varsayılan kataloğu kullanır'
);

-- ---------------------------------------------------------------------------
-- POZİTİF: sahibi kendi yerleşimini yazar
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select lives_ok(
  $$ update public.profiles set dashboard_layout = '{
       "version": 1,
       "cardOrder": ["calorie", "macros", "water"],
       "hiddenCardIds": ["streak"],
       "cardSizes": {"calorie": "expanded"},
       "focusCardId": "calorie"
     }'::jsonb
     where id = '55555555-5555-5555-5555-555555555555' $$,
  'POZİTİF: sahibi kart sırası/görünürlük/boyut/odak yazar (§9)'
);

select is(
  (select dashboard_layout ->> 'focusCardId' from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'calorie',
  'POZİTİF: yazılan odak kartı okunur'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başka kullanıcının yerleşimi
-- ---------------------------------------------------------------------------
update public.profiles set dashboard_layout = '{"focusCardId":"water"}'::jsonb
  where id = '66666666-6666-6666-6666-666666666666';
select is(
  (select count(*)::int from public.profiles
   where id = '66666666-6666-6666-6666-666666666666' and dashboard_layout ->> 'focusCardId' = 'water'),
  0,
  'NEGATİF: başka kullanıcının yerleşimi değiştirilemez (RLS satırı filtreler)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: CHECK — obje şekli zorunlu (§09 "Kısıtlar veritabanında")
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.profiles set dashboard_layout = '["calorie","macros"]'::jsonb
     where id = '55555555-5555-5555-5555-555555555555' $$,
  '23514', null, 'NEGATİF: dizi kabul edilmez, obje olmalı'
);

select throws_ok(
  $$ update public.profiles set dashboard_layout = '"calorie"'::jsonb
     where id = '55555555-5555-5555-5555-555555555555' $$,
  '23514', null, 'NEGATİF: metin kabul edilmez, obje olmalı'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  $$ select dashboard_layout from public.profiles where id = '55555555-5555-5555-5555-555555555555' $$,
  '42501', null, 'NEGATİF: anon profil okuyamaz'
);

select throws_ok(
  $$ update public.profiles set dashboard_layout = '{}'::jsonb
     where id = '55555555-5555-5555-5555-555555555555' $$,
  '42501', null, 'NEGATİF: anon yerleşim yazamaz'
);

reset role;
select * from finish();
rollback;
