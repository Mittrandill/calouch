-- Implements: MVP-11
-- PRD: §9 (Bugün ekranı), §09
--
-- Bugün ekranı kart kataloğu düzeni (sıra/görünürlük/boyut/odak kartı).
--
-- KAPSAM DIŞI, bilinçli olarak:
--   * Yeni RPC yok — tek satır/kullanıcı `profiles` tablosuna doğrudan
--     `UPDATE` ile yazılır, `goal_overrides`/`theme_preference` ile AYNI yol
--     (bkz. apps/mobile/src/data/profile.ts `useUpdateProfile`). RLS zaten
--     20260715000001'deki profiles policy'leriyle kapsanıyor, kolon eklemek
--     yeni bir policy gerektirmez.
--   * jsonb içeriği burada derinlemesine doğrulanmıyor (yalnız obje şekli) —
--     `goal_overrides` ile AYNI yaklaşım: istemci tarafı `cardCatalog.ts`
--     kayıtlı olmayan kart id'lerini varsayılanla birleştirir, bu yüzden şema
--     esnek kalmalı (yeni kart tipi eklendiğinde migration gerektirmesin).

alter table public.profiles
  -- Şekil: { version, cardOrder: string[], hiddenCardIds: string[],
  --          cardSizes: Record<string, 'compact'|'expanded'>, focusCardId }
  -- Boş obje = istemci varsayılan kataloğu kullanır (§9 "kart kataloğu").
  add column dashboard_layout jsonb not null default '{}'::jsonb;

comment on column public.profiles.dashboard_layout is
  'Bugün ekranı kart sırası/görünürlüğü/boyutu/odak kartı (§9). Boş obje = istemci varsayılan kataloğu kullanır. Ayarlarda last-write-wins (§09).';

alter table public.profiles
  add constraint profiles_dashboard_layout_is_object
    check (jsonb_typeof(dashboard_layout) = 'object');

-- ---------------------------------------------------------------------------
-- Not: RLS
-- ---------------------------------------------------------------------------
-- profiles üzerindeki RLS ve dört policy 20260715000001'de kuruldu; yeni
-- kolon aynı satır sahipliğine tabidir. Bu migration'ın pgTAP testi (§09
-- "her migration pozitif/negatif RLS testi taşır") CHECK ihlalini ve
-- başkası adına yazmayı ayrıca doğrular.
