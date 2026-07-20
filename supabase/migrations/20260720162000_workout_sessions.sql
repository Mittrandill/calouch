-- Implements: TRN-03
-- PRD: §06-training.md "Canlı antrenman", "Hesaplamalar"
--
-- Antrenman session/set kayıtları. meal_entries ile AYNI "RPC-only yazma"
-- deseni: istemcinin bu üç tabloda hiç INSERT/UPDATE policy'si/GRANT'i yok,
-- tüm mutasyonlar workout_functions.sql'deki SECURITY DEFINER RPC'lerden
-- geçer (start/complete_set/update_set/delete_set/finish/abandon).
--
-- KAPSAM DIŞI (bilinçli, docs/prd/14-open-decisions.md'deki "tam offline
-- outbox kapsam dışı" kararıyla aynı gerekçe — kullanıcı onayıyla):
--   * SQLite tabanlı istemci kuyruğu / app-kill sonrası kurtarma. Bu
--     migration yalnız SUNUCU tarafı idempotency'yi (operation_id) sağlar.
--   * PR tarihçesi — personal_records yalnız GÜNCEL rekoru tutar (upsert),
--     ayrı bir "pr_history" tablosu yok.

-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- İkisi de null = serbest antrenman (program dışı).
  program_version_id uuid references public.program_versions (id),
  program_day_id uuid references public.program_days (id),

  operation_id uuid not null unique,
  status text not null default 'active',

  started_at timestamptz not null default now(),
  ended_at timestamptz,

  -- finish_workout_session() tarafından tek seferlik hesaplanıp DONDURULUR
  -- (§03/§09 snapshot ilkesiyle aynı fikir — sonradan katalog/egzersiz MET
  -- değeri değişse bile geçmiş antrenmanın kalorisi değişmez).
  total_volume_kg numeric(10, 2),
  total_calories_kcal numeric(7, 2),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workout_sessions_status_valid check (status in ('active', 'completed', 'abandoned')),
  constraint workout_sessions_ended_after_started check (ended_at is null or ended_at >= started_at)
);

create index workout_sessions_user_id_started_at_idx
  on public.workout_sessions (user_id, started_at desc);
-- Tek-aktif-session invariant'ının hızlı kontrolü (start_workout_session).
create index workout_sessions_active_idx
  on public.workout_sessions (user_id) where status = 'active';

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references catalog.exercises (id),

  operation_id uuid not null unique,
  set_number smallint not null,
  order_index smallint not null,

  reps integer,
  weight_kg numeric(6, 2),
  is_bodyweight boolean not null default false,
  is_warmup boolean not null default false,
  is_dropset boolean not null default false,

  rpe numeric(3, 1),
  rir smallint,

  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint workout_sets_reps_nonneg check (reps is null or reps >= 0),
  constraint workout_sets_weight_nonneg check (weight_kg is null or weight_kg >= 0),
  constraint workout_sets_rpe_range check (rpe is null or (rpe >= 1 and rpe <= 10)),
  constraint workout_sets_rir_range check (rir is null or (rir >= 0 and rir <= 5)),
  constraint workout_sets_set_number_positive check (set_number > 0)
);

create index workout_sets_session_id_idx on public.workout_sets (session_id);
create index workout_sets_exercise_id_idx on public.workout_sets (exercise_id);

-- ---------------------------------------------------------------------------
-- personal_records — yalnız GÜNCEL rekor (bkz. üstteki KAPSAM DIŞI notu).
-- Aynı zamanda "önceki performans" karşılaştırma kaynağıdır.
-- ---------------------------------------------------------------------------
create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references catalog.exercises (id),

  record_type text not null,
  value numeric(10, 2) not null,
  -- Rekoru yapan set — audit/"nereden geldi" izlenebilirliği.
  workout_set_id uuid references public.workout_sets (id),

  achieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint personal_records_type_valid
    check (record_type in ('max_weight', 'max_reps', 'max_volume', 'estimated_1rm')),
  constraint personal_records_value_positive check (value > 0),
  constraint personal_records_unique_current unique (user_id, exercise_id, record_type)
);

create index personal_records_user_id_idx on public.personal_records (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.personal_records enable row level security;

alter table public.workout_sessions force row level security;
alter table public.workout_sets force row level security;
alter table public.personal_records force row level security;

create policy "workout_sessions_select_own" on public.workout_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "workout_sets_select_own" on public.workout_sets
  for select to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_sets.session_id and s.user_id = (select auth.uid())
    )
  );

create policy "personal_records_select_own" on public.personal_records
  for select to authenticated
  using (user_id = (select auth.uid()));

-- INSERT/UPDATE/DELETE policy'si YOK: session başlatma/set kaydı/bitirme/
-- PR güncellemesi tamamı workout_functions.sql'deki SECURITY DEFINER
-- RPC'lerden geçer — meal_entries'ten FARKLI olarak burada meta-alan
-- düzenlemesi için bile bir client UPDATE yolu bilinçli olarak açılmadı
-- (finish/abandon RPC'leri session durumunu zaten kapsıyor).

grant select on public.workout_sessions to authenticated;
grant select on public.workout_sets to authenticated;
grant select on public.personal_records to authenticated;

revoke insert, update, delete on public.workout_sessions from authenticated;
revoke insert, update, delete on public.workout_sets from authenticated;
revoke insert, update, delete on public.personal_records from authenticated;

revoke all on public.workout_sessions, public.workout_sets, public.personal_records from anon;
