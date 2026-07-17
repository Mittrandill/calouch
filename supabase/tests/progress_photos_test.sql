-- Implements: MVP-07
-- PRD §09: "Her migration pozitif/negatif RLS testi taşır."
--
-- progress_photos: pozitif akış, yol sözleşmesi ({user_id}/{photo_id}.ext —
-- storage RLS'in kaynak aldığı öneki metadata tablosunda da doğrular),
-- geçerli açı kısıtı, çapraz kullanıcı izolasyonu, soft-delete ve anon
-- reddi. `storage.objects` politikaları bu dosyada test EDİLMEZ — pgTAP
-- ortamı gerçek bir upload akışı taşımaz, yalnız metadata tablosu (bu
-- migration'ın kendi sorumluluğu) doğrulanır.

begin;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('e3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'ayse_photo@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now()),
  ('e4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'burak_photo@test.local', extensions.crypt('x', extensions.gen_salt('bf')), now(), now());

-- ---------------------------------------------------------------------------
-- Ayşe: POZİTİF akış
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e3333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into public.progress_photos (user_id, storage_path, angle) values
  ('e3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333/p1.jpg', 'front');

select is(
  (select count(*)::int from public.progress_photos where user_id = 'e3333333-3333-3333-3333-333333333333'),
  1, 'POZİTİF: ilerleme fotoğrafı metadatası oluşturuldu'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: başkası adına yazma (with check)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.progress_photos (user_id, storage_path, angle)
     values ('e4444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444/p2.jpg', 'front') $$,
  '42501', null, 'NEGATİF: Ayşe, Burak adına fotoğraf metadatası yazamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: yol sözleşmesi — storage_path kendi user_id önekini taşımalı
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.progress_photos (user_id, storage_path, angle)
     values ('e3333333-3333-3333-3333-333333333333', 'e4444444-4444-4444-4444-444444444444/p3.jpg', 'front') $$,
  '23514', null, 'NEGATİF: storage_path başkasının klasör önekini taşıyamaz'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: geçersiz açı
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.progress_photos (user_id, storage_path, angle)
     values ('e3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333/p4.jpg', 'top') $$,
  '23514', null, 'NEGATİF: geçersiz açı (yalnız front/side/back) reddedilir'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: aynı storage_path ikinci kez UNIQUE ihlali verir
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.progress_photos (user_id, storage_path, angle)
     values ('e3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333/p1.jpg', 'side') $$,
  '23505', null, 'NEGATİF: aynı storage_path tekrar kullanılamaz (UNIQUE)'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: DELETE grant'i yok — silme yalnız soft-delete ile yapılır
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ delete from public.progress_photos where storage_path = 'e3333333-3333-3333-3333-333333333333/p1.jpg' $$,
  '42501', null, 'NEGATİF: progress_photos üzerinde DELETE grant''i yok'
);

-- ---------------------------------------------------------------------------
-- NEGATİF: anon
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select * from public.progress_photos $$,
  '42501', null, 'NEGATİF: anon progress_photos okuyamaz'
);
select throws_ok(
  $$ insert into public.progress_photos (user_id, storage_path, angle)
     values ('e3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333/p5.jpg', 'front') $$,
  '42501', null, 'NEGATİF: anon progress_photos yazamaz'
);
reset role;

-- ---------------------------------------------------------------------------
-- NEGATİF: Burak Ayşe'nin fotoğrafını göremez; kendi fotoğrafı izole
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"e4444444-4444-4444-4444-444444444444","role":"authenticated"}';

select is(
  (select count(*)::int from public.progress_photos where user_id = 'e3333333-3333-3333-3333-333333333333'),
  0, 'NEGATİF: Burak Ayşe''nin fotoğrafını göremez'
);

insert into public.progress_photos (user_id, storage_path, angle) values
  ('e4444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444/p1.jpg', 'back');

select is(
  (select count(*)::int from public.progress_photos where user_id = 'e4444444-4444-4444-4444-444444444444'),
  1, 'POZİTİF: Burak''ın kendi fotoğrafı kendi görünümünde'
);

-- ---------------------------------------------------------------------------
-- Soft-delete: yalnız deleted_at güncellenir, satır kalır
-- ---------------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"e3333333-3333-3333-3333-333333333333","role":"authenticated"}';

update public.progress_photos set deleted_at = now()
where storage_path = 'e3333333-3333-3333-3333-333333333333/p1.jpg';

select is(
  (select count(*)::int from public.progress_photos
   where user_id = 'e3333333-3333-3333-3333-333333333333' and deleted_at is null),
  0, 'soft-delete sonrası aktif fotoğraf kalmadı'
);
select is(
  (select count(*)::int from public.progress_photos
   where user_id = 'e3333333-3333-3333-3333-333333333333' and deleted_at is not null),
  1, 'soft-delete: satır silinmedi, işaretlendi'
);

reset role;
select * from finish();
rollback;
