-- Implements: MVP-08
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- create_ai_job/complete_ai_job/fail_ai_job: idempotency, kill switch,
-- rate limit, sahiplik kontrolü (complete/fail başkasının job'ında
-- çalışmaz), çapraz kullanıcı izolasyonu, maliyet ledger'ı ve anon reddi.

begin;
select plan(17);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('e5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_ai@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('e6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_ai@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış — yeni job
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e5555555-5555-5555-5555-555555555555","role":"authenticated"}';

select is(
  (select is_new from public.create_ai_job('f5000000-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555/p1.jpg')),
  true, 'POZİTİF: yeni job oluşturuldu (is_new)'
);
select is(
  (select status from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
  'processing', 'POZİTİF: yeni job durumu processing'
);

-- ---------------------------------------------------------------------------
-- İDEMPOTENCY: aynı operation_id ikinci kez yeni satır YARATMAZ
-- ---------------------------------------------------------------------------
select is(
  (select is_new from public.create_ai_job('f5000000-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555/p1.jpg')),
  false, 'İDEMPOTENCY: aynı operation_id ikinci çağrıda is_new=false'
);
select is(
  (select count(*)::int from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
  1, 'İDEMPOTENCY: hâlâ tek satır'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin job'ını göremez
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e6666666-6666-6666-6666-666666666666","role":"authenticated"}';

select is(
  (select count(*)::int from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
  0, 'NEGATİF: Burak Ayşe''nin job''ını göremez'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak, Ayşe'nin job'ını complete/fail edemez (sahiplik kontrolü)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select public.complete_ai_job(
       (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
       '{"isFood": true}'::jsonb, 'gemini-2.5-flash', 10, 10, 0.001
     ) $$,
  '42501', null, 'NEGATİF: Burak, Ayşe''nin job''ını complete edemez'
);
select throws_ok(
  $$ select public.fail_ai_job(
       (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
       'test', 'gemini-2.5-flash', null, null, null
     ) $$,
  '42501', null, 'NEGATİF: Burak, Ayşe''nin job''ını fail edemez'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select public.create_ai_job('f5000000-0000-0000-0000-000000000099', 'x/y.jpg') $$,
  '42501', null, 'NEGATİF: anon create_ai_job çağıramaz'
);
select throws_ok(
  $$ select public.complete_ai_job(gen_random_uuid(), '{}'::jsonb, 'gemini-2.5-flash', 1, 1, 0.001) $$,
  '42501', null, 'NEGATİF: anon complete_ai_job çağıramaz'
);
select throws_ok(
  $$ select public.fail_ai_job(gen_random_uuid(), 'x', 'gemini-2.5-flash', null, null, null) $$,
  '42501', null, 'NEGATİF: anon fail_ai_job çağıramaz'
);
reset role;

-- ---------------------------------------------------------------------------
-- complete_ai_job POZİTİF: kendi job'ını tamamlar, ledger'a yazar
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e5555555-5555-5555-5555-555555555555","role":"authenticated"}';

select public.complete_ai_job(
  (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
  '{"isFood": true, "analysisVersion": "meal-analysis-v1", "mealTitle": "test", "items": [], "overallConfidence": "low", "requiresUserConfirmation": true}'::jsonb,
  'gemini-2.5-flash', 100, 50, 0.00002
);

select is(
  (select status from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001'),
  'needs_confirmation', 'complete_ai_job: durum needs_confirmation''a geçti'
);
select is(
  (select count(*)::int from private.ai_usage_ledger
   where job_id = (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000001')),
  1, 'complete_ai_job: ledger''a bir satır yazıldı'
);

-- ---------------------------------------------------------------------------
-- fail_ai_job POZİTİF: token YOKSA ledger'a yazmaz, VARSA yazar
-- ---------------------------------------------------------------------------
select public.create_ai_job('f5000000-0000-0000-0000-000000000002', 'e5555555-5555-5555-5555-555555555555/p2.jpg');
select public.fail_ai_job(
  (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000002'),
  'storage_download_failed', 'gemini-2.5-flash', null, null, null
);

select is(
  (select status from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000002'),
  'failed', 'fail_ai_job: durum failed''e geçti'
);
select is(
  (select count(*)::int from private.ai_usage_ledger
   where job_id = (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000002')),
  0, 'fail_ai_job: token tüketilmediyse ledger''a yazılmaz'
);

select public.create_ai_job('f5000000-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555555/p3.jpg');
select public.fail_ai_job(
  (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000003'),
  'invalid_provider_response', 'gemini-2.5-flash', 80, 20, 0.00001
);

select is(
  (select count(*)::int from private.ai_usage_ledger
   where job_id = (select id from private.ai_jobs where operation_id = 'f5000000-0000-0000-0000-000000000003')),
  1, 'fail_ai_job: token tüketildiyse ledger''a yine de yazılır'
);

-- ---------------------------------------------------------------------------
-- KILL SWITCH: kapalıyken yeni job oluşturulamaz
-- ---------------------------------------------------------------------------
reset role;
update private.ai_feature_flags set enabled = false where key = 'meal_photo_analysis';
set local role authenticated;
set local request.jwt.claims = '{"sub":"e5555555-5555-5555-5555-555555555555","role":"authenticated"}';

select throws_ok(
  $$ select public.create_ai_job('f5000000-0000-0000-0000-000000000004', 'e5555555-5555-5555-5555-555555555555/p4.jpg') $$,
  '55000', null, 'KILL SWITCH: kapalıyken yeni job reddedilir'
);

reset role;
update private.ai_feature_flags set enabled = true where key = 'meal_photo_analysis';

-- ---------------------------------------------------------------------------
-- RATE LIMIT: günde 10 job sınırı
-- ---------------------------------------------------------------------------
-- Şu ana kadar Ayşe için 3 job var (p1/p2/p3). Sınıra ulaşmak için 7 tane
-- daha doğrudan ekleriz (bu satır superuser/bypassrls bağlamında çalışır,
-- RLS'in gerçek yazma yolu olan create_ai_job'ı test etmesi gerekmiyor —
-- yalnızca "bugün N job var" ön koşulunu kurar).
insert into private.ai_jobs (user_id, operation_id, storage_path, status)
select 'e5555555-5555-5555-5555-555555555555', gen_random_uuid(), 'e5555555-5555-5555-5555-555555555555/filler.jpg', 'failed'
from generate_series(1, 7);

set local role authenticated;
set local request.jwt.claims = '{"sub":"e5555555-5555-5555-5555-555555555555","role":"authenticated"}';

select throws_ok(
  $$ select public.create_ai_job('f5000000-0000-0000-0000-000000000005', 'e5555555-5555-5555-5555-555555555555/p5.jpg') $$,
  '55001', null, 'RATE LIMIT: günde 10 job sınırı aşılınca reddedilir'
);

reset role;
select * from finish();
rollback;
