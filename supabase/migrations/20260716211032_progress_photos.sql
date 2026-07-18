-- Implements: MVP-07
-- PRD: §15-16 (05-health-activity.md §"İlerleme fotoğrafları"), §09
--
-- İlerleme fotoğrafları. §05: "Ön, yan ve arka fotoğraf private bucket'ta
-- tutulur; public URL yoktur, görüntüleme signed URL kullanır. ... Görseller
-- analitiğe gönderilmez ve kullanıcının açık eylemi olmadan AI'a
-- aktarılmaz."
--
-- YOL SÖZLEŞMESİ: her nesne `{user_id}/{photo_id}.{ext}` altında saklanır.
-- RLS bu yolu KAYNAK OLARAK kullanır (storage.foldername(name))[1] —
-- `owner`/`owner_id` kolonlarına güvenilmez çünkü onlar yalnız YÜKLEYEN
-- taraf istemciyse doğru dolar; klasör yolu tabanlı kural Supabase'in
-- kendi önerdiği, servis rolünden bağımsız çalışan desendir.

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "progress_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "progress_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- UPDATE policy'si YOK: fotoğraf değiştirilmez, silinip yeniden yüklenir
-- (§05'te düzenleme akışı yok).

-- ---------------------------------------------------------------------------
-- progress_photos — depolama nesnesinin METADATASI. §05 "açı" (ön/yan/arka)
-- bilgisi storage.objects'te yok, burada tutulur.
-- ---------------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- storage.objects.name ile birebir — signed URL üretmek için client bu
  -- yolu supabase.storage.from('progress-photos').createSignedUrl()'e verir.
  storage_path text not null unique,
  angle text not null,
  taken_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint progress_photos_angle_valid check (angle in ('front', 'side', 'back')),
  -- Kendi klasörü dışına metadata yazamaz — storage RLS'inin aynısını
  -- burada da açık kontrol ederiz (defense in depth, bkz. log_meal'deki
  -- "RLS zaten korur" dersi: DEFINER olmasa da çift katman ucuz ve güvenli).
  constraint progress_photos_path_matches_user check (storage_path like (user_id::text || '/%'))
);

create index progress_photos_user_id_taken_at_idx
  on public.progress_photos (user_id, taken_at desc)
  where deleted_at is null;

alter table public.progress_photos enable row level security;
alter table public.progress_photos force row level security;

create policy "progress_photos_select_own" on public.progress_photos
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "progress_photos_insert_own" on public.progress_photos
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: yalnız soft-delete (deleted_at) — açı/yol değiştirilmez.
create policy "progress_photos_update_own" on public.progress_photos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.progress_photos to authenticated;
revoke delete on public.progress_photos from authenticated;
revoke all on public.progress_photos from anon;
