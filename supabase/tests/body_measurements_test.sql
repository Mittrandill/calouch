-- Implements: MVP-07
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- body_measurements: pozitif akış, fiziksel akla yatkınlık sınırları
-- (weight/height/body_fat range + "en az bir metrik dolu" kısıtı),
-- idempotency, çapraz kullanıcı izolasyonu, weight_trend() (yalnız
-- weight_kg dolu satırlar, soft-delete hariç) ve anon reddi.

begin;
select plan(18);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_measure@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_measure@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış — kilo + bel aynı ölçüm oturumunda
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e1111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.body_measurements (user_id, weight_kg, waist_cm, operation_id, measured_at) values
  ('e1111111-1111-1111-1111-111111111111', 70.5, 80.0, 'f1000000-0000-0000-0000-000000000001', now() - interval '2 days');

select is(
  (select count(*)::int from public.body_measurements where user_id = 'e1111111-1111-1111-1111-111111111111'),
  1, 'POZİTİF: ölçüm kaydı oluşturuldu (kilo+bel aynı satır)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkası adına yazma (with check)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.body_measurements (user_id, weight_kg, operation_id)
     values ('e2222222-2222-2222-2222-222222222222', 70, 'f1000000-0000-0000-0000-000000000098') $$,
  '42501', null, 'NEGATİF: Ayşe, Burak adına ölçüm yazamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: fiziksel akla yatkınlık sınırları
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.body_measurements (user_id, weight_kg, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 10, 'f1000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'NEGATİF: 20 kg altı kilo reddedilir'
);
select throws_ok(
  $$ insert into public.body_measurements (user_id, weight_kg, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 600, 'f1000000-0000-0000-0000-000000000003') $$,
  '23514', null, 'NEGATİF: 500 kg üstü kilo reddedilir'
);
select throws_ok(
  $$ insert into public.body_measurements (user_id, height_cm, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 300, 'f1000000-0000-0000-0000-000000000004') $$,
  '23514', null, 'NEGATİF: 260 cm üstü boy reddedilir'
);
select throws_ok(
  $$ insert into public.body_measurements (user_id, body_fat_pct, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 80, 'f1000000-0000-0000-0000-000000000005') $$,
  '23514', null, 'NEGATİF: %70 üstü yağ oranı reddedilir'
);
select throws_ok(
  $$ insert into public.body_measurements (user_id, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 'f1000000-0000-0000-0000-000000000006') $$,
  '23514', null, 'NEGATİF: tüm metrikler boşsa reddedilir (has_value)'
);

-- ---------------------------------------------------------------------------
-- İDEMPOTENCY: aynı operation_id ikinci kez UNIQUE ihlali verir
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.body_measurements (user_id, weight_kg, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 71, 'f1000000-0000-0000-0000-000000000001') $$,
  '23505', null, 'İDEMPOTENCY: aynı operation_id UNIQUE ihlali (istemci bunu başarı sayar)'
);
select is(
  (select count(*)::int from public.body_measurements where user_id = 'e1111111-1111-1111-1111-111111111111'),
  1, 'İDEMPOTENCY: hâlâ tek satır (71 kg ile tekrar YAZILMADI)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select * from public.body_measurements $$,
  '42501', null, 'NEGATİF: anon body_measurements okuyamaz'
);
select throws_ok(
  $$ insert into public.body_measurements (user_id, weight_kg, operation_id)
     values ('e1111111-1111-1111-1111-111111111111', 70, 'f1000000-0000-0000-0000-000000000007') $$,
  '42501', null, 'NEGATİF: anon body_measurements yazamaz'
);
select throws_ok(
  $$ select public.weight_trend() $$,
  '42501', null, 'NEGATİF: anon weight_trend çalıştıramaz'
);
reset role;

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin ölçümünü göremez
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.body_measurements where user_id = 'e1111111-1111-1111-1111-111111111111'),
  0, 'NEGATİF: Burak Ayşe''nin ölçümünü göremez'
);
select is(
  (select count(*)::int from public.weight_trend()),
  0, 'Burak''ın kendi trendi boş'
);

-- ---------------------------------------------------------------------------
-- weight_trend — yalnız weight_kg dolu satırlar, tarihe göre azalan sıra
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"e1111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- yalnız bel ölçümü — weight_trend'e girmemeli
insert into public.body_measurements (user_id, waist_cm, operation_id, measured_at) values
  ('e1111111-1111-1111-1111-111111111111', 79.0, 'f1000000-0000-0000-0000-000000000008', now() - interval '1 day');
-- daha yeni bir kilo ölçümü
insert into public.body_measurements (user_id, weight_kg, operation_id, measured_at) values
  ('e1111111-1111-1111-1111-111111111111', 69.8, 'f1000000-0000-0000-0000-000000000009', now());

select is(
  (select count(*)::int from public.weight_trend()),
  2, 'weight_trend: yalnız kilo dolu satırlar sayılır (bel-only satır hariç)'
);
select is(
  (select weight_kg from public.weight_trend() order by measured_at desc limit 1),
  69.8, 'weight_trend: en yeni kayıt ilk sırada'
);

-- ---------------------------------------------------------------------------
-- Soft-delete: silinen kayıt weight_trend'den düşer
-- ---------------------------------------------------------------------------
update public.body_measurements set deleted_at = now()
where operation_id = 'f1000000-0000-0000-0000-000000000009';

select is(
  (select count(*)::int from public.weight_trend()),
  1, 'soft-delete sonrası weight_trend''den düşer'
);
select is(
  (select count(*)::int from public.body_measurements
   where user_id = 'e1111111-1111-1111-1111-111111111111' and deleted_at is not null),
  1, 'soft-delete: satır silinmedi, işaretlendi'
);

reset role;
select * from finish();
rollback;
