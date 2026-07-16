-- Implements: MVP-03
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- catalog.foods karma sahiplik taşır (owner_id null = global katalog,
-- dolu = kullanıcı özel besini). Negatif testler bunun gerçekten izole
-- edildiğini kanıtlar — RLS kapatılarak doğrulandı (bkz. commit notu):
-- sabotaj sırasında bu üç negatif test de beklendiği gibi kırılıyor.

begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse3@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak3@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- Global (owner_id null) test besini — migration/service-role gibi.
insert into catalog.foods (id, category, country_code) values
  ('77777777-7777-7777-7777-777777777777', 'grain', 'TR');
insert into catalog.food_translations (food_id, locale, name) values
  ('77777777-7777-7777-7777-777777777777', 'tr', 'Bulgur pilavı');

select ok(true, 'kurulum: global besin oluşturuldu');

-- ---------------------------------------------------------------------------
-- Kullanıcı 1 (Ayşe)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select is(
  (select count(*)::int from catalog.foods where id = '77777777-7777-7777-7777-777777777777'),
  1,
  'POZİTİF: global besin herkese görünür'
);

select lives_ok(
  $$ insert into catalog.foods (id, owner_id, category) values
       ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'custom') $$,
  'POZİTİF: kullanıcı kendi özel besinini oluşturur'
);

select lives_ok(
  $$ insert into catalog.food_translations (food_id, locale, name) values
       ('88888888-8888-8888-8888-888888888888', 'tr', 'Annemin köfte tarifi') $$,
  'POZİTİF: özel besinin çevirisi eklenir'
);

select throws_ok(
  $$ insert into catalog.foods (id, owner_id, category) values
       ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'custom') $$,
  '42501', null, 'NEGATİF: başkası adına özel besin oluşturulamaz'
);

select throws_ok(
  $$ insert into catalog.foods (id, owner_id, category) values
       ('99999999-9999-9999-9999-999999999999', null, 'should_fail') $$,
  '42501', null, 'NEGATİF: global (owner_id null) besin istemciden oluşturulamaz'
);

-- ---------------------------------------------------------------------------
-- Kullanıcı 2 (Burak) — Ayşe'nin özel besinine erişmeye çalışır
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';

select is(
  (select count(*)::int from catalog.foods where id = '88888888-8888-8888-8888-888888888888'),
  0,
  'NEGATİF: başkasının özel besini görünmez'
);

select is(
  (select count(*)::int from catalog.food_translations where food_id = '88888888-8888-8888-8888-888888888888'),
  0,
  'NEGATİF: çocuk tablo da görünürlüğü ebeveynden miras alır (translations)'
);

select is(
  (select count(*)::int from catalog.foods where id = '77777777-7777-7777-7777-777777777777'),
  1,
  'global besin Burak için de görünür'
);

update catalog.foods set category = 'ele_gecirildi' where id = '77777777-7777-7777-7777-777777777777';
select is(
  (select category from catalog.foods where id = '77777777-7777-7777-7777-777777777777'),
  'grain',
  'NEGATİF: global besin istemciden değiştirilemez'
);

update catalog.foods set category = 'ele_gecirildi' where id = '88888888-8888-8888-8888-888888888888';
select is(
  (select count(*)::int from catalog.foods
   where id = '88888888-8888-8888-8888-888888888888' and category = 'ele_gecirildi'),
  0,
  'NEGATİF: başkasının özel besini değiştirilemez'
);

-- ---------------------------------------------------------------------------
-- anon
-- ---------------------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from catalog.foods $$,
  '42501', null, 'NEGATİF: anon catalog.foods\'a erişemez (schema USAGE yok)'
);

reset role;

-- ---------------------------------------------------------------------------
-- Yapısal kontroller
-- ---------------------------------------------------------------------------
select is((select count(*)::int from pg_extension where extname = 'pg_trgm'), 1, 'pg_trgm kurulu');
select is((select count(*)::int from pg_extension where extname = 'unaccent'), 1, 'unaccent kurulu');
select is(
  catalog.immutable_unaccent('yoğurt'), 'yogurt', 'immutable_unaccent aksanı kaldırıyor'
);

select * from finish();
rollback;
