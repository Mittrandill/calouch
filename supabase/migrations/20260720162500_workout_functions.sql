-- Implements: TRN-03
-- PRD: §06-training.md "Canlı antrenman", "Dinlenme sayacı", "Hesaplamalar"
--
-- Canlı antrenman mutasyonlarının TEK yazma yolu (log_meal()/save_recipe()
-- ile aynı idempotency + ownership-check deseni). Dinlenme sayacının kendisi
-- (mutlak `ends_at`) sunucu durumu gerektirmez — tamamen istemci tarafında,
-- `RestTimer` bileşeninde hesaplanır (bkz. plan).

-- ---------------------------------------------------------------------------
-- start_workout_session
-- ---------------------------------------------------------------------------
create or replace function public.start_workout_session(
  p_operation_id uuid,
  p_program_version_id uuid default null,
  p_program_day_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_program_visible boolean;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select id into v_session_id
  from public.workout_sessions
  where operation_id = p_operation_id and user_id = v_user_id;

  if v_session_id is not null then
    return v_session_id;
  end if;

  -- Tek-aktif-session invariant'ı: zaten aktif bir antrenman varsa yenisini
  -- AÇMAZ, mevcut olanı döner (uygulama yeniden açılışında güvenli).
  select id into v_session_id
  from public.workout_sessions
  where user_id = v_user_id and status = 'active';

  if v_session_id is not null then
    return v_session_id;
  end if;

  if p_program_version_id is not null then
    select exists(
      select 1 from public.program_versions pv
      join public.programs p on p.id = pv.program_id
      where pv.id = p_program_version_id and (p.owner_id is null or p.owner_id = v_user_id)
    ) into v_program_visible;

    if not v_program_visible then
      raise exception 'Program bulunamadı veya erişilemiyor: %', p_program_version_id using errcode = '22023';
    end if;

    if p_program_day_id is not null then
      if not exists (
        select 1 from public.program_days
        where id = p_program_day_id and program_version_id = p_program_version_id
      ) then
        raise exception 'Gün bu program sürümüne ait değil: %', p_program_day_id using errcode = '22023';
      end if;
    end if;
  end if;

  insert into public.workout_sessions (user_id, program_version_id, program_day_id, operation_id)
  values (v_user_id, p_program_version_id, p_program_day_id, p_operation_id)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

comment on function public.start_workout_session is
  'Antrenman başlatma. Zaten aktif bir session varsa onu döner (yeni açmaz). p_program_version_id null = serbest antrenman.';

revoke execute on function public.start_workout_session(uuid, uuid, uuid) from public;
revoke execute on function public.start_workout_session(uuid, uuid, uuid) from anon;
grant execute on function public.start_workout_session(uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_set
-- ---------------------------------------------------------------------------
create or replace function public.complete_set(
  p_operation_id uuid,
  p_session_id uuid,
  p_exercise_id uuid,
  p_set_number integer,
  p_order_index integer,
  p_reps integer default null,
  p_weight_kg numeric default null,
  p_is_bodyweight boolean default false,
  p_is_warmup boolean default false,
  p_is_dropset boolean default false,
  p_rpe numeric default null,
  p_rir integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_set_id uuid;
  v_session_status text;
  v_exercise_visible boolean;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select ws.id into v_set_id
  from public.workout_sets ws
  join public.workout_sessions s on s.id = ws.session_id
  where ws.operation_id = p_operation_id and s.user_id = v_user_id;

  if v_set_id is not null then
    return v_set_id;
  end if;

  select status into v_session_status
  from public.workout_sessions
  where id = p_session_id and user_id = v_user_id;

  if v_session_status is null then
    raise exception 'Antrenman bulunamadı veya erişilemiyor: %', p_session_id using errcode = '22023';
  end if;

  if v_session_status <> 'active' then
    raise exception 'Antrenman aktif değil, set eklenemez' using errcode = '22023';
  end if;

  -- SECURITY DEFINER RLS'i bypass eder — açık owner_id kontrolü.
  select exists(
    select 1 from catalog.exercises
    where id = p_exercise_id and (owner_id is null or owner_id = v_user_id)
  ) into v_exercise_visible;

  if not v_exercise_visible then
    raise exception 'Egzersiz bulunamadı veya erişilemiyor: %', p_exercise_id using errcode = '22023';
  end if;

  insert into public.workout_sets (
    session_id, exercise_id, operation_id, set_number, order_index,
    reps, weight_kg, is_bodyweight, is_warmup, is_dropset, rpe, rir
  ) values (
    p_session_id, p_exercise_id, p_operation_id, p_set_number, p_order_index,
    p_reps, p_weight_kg, p_is_bodyweight, p_is_warmup, p_is_dropset, p_rpe, p_rir
  )
  returning id into v_set_id;

  return v_set_id;
end;
$$;

comment on function public.complete_set is
  'Bir seti tamamlanmış olarak kaydeder (yalnız aktif session). operation_id ile idempotent — aynı offline mutasyon iki kez uygulanmaz.';

revoke execute on function public.complete_set(uuid, uuid, uuid, integer, integer, integer, numeric, boolean, boolean, boolean, numeric, integer) from public;
revoke execute on function public.complete_set(uuid, uuid, uuid, integer, integer, integer, numeric, boolean, boolean, boolean, numeric, integer) from anon;
grant execute on function public.complete_set(uuid, uuid, uuid, integer, integer, integer, numeric, boolean, boolean, boolean, numeric, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- update_set / delete_set — yalnız aktif session'daki kendi seti.
-- ---------------------------------------------------------------------------
create or replace function public.update_set(
  p_set_id uuid,
  p_reps integer default null,
  p_weight_kg numeric default null,
  p_rpe numeric default null,
  p_rir integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select s.status into v_status
  from public.workout_sets ws
  join public.workout_sessions s on s.id = ws.session_id
  where ws.id = p_set_id and s.user_id = v_user_id;

  if v_status is null then
    raise exception 'Set bulunamadı veya erişilemiyor: %', p_set_id using errcode = '22023';
  end if;

  if v_status <> 'active' then
    raise exception 'Antrenman tamamlanmış, set düzenlenemez' using errcode = '22023';
  end if;

  update public.workout_sets
  set
    reps = coalesce(p_reps, reps),
    weight_kg = coalesce(p_weight_kg, weight_kg),
    rpe = coalesce(p_rpe, rpe),
    rir = coalesce(p_rir, rir),
    updated_at = now()
  where id = p_set_id;
end;
$$;

revoke execute on function public.update_set(uuid, integer, numeric, numeric, integer) from public;
revoke execute on function public.update_set(uuid, integer, numeric, numeric, integer) from anon;
grant execute on function public.update_set(uuid, integer, numeric, numeric, integer) to authenticated;

create or replace function public.delete_set(p_set_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select s.status into v_status
  from public.workout_sets ws
  join public.workout_sessions s on s.id = ws.session_id
  where ws.id = p_set_id and s.user_id = v_user_id;

  if v_status is null then
    raise exception 'Set bulunamadı veya erişilemiyor: %', p_set_id using errcode = '22023';
  end if;

  if v_status <> 'active' then
    raise exception 'Antrenman tamamlanmış, set silinemez' using errcode = '22023';
  end if;

  delete from public.workout_sets where id = p_set_id;
end;
$$;

revoke execute on function public.delete_set(uuid) from public;
revoke execute on function public.delete_set(uuid) from anon;
grant execute on function public.delete_set(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- abandon_workout_session
-- ---------------------------------------------------------------------------
create or replace function public.abandon_workout_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  update public.workout_sessions
  set status = 'abandoned', ended_at = now(), updated_at = now()
  where id = p_session_id and user_id = v_user_id and status = 'active';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Antrenman bulunamadı veya zaten bitmiş: %', p_session_id using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.abandon_workout_session(uuid) from public;
revoke execute on function public.abandon_workout_session(uuid) from anon;
grant execute on function public.abandon_workout_session(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- finish_workout_session — TEK TRANSACTION: hacim + MET-tabanlı kalori + PR
-- tespiti + session kapama. PRD kabul kriteri "Session completion, setler,
-- hacim ve PR transaction'ı atomiktir" — fonksiyon çağrısının kendisi zaten
-- tek bir transaction'dır (plpgsql fonksiyon gövdesi kendi COMMIT'ini
-- yapmaz), ekstra kilitleme gerekmez.
--
-- VARSAYIMLAR (açıkça belgelenir, tahmin/yaklaşıklık):
--   * Hacim/kalori formüllerinde bodyweight set'lerde (weight_kg null)
--     kullanıcının profil kilosu ağırlık olarak kullanılır.
--   * Kalori: ortalama MET (bu session'daki ısınma-dışı setlerin egzersiz
--     MET değerlerinin ortalaması) × kilo(kg) × süre(saat). Sürekli/gerçek
--     zamanlı set-bazında süre TAKİP EDİLMEDİĞİ için bu bir yaklaşıklıktır
--     (aynı formül packages/activity-engine/src/calorieBurn.ts'te TS olarak
--     da belgelenir/test edilir — canlı ekrandaki anlık tahmin için).
--   * Profil kilosu yoksa kalori hesaplanmaz (null) — rastgele bir varsayılan
--     kiloyla YANLIŞ bir sayı üretmek yerine "hesaplanamadı" dürüstçe
--     gösterilir (bkz. Bugün ekranındaki "Hedef henüz belirlenmedi" deseni).
-- ---------------------------------------------------------------------------
create or replace function public.finish_workout_session(p_session_id uuid)
returns table (
  session_id uuid,
  total_volume_kg numeric,
  total_calories_kcal numeric,
  duration_seconds integer,
  new_personal_records jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_started_at timestamptz;
  v_status text;
  v_ended_at timestamptz := now();
  v_weight_kg numeric;
  v_duration_hours numeric;
  v_avg_met numeric;
  v_total_volume numeric;
  v_total_calories numeric;
  v_exercise_id uuid;
  v_exercise_name text;
  v_candidate_value numeric;
  v_candidate_set_id uuid;
  v_existing_value numeric;
  v_new_records jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Oturum gerekli' using errcode = '28000';
  end if;

  select s.started_at, s.status into v_started_at, v_status
  from public.workout_sessions s
  where s.id = p_session_id and s.user_id = v_user_id;

  if v_started_at is null then
    raise exception 'Antrenman bulunamadı veya erişilemiyor: %', p_session_id using errcode = '22023';
  end if;

  -- Zaten bitmişse (idempotent yeniden çağrı) mevcut sonucu tekrar döner.
  if v_status <> 'active' then
    return query
      select s.id, s.total_volume_kg, s.total_calories_kcal,
             extract(epoch from (s.ended_at - s.started_at))::integer, '[]'::jsonb
      from public.workout_sessions s where s.id = p_session_id;
    return;
  end if;

  select p.weight_kg into v_weight_kg from public.profiles p where p.id = v_user_id;

  v_duration_hours := greatest(extract(epoch from (v_ended_at - v_started_at)) / 3600.0, 0);

  select sum(ws.reps * coalesce(ws.weight_kg, v_weight_kg, 0))
  into v_total_volume
  from public.workout_sets ws
  where ws.session_id = p_session_id and not ws.is_warmup and ws.reps is not null;

  select avg(e.met_value) into v_avg_met
  from public.workout_sets ws
  join catalog.exercises e on e.id = ws.exercise_id
  where ws.session_id = p_session_id and not ws.is_warmup;

  if v_weight_kg is not null and v_avg_met is not null and v_duration_hours > 0 then
    v_total_calories := round(v_avg_met * v_weight_kg * v_duration_hours, 2);
  else
    v_total_calories := null;
  end if;

  -- PR tespiti: bu session'da çalışılan her egzersiz için 4 tip, yalnız
  -- ÖNCEKİ rekoru geçtiyse (veya hiç yoksa) personal_records'a upsert edilir.
  for v_exercise_id in
    select distinct ws.exercise_id from public.workout_sets ws
    where ws.session_id = p_session_id and not ws.is_warmup
  loop
    v_exercise_name := coalesce(
      (select et.name from catalog.exercise_translations et where et.exercise_id = v_exercise_id and et.locale = 'tr'),
      (select et.name from catalog.exercise_translations et where et.exercise_id = v_exercise_id limit 1)
    );

    -- max_weight: yalnız gerçek dış yük (bodyweight ikamesi YOK).
    select ws.weight_kg, ws.id into v_candidate_value, v_candidate_set_id
    from public.workout_sets ws
    where ws.session_id = p_session_id and ws.exercise_id = v_exercise_id
      and not ws.is_warmup and ws.weight_kg is not null
    order by ws.weight_kg desc limit 1;

    if v_candidate_value is not null then
      select value into v_existing_value from public.personal_records
        where user_id = v_user_id and exercise_id = v_exercise_id and record_type = 'max_weight';
      if v_existing_value is null or v_candidate_value > v_existing_value then
        insert into public.personal_records (user_id, exercise_id, record_type, value, workout_set_id, achieved_at)
        values (v_user_id, v_exercise_id, 'max_weight', v_candidate_value, v_candidate_set_id, v_ended_at)
        on conflict (user_id, exercise_id, record_type)
        do update set value = excluded.value, workout_set_id = excluded.workout_set_id,
                       achieved_at = excluded.achieved_at, updated_at = now();
        v_new_records := v_new_records || jsonb_build_object(
          'exerciseId', v_exercise_id, 'exerciseName', v_exercise_name,
          'recordType', 'max_weight', 'value', v_candidate_value
        );
      end if;
    end if;

    -- max_reps
    select ws.reps, ws.id into v_candidate_value, v_candidate_set_id
    from public.workout_sets ws
    where ws.session_id = p_session_id and ws.exercise_id = v_exercise_id
      and not ws.is_warmup and ws.reps is not null
    order by ws.reps desc limit 1;

    if v_candidate_value is not null then
      select value into v_existing_value from public.personal_records
        where user_id = v_user_id and exercise_id = v_exercise_id and record_type = 'max_reps';
      if v_existing_value is null or v_candidate_value > v_existing_value then
        insert into public.personal_records (user_id, exercise_id, record_type, value, workout_set_id, achieved_at)
        values (v_user_id, v_exercise_id, 'max_reps', v_candidate_value, v_candidate_set_id, v_ended_at)
        on conflict (user_id, exercise_id, record_type)
        do update set value = excluded.value, workout_set_id = excluded.workout_set_id,
                       achieved_at = excluded.achieved_at, updated_at = now();
        v_new_records := v_new_records || jsonb_build_object(
          'exerciseId', v_exercise_id, 'exerciseName', v_exercise_name,
          'recordType', 'max_reps', 'value', v_candidate_value
        );
      end if;
    end if;

    -- max_volume: en iyi TEK set (reps × ağırlık, bodyweight ikameli).
    select (ws.reps * coalesce(ws.weight_kg, v_weight_kg)), ws.id into v_candidate_value, v_candidate_set_id
    from public.workout_sets ws
    where ws.session_id = p_session_id and ws.exercise_id = v_exercise_id
      and not ws.is_warmup and ws.reps is not null and coalesce(ws.weight_kg, v_weight_kg) is not null
    order by (ws.reps * coalesce(ws.weight_kg, v_weight_kg)) desc limit 1;

    if v_candidate_value is not null then
      select value into v_existing_value from public.personal_records
        where user_id = v_user_id and exercise_id = v_exercise_id and record_type = 'max_volume';
      if v_existing_value is null or v_candidate_value > v_existing_value then
        insert into public.personal_records (user_id, exercise_id, record_type, value, workout_set_id, achieved_at)
        values (v_user_id, v_exercise_id, 'max_volume', v_candidate_value, v_candidate_set_id, v_ended_at)
        on conflict (user_id, exercise_id, record_type)
        do update set value = excluded.value, workout_set_id = excluded.workout_set_id,
                       achieved_at = excluded.achieved_at, updated_at = now();
        v_new_records := v_new_records || jsonb_build_object(
          'exerciseId', v_exercise_id, 'exerciseName', v_exercise_name,
          'recordType', 'max_volume', 'value', v_candidate_value
        );
      end if;
    end if;

    -- estimated_1rm: Epley formülü, weight × (1 + reps/30).
    select (coalesce(ws.weight_kg, v_weight_kg) * (1 + ws.reps / 30.0)), ws.id
    into v_candidate_value, v_candidate_set_id
    from public.workout_sets ws
    where ws.session_id = p_session_id and ws.exercise_id = v_exercise_id
      and not ws.is_warmup and ws.reps is not null and ws.reps > 0
      and coalesce(ws.weight_kg, v_weight_kg) is not null
    order by (coalesce(ws.weight_kg, v_weight_kg) * (1 + ws.reps / 30.0)) desc limit 1;

    if v_candidate_value is not null then
      select value into v_existing_value from public.personal_records
        where user_id = v_user_id and exercise_id = v_exercise_id and record_type = 'estimated_1rm';
      if v_existing_value is null or v_candidate_value > v_existing_value then
        insert into public.personal_records (user_id, exercise_id, record_type, value, workout_set_id, achieved_at)
        values (v_user_id, v_exercise_id, 'estimated_1rm', round(v_candidate_value, 2), v_candidate_set_id, v_ended_at)
        on conflict (user_id, exercise_id, record_type)
        do update set value = excluded.value, workout_set_id = excluded.workout_set_id,
                       achieved_at = excluded.achieved_at, updated_at = now();
        v_new_records := v_new_records || jsonb_build_object(
          'exerciseId', v_exercise_id, 'exerciseName', v_exercise_name,
          'recordType', 'estimated_1rm', 'value', round(v_candidate_value, 2)
        );
      end if;
    end if;
  end loop;

  update public.workout_sessions
  set status = 'completed', ended_at = v_ended_at,
      total_volume_kg = v_total_volume, total_calories_kcal = v_total_calories,
      updated_at = now()
  where id = p_session_id;

  return query
    select p_session_id, v_total_volume, v_total_calories,
           extract(epoch from (v_ended_at - v_started_at))::integer, v_new_records;
end;
$$;

comment on function public.finish_workout_session is
  'Antrenmanı bitirir: hacim + MET-tabanlı tahmini kalori + PR tespiti tek transaction''da hesaplanır ve donar. İdempotent: zaten bitmiş bir session için mevcut sonucu tekrar döner.';

revoke execute on function public.finish_workout_session(uuid) from public;
revoke execute on function public.finish_workout_session(uuid) from anon;
grant execute on function public.finish_workout_session(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Okuma fonksiyonları (security invoker, RLS çağıranın izniyle uygulanır).
-- ---------------------------------------------------------------------------
create or replace function public.active_workout_session()
returns table (
  session_id uuid,
  program_version_id uuid,
  program_day_id uuid,
  started_at timestamptz,
  program_name text,
  day_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, s.program_version_id, s.program_day_id, s.started_at, p.name, pd.name
  from public.workout_sessions s
  left join public.program_versions pv on pv.id = s.program_version_id
  left join public.programs p on p.id = pv.program_id
  left join public.program_days pd on pd.id = s.program_day_id
  where s.user_id = (select auth.uid()) and s.status = 'active'
  order by s.started_at desc
  limit 1
$$;

revoke execute on function public.active_workout_session() from public;
revoke execute on function public.active_workout_session() from anon;
grant execute on function public.active_workout_session() to authenticated;

create or replace function public.list_workout_sessions(limit_count integer default 50)
returns table (
  session_id uuid,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  total_volume_kg numeric,
  total_calories_kcal numeric,
  program_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, s.status, s.started_at, s.ended_at, s.total_volume_kg, s.total_calories_kcal, p.name
  from public.workout_sessions s
  left join public.program_versions pv on pv.id = s.program_version_id
  left join public.programs p on p.id = pv.program_id
  where s.user_id = (select auth.uid())
  order by s.started_at desc
  limit limit_count
$$;

revoke execute on function public.list_workout_sessions(integer) from public;
revoke execute on function public.list_workout_sessions(integer) from anon;
grant execute on function public.list_workout_sessions(integer) to authenticated;

create or replace function public.workout_session_detail(target_session_id uuid, preferred_locale text default 'tr')
returns table (
  session_id uuid,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  total_volume_kg numeric,
  total_calories_kcal numeric,
  program_name text,
  day_name text,
  sets jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id, s.status, s.started_at, s.ended_at, s.total_volume_kg, s.total_calories_kcal,
    p.name, pd.name,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'setId', ws.id,
            'exerciseId', ws.exercise_id,
            'exerciseName', coalesce(
              (select et.name from catalog.exercise_translations et
               where et.exercise_id = ws.exercise_id and et.locale = preferred_locale),
              (select et.name from catalog.exercise_translations et
               where et.exercise_id = ws.exercise_id limit 1)
            ),
            'setNumber', ws.set_number,
            'orderIndex', ws.order_index,
            'reps', ws.reps,
            'weightKg', ws.weight_kg,
            'isBodyweight', ws.is_bodyweight,
            'isWarmup', ws.is_warmup,
            'isDropset', ws.is_dropset,
            'rpe', ws.rpe,
            'rir', ws.rir,
            'completedAt', ws.completed_at
          )
          order by ws.order_index
        )
        from public.workout_sets ws
        where ws.session_id = s.id
      ),
      '[]'::jsonb
    )
  from public.workout_sessions s
  left join public.program_versions pv on pv.id = s.program_version_id
  left join public.programs p on p.id = pv.program_id
  left join public.program_days pd on pd.id = s.program_day_id
  where s.id = target_session_id and s.user_id = (select auth.uid())
$$;

revoke execute on function public.workout_session_detail(uuid, text) from public;
revoke execute on function public.workout_session_detail(uuid, text) from anon;
grant execute on function public.workout_session_detail(uuid, text) to authenticated;
