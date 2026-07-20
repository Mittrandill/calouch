-- Implements: TRN-01
-- PRD: §06-training.md "Egzersiz kataloğu"
--
-- BAŞLANGIÇ VERİSİ, ÜRETİM ÖLÇEĞİ DEĞİL.
--
-- ~25 yaygın egzersiz — program builder'ı ve canlı antrenman akışını gerçek
-- satırlarla test edebilmek için. MET (Metabolic Equivalent of Task)
-- değerleri Compendium of Physical Activities'ten YAKLAŞIK alınmıştır,
-- tıbbi/laboratuvar hassasiyetinde değildir — catalog_starter_foods.sql'deki
-- "unverified/tahmini" dürüstlüğüyle aynı gerekçe.

-- 1. Bench Press
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000001', 'chest', array['triceps', 'shoulders'], 'barbell', 'intermediate', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000001', 'tr', 'Bench Press'),
  ('30000000-0000-0000-0000-000000000001', 'en', 'Bench Press');

-- 2. Squat
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000002', 'quads', array['glutes', 'hamstrings'], 'barbell', 'intermediate', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000002', 'tr', 'Squat (Çömelme)'),
  ('30000000-0000-0000-0000-000000000002', 'en', 'Squat');

-- 3. Deadlift
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000003', 'back', array['glutes', 'hamstrings'], 'barbell', 'advanced', 6.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000003', 'tr', 'Deadlift (Ölü Kaldırış)'),
  ('30000000-0000-0000-0000-000000000003', 'en', 'Deadlift');

-- 4. Overhead Press
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000004', 'shoulders', array['triceps'], 'barbell', 'intermediate', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000004', 'tr', 'Askeri Pres (Overhead Press)'),
  ('30000000-0000-0000-0000-000000000004', 'en', 'Overhead Press');

-- 5. Barbell Row
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000005', 'back', array['biceps'], 'barbell', 'intermediate', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000005', 'tr', 'Barbell Row (Eğilerek Çekiş)'),
  ('30000000-0000-0000-0000-000000000005', 'en', 'Barbell Row');

-- 6. Dumbbell Row
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000006', 'back', array['biceps'], 'dumbbell', 'beginner', 4.5);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000006', 'tr', 'Dambıl Row'),
  ('30000000-0000-0000-0000-000000000006', 'en', 'Dumbbell Row');

-- 7. Pull-up
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000007', 'back', array['biceps'], 'bodyweight', 'advanced', 8.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000007', 'tr', 'Barfiks (Pull-up)'),
  ('30000000-0000-0000-0000-000000000007', 'en', 'Pull-up');

-- 8. Push-up
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000008', 'chest', array['triceps'], 'bodyweight', 'beginner', 8.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000008', 'tr', 'Şınav (Push-up)'),
  ('30000000-0000-0000-0000-000000000008', 'en', 'Push-up');

-- 9. Plank
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000009', 'abs', array[]::text[], 'bodyweight', 'beginner', 3.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000009', 'tr', 'Plank'),
  ('30000000-0000-0000-0000-000000000009', 'en', 'Plank');

-- 10. Lunge
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000010', 'quads', array['glutes'], 'dumbbell', 'beginner', 4.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000010', 'tr', 'Lunge (Öne Adım)'),
  ('30000000-0000-0000-0000-000000000010', 'en', 'Lunge');

-- 11. Biceps Curl
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000011', 'biceps', array[]::text[], 'dumbbell', 'beginner', 3.5);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000011', 'tr', 'Biceps Curl'),
  ('30000000-0000-0000-0000-000000000011', 'en', 'Biceps Curl');

-- 12. Triceps Pushdown
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000012', 'triceps', array[]::text[], 'cable', 'beginner', 3.5);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000012', 'tr', 'Triceps Pushdown'),
  ('30000000-0000-0000-0000-000000000012', 'en', 'Triceps Pushdown');

-- 13. Lat Pulldown
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000013', 'back', array['biceps'], 'machine', 'beginner', 4.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000013', 'tr', 'Lat Pulldown'),
  ('30000000-0000-0000-0000-000000000013', 'en', 'Lat Pulldown');

-- 14. Leg Press
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000014', 'quads', array['glutes'], 'machine', 'beginner', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000014', 'tr', 'Leg Press'),
  ('30000000-0000-0000-0000-000000000014', 'en', 'Leg Press');

-- 15. Leg Curl
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000015', 'hamstrings', array[]::text[], 'machine', 'beginner', 3.5);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000015', 'tr', 'Leg Curl'),
  ('30000000-0000-0000-0000-000000000015', 'en', 'Leg Curl');

-- 16. Calf Raise
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000016', 'calves', array[]::text[], 'machine', 'beginner', 3.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000016', 'tr', 'Calf Raise (Baldır)'),
  ('30000000-0000-0000-0000-000000000016', 'en', 'Calf Raise');

-- 17. Lateral Raise
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000017', 'shoulders', array[]::text[], 'dumbbell', 'beginner', 3.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000017', 'tr', 'Yan Kaldırış (Lateral Raise)'),
  ('30000000-0000-0000-0000-000000000017', 'en', 'Lateral Raise');

-- 18. Face Pull
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000018', 'shoulders', array['back'], 'cable', 'beginner', 3.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000018', 'tr', 'Face Pull'),
  ('30000000-0000-0000-0000-000000000018', 'en', 'Face Pull');

-- 19. Hip Thrust
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000019', 'glutes', array['hamstrings'], 'barbell', 'advanced', 5.0);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000019', 'tr', 'Hip Thrust (Kalça İtişi)'),
  ('30000000-0000-0000-0000-000000000019', 'en', 'Hip Thrust');

-- 20. Romanian Deadlift
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value) values
  ('30000000-0000-0000-0000-000000000020', 'hamstrings', array['glutes'], 'barbell', 'advanced', 5.5);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000020', 'tr', 'Romanian Deadlift (RDL)'),
  ('30000000-0000-0000-0000-000000000020', 'en', 'Romanian Deadlift');

-- 21. Dip
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000021', 'chest', array['triceps'], 'bodyweight', 'advanced', 8.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000021', 'tr', 'Dip (Paralel Bar)'),
  ('30000000-0000-0000-0000-000000000021', 'en', 'Dip');

-- 22. Crunch
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000022', 'abs', array[]::text[], 'bodyweight', 'beginner', 3.8, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000022', 'tr', 'Mekik (Crunch)'),
  ('30000000-0000-0000-0000-000000000022', 'en', 'Crunch');

-- 23. Treadmill Run
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000023', 'cardio', array[]::text[], 'cardio_machine', 'intermediate', 9.8, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000023', 'tr', 'Koşu Bandı'),
  ('30000000-0000-0000-0000-000000000023', 'en', 'Treadmill Run');

-- 24. Stationary Bike
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000024', 'cardio', array['quads'], 'cardio_machine', 'beginner', 7.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000024', 'tr', 'Sabit Bisiklet'),
  ('30000000-0000-0000-0000-000000000024', 'en', 'Stationary Bike');

-- 25. Rowing Machine
insert into catalog.exercises (id, primary_muscle, secondary_muscles, equipment, difficulty, met_value, is_bodyweight) values
  ('30000000-0000-0000-0000-000000000025', 'cardio', array['back'], 'cardio_machine', 'intermediate', 7.0, true);
insert into catalog.exercise_translations (exercise_id, locale, name) values
  ('30000000-0000-0000-0000-000000000025', 'tr', 'Kürek Makinesi (Rowing)'),
  ('30000000-0000-0000-0000-000000000025', 'en', 'Rowing Machine');
