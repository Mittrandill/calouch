-- Implements: TRN-02
-- PRD: §06-training.md "Programlar" — "Kullanıcı hazır program seçer"
--
-- BAŞLANGIÇ VERİSİ, ÜRETİM ÖLÇEĞİ DEĞİL.
--
-- 2 hazır (şablon) program: owner_id null + is_template true — RLS
-- "owner_id is null" görünürlük dalıyla herkese görünür, yalnız
-- copy_program() ile kullanıcının kendi kopyasına dönüşür.
--
-- target_sets'te targetWeightKg BİLİNÇLİ OLARAK null: bir şablon programı
-- belirli bir kullanıcının çalışma ağırlığını bilemez — yalnız set×tekrar×
-- dinlenme reçete eder, ağırlığı kullanıcı canlı antrenmanda kendi girer.

-- Tek seferlik yardımcı: N set × aynı hedef tekrar/dinlenmeden target_sets
-- jsonb dizisi üretir (bkz. 20260720161000_programs.sql target_sets şekli).
create or replace function pg_temp.mk_sets(set_count int, reps int, rest_seconds int)
returns jsonb
language sql
as $$
  select jsonb_agg(jsonb_build_object(
    'setNumber', n, 'targetReps', reps, 'targetWeightKg', null,
    'isWarmup', false, 'isDropset', false, 'restSeconds', rest_seconds
  ))
  from generate_series(1, set_count) n
$$;

do $$
declare
  program_1 uuid := '40000000-0000-0000-0000-000000000001';
  version_1 uuid := '41000000-0000-0000-0000-000000000001';
  program_2 uuid := '40000000-0000-0000-0000-000000000002';
  version_2 uuid := '41000000-0000-0000-0000-000000000002';
  day_a uuid := gen_random_uuid();
  day_b uuid := gen_random_uuid();
  day_c uuid := gen_random_uuid();
begin
  -- =========================================================================
  -- Program 1: Başlangıç Tam Vücut (3 Gün)
  -- =========================================================================
  insert into public.programs (id, owner_id, name, is_template) values
    (program_1, null, 'Başlangıç Tam Vücut (3 Gün)', true);
  insert into public.program_versions (id, program_id, version_number, weeks, operation_id) values
    (version_1, program_1, 1, 1, '42000000-0000-0000-0000-000000000001');
  update public.programs set current_version_id = version_1 where id = program_1;

  insert into public.program_days (id, program_version_id, week_number, day_index, name) values
    (day_a, version_1, 1, 0, 'Gün 1 — Tam Vücut A'),
    (day_b, version_1, 1, 1, 'Gün 2 — Tam Vücut B'),
    (day_c, version_1, 1, 2, 'Gün 3 — Tam Vücut C');

  insert into public.program_exercises (program_day_id, exercise_id, order_index, target_sets) values
    (day_a, '30000000-0000-0000-0000-000000000002', 0, pg_temp.mk_sets(3, 10, 90)),  -- Squat
    (day_a, '30000000-0000-0000-0000-000000000001', 1, pg_temp.mk_sets(3, 10, 90)),  -- Bench Press
    (day_a, '30000000-0000-0000-0000-000000000005', 2, pg_temp.mk_sets(3, 10, 90)),  -- Barbell Row
    (day_a, '30000000-0000-0000-0000-000000000009', 3, pg_temp.mk_sets(3, 45, 45)),  -- Plank (saniye)

    (day_b, '30000000-0000-0000-0000-000000000003', 0, pg_temp.mk_sets(3, 6, 120)),  -- Deadlift
    (day_b, '30000000-0000-0000-0000-000000000004', 1, pg_temp.mk_sets(3, 10, 90)),  -- Overhead Press
    (day_b, '30000000-0000-0000-0000-000000000013', 2, pg_temp.mk_sets(3, 12, 75)),  -- Lat Pulldown
    (day_b, '30000000-0000-0000-0000-000000000022', 3, pg_temp.mk_sets(3, 15, 45)),  -- Crunch

    (day_c, '30000000-0000-0000-0000-000000000014', 0, pg_temp.mk_sets(3, 12, 90)),  -- Leg Press
    (day_c, '30000000-0000-0000-0000-000000000008', 1, pg_temp.mk_sets(3, 12, 75)),  -- Push-up
    (day_c, '30000000-0000-0000-0000-000000000006', 2, pg_temp.mk_sets(3, 10, 75)),  -- Dumbbell Row
    (day_c, '30000000-0000-0000-0000-000000000016', 3, pg_temp.mk_sets(3, 15, 45));  -- Calf Raise

  -- =========================================================================
  -- Program 2: Push/Pull/Legs (3 Gün)
  -- =========================================================================
  day_a := gen_random_uuid();
  day_b := gen_random_uuid();
  day_c := gen_random_uuid();

  insert into public.programs (id, owner_id, name, is_template) values
    (program_2, null, 'Push/Pull/Legs (3 Gün)', true);
  insert into public.program_versions (id, program_id, version_number, weeks, operation_id) values
    (version_2, program_2, 1, 1, '42000000-0000-0000-0000-000000000002');
  update public.programs set current_version_id = version_2 where id = program_2;

  insert into public.program_days (id, program_version_id, week_number, day_index, name) values
    (day_a, version_2, 1, 0, 'Push'),
    (day_b, version_2, 1, 1, 'Pull'),
    (day_c, version_2, 1, 2, 'Legs');

  insert into public.program_exercises (program_day_id, exercise_id, order_index, target_sets) values
    (day_a, '30000000-0000-0000-0000-000000000001', 0, pg_temp.mk_sets(4, 8, 120)),  -- Bench Press
    (day_a, '30000000-0000-0000-0000-000000000004', 1, pg_temp.mk_sets(3, 10, 90)),  -- Overhead Press
    (day_a, '30000000-0000-0000-0000-000000000012', 2, pg_temp.mk_sets(3, 12, 60)),  -- Triceps Pushdown
    (day_a, '30000000-0000-0000-0000-000000000017', 3, pg_temp.mk_sets(3, 15, 45)),  -- Lateral Raise

    (day_b, '30000000-0000-0000-0000-000000000005', 0, pg_temp.mk_sets(4, 8, 120)),  -- Barbell Row
    (day_b, '30000000-0000-0000-0000-000000000007', 1, pg_temp.mk_sets(3, 8, 90)),   -- Pull-up
    (day_b, '30000000-0000-0000-0000-000000000018', 2, pg_temp.mk_sets(3, 15, 60)),  -- Face Pull
    (day_b, '30000000-0000-0000-0000-000000000011', 3, pg_temp.mk_sets(3, 12, 60)),  -- Biceps Curl

    (day_c, '30000000-0000-0000-0000-000000000002', 0, pg_temp.mk_sets(4, 8, 120)),  -- Squat
    (day_c, '30000000-0000-0000-0000-000000000014', 1, pg_temp.mk_sets(3, 12, 90)),  -- Leg Press
    (day_c, '30000000-0000-0000-0000-000000000015', 2, pg_temp.mk_sets(3, 12, 60)),  -- Leg Curl
    (day_c, '30000000-0000-0000-0000-000000000016', 3, pg_temp.mk_sets(3, 15, 45));  -- Calf Raise
end $$;

drop function pg_temp.mk_sets(int, int, int);
