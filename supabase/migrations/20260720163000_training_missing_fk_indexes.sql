-- Implements: TRN-01/02/03
-- PRD: §09 (performans) — bkz. 20260716152511_catalog_missing_fk_indexes.sql
-- ile aynı gerekçe: her FK kolonu bir kapsayan index taşımalı, join/cascade
-- delete maliyetini önler. Supabase performans danışmanı bu eksikleri
-- tespit etti, aynı turda düzeltiliyor.

create index programs_current_version_id_idx on public.programs (current_version_id);
create index workout_sessions_program_version_id_idx on public.workout_sessions (program_version_id);
create index workout_sessions_program_day_id_idx on public.workout_sessions (program_day_id);
create index personal_records_exercise_id_idx on public.personal_records (exercise_id);
create index personal_records_workout_set_id_idx on public.personal_records (workout_set_id);
