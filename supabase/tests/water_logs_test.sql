-- Implements: MVP-06
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."

begin;
select plan(17);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_water@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_water@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"c1111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.water_logs (user_id, amount_ml, operation_id) values
  ('c1111111-1111-1111-1111-111111111111', 250, 'f0000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.water_logs where user_id = 'c1111111-1111-1111-1111-111111111111'),
  1, 'POZİTİF: su kaydı oluşturuldu'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkası adına yazma (with check)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.water_logs (user_id, amount_ml, operation_id)
     values ('c2222222-2222-2222-2222-222222222222', 250, 'f0000000-0000-0000-0000-000000000099') $$,
  '42501', null, 'NEGATİF: Ayşe, Burak adına su kaydı yazamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: miktar sınırları
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.water_logs (user_id, amount_ml, operation_id)
     values ('c1111111-1111-1111-1111-111111111111', 0, 'f0000000-0000-0000-0000-000000000002') $$,
  '23514', null, 'NEGATİF: 0 ml reddedilir'
);
select throws_ok(
  $$ insert into public.water_logs (user_id, amount_ml, operation_id)
     values ('c1111111-1111-1111-1111-111111111111', 6000, 'f0000000-0000-0000-0000-000000000003') $$,
  '23514', null, 'NEGATİF: 5000 ml üstü reddedilir'
);

-- ---------------------------------------------------------------------------
-- İDEMPOTENCY: aynı operation_id ikinci kez UNIQUE ihlali verir
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.water_logs (user_id, amount_ml, operation_id)
     values ('c1111111-1111-1111-1111-111111111111', 500, 'f0000000-0000-0000-0000-000000000001') $$,
  '23505', null, 'İDEMPOTENCY: aynı operation_id UNIQUE ihlali (istemci bunu başarı sayar)'
);
select is(
  (select count(*)::int from public.water_logs where user_id = 'c1111111-1111-1111-1111-111111111111'),
  1, 'İDEMPOTENCY: hâlâ tek satır (500ml ile tekrar YAZILMADI)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select * from public.water_logs $$,
  '42501', null, 'NEGATİF: anon water_logs okuyamaz'
);
select throws_ok(
  $$ insert into public.water_logs (user_id, amount_ml, operation_id)
     values ('c1111111-1111-1111-1111-111111111111', 250, 'f0000000-0000-0000-0000-000000000004') $$,
  '42501', null, 'NEGATİF: anon water_logs yazamaz'
);
select throws_ok(
  $$ select public.daily_water_summary(current_date) $$,
  '42501', null, 'NEGATİF: anon daily_water_summary çalıştıramaz'
);
reset role;

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin su kaydını göremez
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.water_logs where user_id = 'c1111111-1111-1111-1111-111111111111'),
  0, 'NEGATİF: Burak Ayşe''nin su kaydını göremez'
);
select is(
  (select total_ml from public.daily_water_summary(current_date)),
  0, 'Burak''ın kendi günü boş: toplam 0'
);

-- ---------------------------------------------------------------------------
-- daily_water_summary — toplam, sayaç, son kullanılan miktar
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"c1111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.water_logs (user_id, amount_ml, operation_id) values
  ('c1111111-1111-1111-1111-111111111111', 330, 'f0000000-0000-0000-0000-000000000005'),
  ('c1111111-1111-1111-1111-111111111111', 500, 'f0000000-0000-0000-0000-000000000006');

select is(
  (select total_ml from public.daily_water_summary(current_date)),
  1080, 'daily_water_summary: toplam doğru (250+330+500)'
);
select is(
  (select log_count from public.daily_water_summary(current_date)),
  3, 'daily_water_summary: kayıt sayısı doğru'
);
select is(
  (select last_amount_ml from public.daily_water_summary(current_date)),
  500, 'daily_water_summary: son kullanılan miktar (tek dokunuş varsayılanı)'
);

-- ---------------------------------------------------------------------------
-- Soft-delete: silinen kayıt toplamdan düşer
-- ---------------------------------------------------------------------------
update public.water_logs set deleted_at = now()
where operation_id = 'f0000000-0000-0000-0000-000000000006';

select is(
  (select total_ml from public.daily_water_summary(current_date)),
  580, 'soft-delete sonrası toplam düşer (1080-500)'
);
select is(
  (select count(*)::int from public.water_logs
   where user_id = 'c1111111-1111-1111-1111-111111111111' and deleted_at is not null),
  1, 'soft-delete: satır silinmedi, işaretlendi'
);

reset role;
select * from finish();
rollback;
