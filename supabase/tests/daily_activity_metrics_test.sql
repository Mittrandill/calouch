-- Implements: MVP-12
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."

begin;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_activity@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('d2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_activity@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.daily_activity_metrics
  (user_id, activity_date, source, steps, active_energy_kcal, synced_at)
values
  ('d1111111-1111-1111-1111-111111111111', date '2026-07-18', 'apple_health', 4200, 250.5, '2026-07-18T08:00:00Z');

select is(
  (select count(*)::int from public.daily_activity_metrics where user_id = 'd1111111-1111-1111-1111-111111111111'),
  1, 'POZİTİF: aktivite kaydı oluşturuldu'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkası adına yazma
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source, steps)
     values ('d2222222-2222-2222-2222-222222222222', date '2026-07-18', 'apple_health', 100) $$,
  '42501', null, 'NEGATİF: Ayşe, Burak adına aktivite kaydı yazamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: kısıtlar
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source, steps)
     values ('d1111111-1111-1111-1111-111111111111', date '2026-07-19', 'apple_health', 300000) $$,
  '23514', null, 'NEGATİF: 200.000 üstü adım reddedilir'
);
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source, active_energy_kcal)
     values ('d1111111-1111-1111-1111-111111111111', date '2026-07-19', 'apple_health', 25000) $$,
  '23514', null, 'NEGATİF: 20.000 kcal üstü reddedilir'
);
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source)
     values ('d1111111-1111-1111-1111-111111111111', date '2026-07-19', 'apple_health') $$,
  '23514', null, 'NEGATİF: adım VE aktif enerji ikisi de null olamaz'
);
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source, steps)
     values ('d1111111-1111-1111-1111-111111111111', date '2026-07-19', 'fitbit', 100) $$,
  '23514', null, 'NEGATİF: tanımsız kaynak reddedilir'
);

-- ---------------------------------------------------------------------------
-- UPSERT: aynı (user, date, source) yeniden sync ÜZERİNE yazar, çoğaltmaz
-- ---------------------------------------------------------------------------
insert into public.daily_activity_metrics
  (user_id, activity_date, source, steps, active_energy_kcal, synced_at)
values
  ('d1111111-1111-1111-1111-111111111111', date '2026-07-18', 'apple_health', 5000, 280.0, '2026-07-18T09:00:00Z')
on conflict (user_id, activity_date, source)
do update set steps = excluded.steps, active_energy_kcal = excluded.active_energy_kcal, synced_at = excluded.synced_at;

select is(
  (select count(*)::int from public.daily_activity_metrics
   where user_id = 'd1111111-1111-1111-1111-111111111111' and activity_date = date '2026-07-18'),
  1, 'UPSERT: yeniden sync çift kayıt üretmez, hâlâ tek satır'
);
select is(
  (select steps from public.daily_activity_metrics
   where user_id = 'd1111111-1111-1111-1111-111111111111' and activity_date = date '2026-07-18'),
  5000, 'UPSERT: değer yerinde güncellendi (4200 → 5000)'
);

-- ---------------------------------------------------------------------------
-- Farklı kaynak, aynı gün: AYRI satır (asla sessizce birleştirilmez)
-- ---------------------------------------------------------------------------
insert into public.daily_activity_metrics
  (user_id, activity_date, source, steps, active_energy_kcal, synced_at)
values
  ('d1111111-1111-1111-1111-111111111111', date '2026-07-18', 'health_connect', 5100, 290.0, '2026-07-18T10:00:00Z');

select is(
  (select count(*)::int from public.daily_activity_metrics
   where user_id = 'd1111111-1111-1111-1111-111111111111' and activity_date = date '2026-07-18'),
  2, 'Farklı kaynak aynı gün için ayrı satır kalır (birleştirilmez)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select * from public.daily_activity_metrics $$,
  '42501', null, 'NEGATİF: anon aktivite kaydı okuyamaz'
);
select throws_ok(
  $$ insert into public.daily_activity_metrics (user_id, activity_date, source, steps)
     values ('d1111111-1111-1111-1111-111111111111', date '2026-07-20', 'apple_health', 100) $$,
  '42501', null, 'NEGATİF: anon aktivite kaydı yazamaz'
);
select throws_ok(
  $$ select public.daily_activity_summary(date '2026-07-18') $$,
  '42501', null, 'NEGATİF: anon daily_activity_summary çalıştıramaz'
);
reset role;

-- ---------------------------------------------------------------------------
-- Çapraz kullanıcı izolasyonu
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"d2222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.daily_activity_metrics where user_id = 'd1111111-1111-1111-1111-111111111111'),
  0, 'NEGATİF: Burak Ayşe''nin aktivite kaydını göremez'
);
select is(
  (select count(*)::int from public.daily_activity_summary(date '2026-07-18')),
  0, 'Burak''ın kendi günü boş: RPC satır döndürmez'
);

-- ---------------------------------------------------------------------------
-- daily_activity_summary: birden fazla kaynak varsa en son senkronlanan döner
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"d1111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select steps from public.daily_activity_summary(date '2026-07-18')),
  5100, 'daily_activity_summary: en son senkronlanan kaynak (health_connect) döner'
);

reset role;
select * from finish();
rollback;
