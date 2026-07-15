-- Implements: FND-04
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır: sahibi
-- okuyabilir/yazar; başka kullanıcı ve anon erişemez; ownership
-- değiştirilemez."
--
-- Çalıştırma: supabase test db
--
-- Bu testlerin NEGATİF tarafı asıl değerli olandır. Pozitif test, RLS tamamen
-- kapalıyken de geçer — yani tek başına hiçbir şey kanıtlamaz.

begin;
select plan(19);

create extension if not exists pgtap with schema extensions;

-- ---------------------------------------------------------------------------
-- Kurulum: iki gerçek kullanıcı
-- ---------------------------------------------------------------------------
-- Profiller on_auth_user_created trigger'ı tarafından oluşturulur; testin
-- kendisi insert etmez — trigger'ın çalıştığını da doğrulamış oluruz.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse@test.local', crypt('x', gen_salt('bf')), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak@test.local', crypt('x', gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Yapı
-- ---------------------------------------------------------------------------
select has_table('public', 'profiles', 'profiles tablosu var');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles üzerinde RLS açık'
);
select ok(
  (select relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles üzerinde FORCE RLS açık (tablo sahibi de politikalara tabi)'
);

-- §09: dört işlem ayrı policy.
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'profiles'),
  4,
  'SELECT/INSERT/UPDATE/DELETE için ayrı policy var'
);

-- §09: UPDATE hem USING hem WITH CHECK taşır.
select ok(
  (select qual is not null and with_check is not null
   from pg_policies
   where schemaname = 'public' and tablename = 'profiles' and cmd = 'UPDATE'),
  'UPDATE policy hem USING hem WITH CHECK taşır'
);

-- Trigger profili oluşturdu mu?
select is(
  (select count(*)::int from public.profiles
   where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'Kayıt olan kullanıcı için profil otomatik oluşur'
);

select is(
  (select locale from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'tr',
  'Varsayılan dil Türkçe'
);

-- ---------------------------------------------------------------------------
-- POZİTİF: sahibi kendi satırını okur ve yazar
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'Sahibi yalnız kendi profilini görür'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Ayşe' where id = '11111111-1111-1111-1111-111111111111' $$,
  'Sahibi kendi profilini güncelleyebilir'
);

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Ayşe',
  'Güncelleme kalıcı'
);

select lives_ok(
  $$ update public.profiles set theme_preference = 'oled', locale = 'en'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'Tema ve dil tercihi hesaba yazılabilir'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başka kullanıcının verisi
-- ---------------------------------------------------------------------------
-- Ayşe hâlâ oturumda; Burak'ın satırını hedefliyor.

select is(
  (select count(*)::int from public.profiles
   where id = '22222222-2222-2222-2222-222222222222'),
  0,
  'Başka kullanıcının profili GÖRÜNMEZ'
);

-- RLS'te görünmeyen satır güncellenemez: hata değil, 0 satır etkilenir.
-- Sessiz başarısızlık olduğu için açıkça sayılır.
update public.profiles set display_name = 'ele geçirildi'
where id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*)::int from public.profiles
   where id = '22222222-2222-2222-2222-222222222222' and display_name = 'ele geçirildi'),
  0,
  'Başka kullanıcının profili güncellenemez'
);

delete from public.profiles where id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*)::int from public.profiles
   where id = '22222222-2222-2222-2222-222222222222'),
  0,
  'Başka kullanıcının profili silinemez (satır hâlâ duruyor, sadece görünmüyor)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: sahiplik değiştirilemez (§09)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.profiles set id = '22222222-2222-2222-2222-222222222222'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'Kullanıcı profilini başka kullanıcıya devredemez (WITH CHECK)'
);

select throws_ok(
  $$ insert into public.profiles (id) values ('22222222-2222-2222-2222-222222222222') $$,
  '42501',
  null,
  'Kullanıcı başkası adına profil oluşturamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: kısıtlar
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.profiles set locale = 'de'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'Desteklenmeyen dil reddedilir'
);

select throws_ok(
  $$ update public.profiles set theme_preference = 'neon'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'Desteklenmeyen tema reddedilir'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon hiçbir şey göremez
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = null;

select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501',
  null,
  'anon profiles tablosuna erişemez (GRANT yok)'
);

reset role;
select * from finish();
rollback;
