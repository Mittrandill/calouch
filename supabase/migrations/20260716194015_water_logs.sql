-- Implements: MVP-06
-- PRD: §14 (03-nutrition-core.md §"Su takibi"), §09
--
-- Su takibi. §03: "Günlük hedef, tek dokunuş, özel bardak, son kullanılan
-- miktar, günlük/haftalık grafik ve hatırlatma içerir. Su girişi offline
-- yazılabilir."
--
-- MEAL_ENTRIES İLE FARKI: su kaydı tek tablodur, kalem/snapshot yok — atomik
-- çoklu-tablo yazma ihtiyacı yok (log_meal() gibi bir SECURITY DEFINER RPC
-- gerektirmez). §09'un "yalnız zorunluysa" ilkesi burada da geçerli: normal
-- RLS + client INSERT yeterliyken DEFINER fonksiyon fazladan karmaşıklıktır.
--
-- KAPSAM DIŞI (14-open-decisions.md'de kayıtlı):
--   * İstemci tarafı offline outbox (SQLite kuyruğu) — mobil mimarinin
--     geneline ait, MVP-05'te de aynı gerekçeyle ertelendi.
--   * Hatırlatma bildirimleri — bildirim altyapısı ayrı iş.
--   * Widget/ses/wearable entegrasyonları — §03 "ileri faz adaptörleri".

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  amount_ml integer not null,

  -- Kullanıcı geçmişe dönük giriş yapabilir (meal_entries.logged_at ile
  -- aynı gerekçe).
  logged_at timestamptz not null default now(),

  -- §03 "Tekrar gönderim çift su üretmez". Client üretir; aynı
  -- operation_id ikinci denemede UNIQUE ihlali verir, istemci bunu
  -- "zaten kaydedildi" olarak yorumlar (bkz. aşağıdaki NOT).
  operation_id uuid not null unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,

  constraint water_logs_amount_positive check (amount_ml > 0 and amount_ml <= 5000)
);

comment on constraint water_logs_amount_positive on public.water_logs is
  '5000 ml üst sınırı fat-finger korumasıdır (tipik bardak/şişe 100-1000 ml); tıbbi bir üst sınır değildir.';

create index water_logs_user_id_logged_at_idx
  on public.water_logs (user_id, logged_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.water_logs enable row level security;
alter table public.water_logs force row level security;

create policy "water_logs_select_own" on public.water_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

-- INSERT: log_meal()'in aksine burada client'a doğrudan izin verilir —
-- tek tablo, RLS'in kendisi user_id sahteciliğini zaten engeller
-- (with check), SECURITY DEFINER dolambacına gerek yok.
create policy "water_logs_insert_own" on public.water_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: yalnız soft-delete ve miktar/zaman düzeltmesi için — kullanıcı
-- yanlış girdiği su miktarını yeniden yazmak yerine düzeltebilir.
create policy "water_logs_update_own" on public.water_logs
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.water_logs to authenticated;
revoke delete on public.water_logs from authenticated;
revoke all on public.water_logs from anon;

-- ---------------------------------------------------------------------------
-- NOT: idempotency burada UNIQUE ihlaliyle çözülür (log_meal()'deki gibi
-- "önce SELECT, varsa onu dön" değil). Sebep: client zaten INSERT izinli
-- olduğu için sunucu tarafında ekstra bir RPC katmanı olmadan "önce bak"
-- yarış koşuluna (iki eşzamanlı istek) açık olurdu; UNIQUE constraint
-- atomik ve yarış koşuluna kapalıdır. İstemci `23505` (unique_violation)
-- hatasını "zaten kaydedildi, başarılı say" olarak ele alır — bkz.
-- apps/mobile/src/data/water.ts.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Günlük su özeti — meal_entries tarafındaki daily_nutrition_summary ile
-- aynı desende: SECURITY INVOKER + RLS, yalnız çağıranın kendi verisi.
-- ---------------------------------------------------------------------------
create or replace function public.daily_water_summary(target_date date)
returns table (
  total_ml integer,
  log_count integer,
  last_amount_ml integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(amount_ml), 0)::integer,
    count(*)::integer,
    (
      select w2.amount_ml from public.water_logs w2
      where w2.user_id = (select auth.uid())
        and w2.deleted_at is null
      order by w2.logged_at desc
      limit 1
    )
  from public.water_logs w
  where w.user_id = (select auth.uid())
    and w.deleted_at is null
    and w.logged_at::date = target_date
$$;

comment on function public.daily_water_summary is
  'Bir günün su toplamı + "son kullanılan miktar" (§03 tek dokunuş için varsayılan miktar önerisi). last_amount_ml TARGET_DATE''e bağlı değildir, kullanıcının en son (herhangi bir gün) girdiği miktardır.';

-- GÜVENLİK NOTU (ampirik olarak bulundu, has_function_privilege ile
-- doğrulandı): bu projede `public` şemasında `postgres` rolünün
-- fonksiyonlar için varsayılan ACL'i zaten `anon`'u AYRI ve DOĞRUDAN
-- içeriyor (yalnız PUBLIC üzerinden değil) — `revoke ... from public`
-- tek başına anon'un erişimini KALDIRMAZ. food_search_functions.sql'deki
-- aynı başlıklı not bunun nedenini "anon PUBLIC üyesidir" diye açıklar,
-- ama gerçek neden burada farklı: anon'un kendi ayrı varsayılan grant'i
-- var. Sonuç aynı: HER İKİSİ de açıkça revoke edilmeli.
revoke execute on function public.daily_water_summary(date) from public;
revoke execute on function public.daily_water_summary(date) from anon;
grant execute on function public.daily_water_summary(date) to authenticated;
