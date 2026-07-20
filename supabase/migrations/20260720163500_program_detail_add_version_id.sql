-- Implements: TRN-02/03
-- PRD: §06-training.md "Programlar", "Canlı antrenman"
--
-- DÜZELTME: `program_detail()` `start_workout_session()`'ın ihtiyaç duyduğu
-- `program_version_id`'yi döndürmüyordu — program-detail.tsx ekranı
-- "Başlat" butonunda hangi versiyonu başlatacağını bilemezdi. Dönüş tipi
-- değiştiği için (yeni kolon) CREATE OR REPLACE yetmez, önce DROP gerekir.

drop function public.program_detail(uuid, text);

create or replace function public.program_detail(target_program_id uuid, preferred_locale text default 'tr')
returns table (
  program_id uuid,
  program_version_id uuid,
  name text,
  is_template boolean,
  is_own boolean,
  weeks smallint,
  days jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with cv as (
    select p.id as program_id, p.name, p.is_template, (p.owner_id = (select auth.uid())) as is_own,
           pv.id as version_id, pv.weeks
    from public.programs p
    join public.program_versions pv on pv.id = p.current_version_id
    where p.id = target_program_id
      and (p.owner_id is null or p.owner_id = (select auth.uid()))
      and p.deleted_at is null
  )
  select
    cv.program_id,
    cv.version_id,
    cv.name,
    cv.is_template,
    cv.is_own,
    cv.weeks,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'dayId', pd.id,
            'weekNumber', pd.week_number,
            'dayIndex', pd.day_index,
            'name', pd.name,
            'isDeload', pd.is_deload,
            'exercises', (
              select coalesce(jsonb_agg(
                jsonb_build_object(
                  'programExerciseId', pe.id,
                  'exerciseId', pe.exercise_id,
                  'exerciseName', coalesce(
                    (select et.name from catalog.exercise_translations et
                     where et.exercise_id = pe.exercise_id and et.locale = preferred_locale),
                    (select et.name from catalog.exercise_translations et
                     where et.exercise_id = pe.exercise_id limit 1)
                  ),
                  'orderIndex', pe.order_index,
                  'supersetGroup', pe.superset_group,
                  'targetSets', pe.target_sets,
                  'notes', pe.notes
                )
                order by pe.order_index
              ), '[]'::jsonb)
              from public.program_exercises pe
              where pe.program_day_id = pd.id
            )
          )
          order by pd.week_number, pd.day_index
        )
        from public.program_days pd
        where pd.program_version_id = cv.version_id
      ),
      '[]'::jsonb
    )
  from cv
$$;

comment on function public.program_detail is
  'Bir programın güncel sürümü: günler + egzersizler (tam, salt okunur), program_version_id dahil (canlı antrenman başlatmak için). RLS çağıranın izniyle uygulanır.';

revoke execute on function public.program_detail(uuid, text) from public;
revoke execute on function public.program_detail(uuid, text) from anon;
grant execute on function public.program_detail(uuid, text) to authenticated;
