-- Implements: FND-04, MVP-01 (kısmi)
-- PRD: §09 (Veri, Güvenlik ve Gizlilik), §02 (Kimlik doğrulama)
--
-- Dalga 1A: auth hesabından ayrı profil kaydı ve RLS sözleşmesinin ilk
-- uygulaması. Onboarding alanları (doğum yılı, boy, kilo, hedef) bilinçli
-- olarak YOK — onlar MVP-02'ye (Dalga 1B) ait ve sağlık verisi sınıfında.

-- §09: "private: yalnız server-side." Trigger fonksiyonu burada yaşar;
-- public şemada durursa Data API üzerinden görünür hâle gelir.
create schema if not exists private;

revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- §02: "Auth hesabı ile profiles verisini ayır."
-- id, auth.users'a birebir bağlıdır: ayrı bir user_id kolonu, iki kaynağın
-- ayrışabildiği bir durum yaratırdı.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- §02 onboarding: "Ad/rumuz". Zorunlu değil — kullanıcı ad vermeden
  -- uygulamayı kullanabilmeli.
  display_name text,

  -- §02: tema ve dil tercihi "kullanıcı hesabına kaydedilir, offline okunur
  -- ve cihazlar arası senkronize edilir."
  locale text not null default 'tr',
  theme_preference text not null default 'system',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Kısıtlar veritabanında: istemci doğrulaması atlanabilir.
  constraint profiles_locale_supported check (locale in ('tr', 'en')),
  constraint profiles_theme_supported
    check (theme_preference in ('system', 'light', 'dark', 'oled')),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 60)
);

comment on table public.profiles is
  'Kullanıcı profili. Sağlık/ölçü verisi burada TUTULMAZ (MVP-02 ayrı tablo).';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
-- search_path boşaltılır: aksi hâlde çağıran, kendi şemasındaki sahte bir
-- fonksiyonu bu SECURITY DEFINER bağlamında çalıştırabilir.
create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Kayıt olurken profil oluşturma
-- ---------------------------------------------------------------------------
-- §09: "SECURITY DEFINER yalnız zorunluysa kapalı şemada, açık auth kontrolü
-- ve dar EXECUTE grant ile kullanılır."
--
-- Burada zorunlu: trigger auth.users üzerinde çalışır ve o tabloya yazma
-- yetkisi kullanıcıda yoktur. Alternatif — profili istemciye oluşturtmak —
-- profilsiz hesap bırakma riskini istemcinin ağ bağlantısına bağlardı.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  -- Idempotent: trigger'ın iki kez çalışması kayıt akışını bozmamalı.
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- §09: "İstemciden erişilebilen her tabloda RLS zorunlu."
alter table public.profiles enable row level security;

-- Tablo sahibi bile politikaları atlayamasın: ileride bir migration'ın
-- yanlışlıkla veri sızdırmasını engeller.
alter table public.profiles force row level security;

-- §09: "SELECT, INSERT, UPDATE, DELETE ayrı policy'dir."
-- §09: "Yalnız TO authenticated yetkilendirme değildir." — her policy ayrıca
-- satır sahipliğini kontrol eder.

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  -- (select auth.uid()) sarmalı bilinçli: satır başına değil, sorgu başına
  -- bir kez değerlendirilir (§09 ve Supabase RLS performans kılavuzu).
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  -- Trigger profili zaten oluşturur; bu policy yalnız kurtarma yolu içindir.
  -- Kullanıcı BAŞKASI adına satır ekleyemez.
  with check ((select auth.uid()) = id);

-- §09: "UPDATE hem USING hem WITH CHECK taşır."
-- USING: hangi satırı güncelleyebilir. WITH CHECK: sonuç satırı ne olabilir.
-- İkisi birlikte olmadan kullanıcı, kendi satırını başkasına devredebilirdi.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Hesap silme MVP-17'nin pipeline'ıdır (§09 "Hesap silme" state machine).
-- Yine de profil satırının doğrudan silinmesi engellenmez: auth.users
-- silindiğinde cascade zaten çalışır ve kullanıcı kendi verisinin sahibidir.
create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = id);

-- §09: "Bir şemanın Data API'ye açık olması GRANT ile, satır erişimi RLS ile
-- ayrı ayrı yönetilir."
grant select, insert, update, delete on public.profiles to authenticated;

-- anon hiçbir şey göremez: profil verisi oturum gerektirir.
revoke all on public.profiles from anon;
