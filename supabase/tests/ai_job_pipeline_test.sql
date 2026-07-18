-- Implements: MVP-09
-- Katalog eşleştirme, raw/result ayrımı, GET sahipliği ve idempotent ledger.

begin;
select plan(18);

create temporary table mvp09_test_job_ids (key text primary key, id uuid not null);
grant select, insert on mvp09_test_job_ids to authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('a9000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mvp09_a@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('a9000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mvp09_b@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

insert into catalog.foods (id, category, country_code)
values ('a9100000-0000-4000-8000-000000000001', 'legume', 'TR');
insert into catalog.food_versions (
  id, food_id, version_number, source_id, verification_status, quality_score
) values (
  'a9200000-0000-4000-8000-000000000001',
  'a9100000-0000-4000-8000-000000000001',
  1,
  (select id from catalog.food_sources where key = 'turkish_dishes'),
  'verified',
  0.95
);
insert into catalog.food_nutrients (
  food_version_id, energy_kcal, protein_g, carbs_g, sugar_g, fat_g,
  saturated_fat_g, fiber_g, sodium_mg
) values (
  'a9200000-0000-4000-8000-000000000001', 150, 8, 22, 2, 4, 1, 7, 250
);
insert into catalog.food_translations (food_id, locale, name)
values ('a9100000-0000-4000-8000-000000000001', 'tr', 'MVP09 kuru fasulye');
insert into catalog.food_aliases (food_id, locale, alias)
values ('a9100000-0000-4000-8000-000000000001', 'tr', 'MVP09 fasulye yemeği');
update catalog.foods
set current_version_id = 'a9200000-0000-4000-8000-000000000001'
where id = 'a9100000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select food_id from public.match_ai_food(array['MVP09 kuru fasulye'], 'tr')),
  'a9100000-0000-4000-8000-000000000001'::uuid,
  'eşleştirme: exact ad doğru food satırını döndürür'
);
select is(
  (select food_version_id from public.match_ai_food(array['MVP09 fasulye yemeği'], 'tr')),
  'a9200000-0000-4000-8000-000000000001'::uuid,
  'eşleştirme: alias current version snapshotına bağlanır'
);
select is(
  (select energy_kcal from public.match_ai_food(array['MVP09 kuru fasulye'], 'tr')),
  150::numeric,
  'eşleştirme: nutrient yalnız katalog snapshotından gelir'
);
select is(
  (select source_key from public.match_ai_food(array['MVP09 kuru fasulye'], 'tr')),
  'turkish_dishes',
  'eşleştirme: veri kaynağı sonuçta taşınır'
);
select throws_ok(
  $$ select * from public.match_ai_food(array['x'], 'de') $$,
  '22023', null, 'eşleştirme: desteklenmeyen locale reddedilir'
);

insert into mvp09_test_job_ids (key, id)
select 'completed', job_id from public.create_ai_job(
  'a9300000-0000-4000-8000-000000000001',
  'a9000000-0000-4000-8000-000000000001/mvp09.jpg'
);
select lives_ok(
  $$ select public.complete_ai_job_v2(
    (select id from mvp09_test_job_ids where key = 'completed'),
    '{"providerCandidate":"MVP09 kuru fasulye"}'::jsonb,
    '{"analysisVersion":"meal-draft-v1","catalogCalories":225}'::jsonb,
    'gemini-2.5-flash', 100, 40, 0.00002
  ) $$,
  'completion v2: raw ve deterministik sonuç birlikte saklanır'
);
select is(
  (select status from public.get_ai_job(
    (select id from mvp09_test_job_ids where key = 'completed')
  )),
  'needs_confirmation',
  'GET: tamamlanan kendi job durumu okunur'
);
select is(
  (select result_response ->> 'analysisVersion' from public.get_ai_job(
    (select id from mvp09_test_job_ids where key = 'completed')
  )),
  'meal-draft-v1',
  'GET: deterministik result_response döner'
);
reset role;
select is(
  (select raw_response ->> 'providerCandidate' from private.ai_jobs
   where id = (select id from mvp09_test_job_ids where key = 'completed')),
  'MVP09 kuru fasulye',
  'saklama: provider raw yanıtı ayrı tutulur'
);
select is(
  (select count(*)::integer from private.ai_usage_ledger
   where job_id = (select id from mvp09_test_job_ids where key = 'completed')),
  1,
  'ledger: completion tek maliyet satırı oluşturur'
);
set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$ select public.complete_ai_job_v2(
    (select id from mvp09_test_job_ids where key = 'completed'),
    '{}'::jsonb, '{}'::jsonb, 'gemini-2.5-flash', 100, 40, 0.00002
  ) $$,
  'idempotency: completion retry güvenlidir'
);
reset role;
select is(
  (select count(*)::integer from private.ai_usage_ledger
   where job_id = (select id from mvp09_test_job_ids where key = 'completed')),
  1,
  'idempotency: completion retry ikinci ledger satırı üretmez'
);
set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}';

insert into mvp09_test_job_ids (key, id)
select 'failed', job_id from public.create_ai_job(
  'a9300000-0000-4000-8000-000000000002',
  'a9000000-0000-4000-8000-000000000001/mvp09-fail.jpg'
);
select public.fail_ai_job_v2(
  (select id from mvp09_test_job_ids where key = 'failed'),
  'not_food', 'Fotoğrafta yemek yok', 'gemini-2.5-flash', 50, 10, 0.00001
);
select is(
  (select error_code from public.get_ai_job(
    (select id from mvp09_test_job_ids where key = 'failed')
  )),
  'not_food',
  'failure: makinece okunur hata kodu GET sonucunda korunur'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"a9000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::integer from public.get_ai_job(
    (select id from mvp09_test_job_ids where key = 'completed')
  )),
  0,
  'NEGATİF: diğer kullanıcı job sonucunu okuyamaz'
);
select throws_ok(
  $$ select public.complete_ai_job_v2(
    (select id from mvp09_test_job_ids where key = 'completed'), '{}'::jsonb, '{}'::jsonb,
    'gemini-2.5-flash', 1, 1, 0
  ) $$,
  '42501', null, 'NEGATİF: diğer kullanıcı job tamamlayamaz'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.match_ai_food(array['MVP09 kuru fasulye'], 'tr') $$,
  '42501', null, 'NEGATİF: anon katalog eşleştirme RPC çağırmaz'
);
select throws_ok(
  $$ select * from public.get_ai_job('a9300000-0000-4000-8000-000000000001') $$,
  '42501', null, 'NEGATİF: anon job GET RPC çağırmaz'
);
select throws_ok(
  $$ select public.fail_ai_job_v2(
    'a9300000-0000-4000-8000-000000000002', 'x', 'x', 'gemini', null, null, null
  ) $$,
  '42501', null, 'NEGATİF: anon fail v2 RPC çağırmaz'
);

reset role;
select * from finish();
rollback;
