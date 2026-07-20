-- Implements: TRN-02
-- PRD: §06-training.md "Programlar"
--
-- Program kaydının/düzenlemesinin TEK yazma yolu — save_recipe() ile birebir
-- aynı iskelet ve gerekçe (§09 atomiklik: program + versiyon + gün +
-- egzersiz çoklu-tablo yazması client'a bırakılmaz).
--
-- p_days beklenen şekil (jsonb dizi):
--   [{ "weekNumber": 1, "dayIndex": 0, "name": "Push Day", "isDeload": false,
--      "exercises": [{ "exerciseId": "...", "orderIndex": 0,
--        "supersetGroup": null, "notes": null,
--        "targetSets": [{ "setNumber": 1, "targetReps": 8,
--          "targetWeightKg": 60, "isWarmup": false, "isDropset": false,
--          "restSeconds": 90 }, ...] }, ...] }, ...]

create or replace function public.save_program(
  p_operation_id uuid,
  p_name text,
  p_weeks integer,
  p_days jsonb,
  p_program_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_program_id uuid;
  v_version_id uuid;
  v_version_number integer;
  v_day jsonb;
  v_day_id uuid;
  v_exercise jsonb;
  v_exercise_id uuid;
  v_exercise_owned boolean;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  -- Aynı operation_id daha önce işlendiyse (ilk oluşturma VEYA bir
  -- düzenleme), yeni sürüm YARATMADAN o sürümün programını döner. Yalnız
  -- çağıranın SAHİP OLDUĞU programlara bakar (şablonlar owner_id null'dur,
  -- save_program şablon üzerinde asla çalışmaz — bkz. copy_program).
  select p.id into v_program_id
  from public.program_versions pv
  join public.programs p on p.id = pv.program_id
  where pv.operation_id = p_operation_id and p.owner_id = v_user_id;

  if v_program_id is not null then
    return v_program_id;
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Program adı gerekli' using errcode = '22023';
  end if;

  if p_weeks is null or p_weeks <= 0 then
    raise exception 'Geçersiz hafta sayısı: %', p_weeks using errcode = '22023';
  end if;

  if p_days is null or jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) = 0 then
    raise exception 'En az bir gün gerekli' using errcode = '22023';
  end if;

  if p_program_id is null then
    insert into public.programs (owner_id, name) values (v_user_id, p_name)
    returning id into v_program_id;
    v_version_number := 1;
  else
    select id into v_program_id
    from public.programs
    where id = p_program_id and owner_id = v_user_id and deleted_at is null;

    if v_program_id is null then
      raise exception 'Program bulunamadı veya erişilemiyor: %', p_program_id using errcode = '22023';
    end if;

    update public.programs set name = p_name, updated_at = now() where id = v_program_id;

    select coalesce(max(version_number), 0) + 1 into v_version_number
    from public.program_versions where program_id = v_program_id;
  end if;

  insert into public.program_versions (program_id, version_number, weeks, operation_id)
  values (v_program_id, v_version_number, p_weeks, p_operation_id)
  returning id into v_version_id;

  for v_day in select * from jsonb_array_elements(p_days)
  loop
    insert into public.program_days (program_version_id, week_number, day_index, name, is_deload)
    values (
      v_version_id,
      coalesce((v_day ->> 'weekNumber')::smallint, 1),
      (v_day ->> 'dayIndex')::smallint,
      v_day ->> 'name',
      coalesce((v_day ->> 'isDeload')::boolean, false)
    )
    returning id into v_day_id;

    for v_exercise in select * from jsonb_array_elements(coalesce(v_day -> 'exercises', '[]'::jsonb))
    loop
      v_exercise_id := (v_exercise ->> 'exerciseId')::uuid;

      -- SECURITY DEFINER RLS'i bypass eder — açık owner_id kontrolü
      -- (log_meal_function.sql / recipe_functions.sql'deki aynı ders).
      select exists(
        select 1 from catalog.exercises
        where id = v_exercise_id and (owner_id is null or owner_id = v_user_id)
      ) into v_exercise_owned;

      if not v_exercise_owned then
        raise exception 'Egzersiz bulunamadı veya erişilemiyor: %', v_exercise_id using errcode = '22023';
      end if;

      insert into public.program_exercises (
        program_day_id, exercise_id, order_index, superset_group, target_sets, notes
      ) values (
        v_day_id,
        v_exercise_id,
        coalesce((v_exercise ->> 'orderIndex')::smallint, 0),
        (v_exercise ->> 'supersetGroup')::smallint,
        coalesce(v_exercise -> 'targetSets', '[]'::jsonb),
        v_exercise ->> 'notes'
      );
    end loop;
  end loop;

  update public.programs set current_version_id = v_version_id, updated_at = now()
  where id = v_program_id;

  return v_program_id;
end;
$$;

comment on function public.save_program is
  'Program oluşturma/düzenleme tek yazma yolu (§09 atomiklik). p_program_id null ise yeni program, doluysa var olan (sahip olunan) programa yeni sürüm ekler.';

revoke execute on function public.save_program(uuid, text, integer, jsonb, uuid) from public;
revoke execute on function public.save_program(uuid, text, integer, jsonb, uuid) from anon;
grant execute on function public.save_program(uuid, text, integer, jsonb, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- copy_program — "Program kopyalanabilir." Kaynak sahibinin kendi programı
-- OLMASI gerekmez (şablon dahil, RLS zaten görünürlüğü sağlıyor); kopya
-- HER ZAMAN çağıranın kendi owner_id'siyle, bağımsız yeni bir programdır.
-- ---------------------------------------------------------------------------
create or replace function public.copy_program(p_operation_id uuid, p_source_program_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_visible boolean;
  v_source_name text;
  v_source_version_id uuid;
  v_source_weeks smallint;
  v_new_program_id uuid;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select p.id is not null into v_source_visible
  from public.programs p
  where p.id = p_source_program_id
    and (p.owner_id is null or p.owner_id = v_user_id)
    and p.deleted_at is null;

  if not coalesce(v_source_visible, false) then
    raise exception 'Program bulunamadı veya erişilemiyor: %', p_source_program_id using errcode = '22023';
  end if;

  -- Aynı operation_id daha önce işlendiyse mevcut kopyayı döner.
  select p.id into v_new_program_id
  from public.program_versions pv
  join public.programs p on p.id = pv.program_id
  where pv.operation_id = p_operation_id and p.owner_id = v_user_id;

  if v_new_program_id is not null then
    return v_new_program_id;
  end if;

  select p.name, p.current_version_id, pv.weeks
  into v_source_name, v_source_version_id, v_source_weeks
  from public.programs p
  join public.program_versions pv on pv.id = p.current_version_id
  where p.id = p_source_program_id;

  insert into public.programs (owner_id, name) values (v_user_id, v_source_name)
  returning id into v_new_program_id;

  insert into public.program_versions (program_id, version_number, weeks, operation_id)
  values (v_new_program_id, 1, v_source_weeks, p_operation_id);

  -- Günleri + egzersizleri kaynağın GÜNCEL versiyonundan kopyala.
  with new_days as (
    insert into public.program_days (program_version_id, week_number, day_index, name, is_deload)
    select (select id from public.program_versions where program_id = v_new_program_id),
           week_number, day_index, name, is_deload
    from public.program_days
    where program_version_id = v_source_version_id
    returning id, week_number, day_index
  )
  insert into public.program_exercises (program_day_id, exercise_id, order_index, superset_group, target_sets, notes)
  select nd.id, pe.exercise_id, pe.order_index, pe.superset_group, pe.target_sets, pe.notes
  from public.program_exercises pe
  join public.program_days pd on pd.id = pe.program_day_id
  join new_days nd on nd.week_number = pd.week_number and nd.day_index = pd.day_index
  where pd.program_version_id = v_source_version_id;

  update public.programs
  set current_version_id = (select id from public.program_versions where program_id = v_new_program_id),
      updated_at = now()
  where id = v_new_program_id;

  return v_new_program_id;
end;
$$;

comment on function public.copy_program is
  'Var olan (kendi veya şablon) bir programın güncel sürümünü çağıranın kendi, bağımsız yeni programı olarak kopyalar.';

revoke execute on function public.copy_program(uuid, uuid) from public;
revoke execute on function public.copy_program(uuid, uuid) from anon;
grant execute on function public.copy_program(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- list_programs — kendi programları + hazır şablonlar (özet).
-- ---------------------------------------------------------------------------
create or replace function public.list_programs()
returns table (
  program_id uuid,
  name text,
  is_template boolean,
  is_own boolean,
  weeks smallint,
  day_count bigint,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.is_template,
    (p.owner_id = (select auth.uid())),
    pv.weeks,
    (select count(*) from public.program_days pd where pd.program_version_id = pv.id),
    p.updated_at
  from public.programs p
  join public.program_versions pv on pv.id = p.current_version_id
  where (p.owner_id is null or p.owner_id = (select auth.uid())) and p.deleted_at is null
  order by p.is_template asc, p.updated_at desc
$$;

comment on function public.list_programs is
  'Çağıranın kendi programları + hazır şablonlar (özet). SECURITY INVOKER + RLS.';

revoke execute on function public.list_programs() from public;
revoke execute on function public.list_programs() from anon;
grant execute on function public.list_programs() to authenticated;

-- ---------------------------------------------------------------------------
-- program_detail — günler + egzersizler (tam, salt okunur görünüm).
-- ---------------------------------------------------------------------------
create or replace function public.program_detail(target_program_id uuid, preferred_locale text default 'tr')
returns table (
  program_id uuid,
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
  'Bir programın güncel sürümü: günler + egzersizler (tam, salt okunur). RLS çağıranın izniyle uygulanır.';

revoke execute on function public.program_detail(uuid, text) from public;
revoke execute on function public.program_detail(uuid, text) from anon;
grant execute on function public.program_detail(uuid, text) to authenticated;
