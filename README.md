# Calouch

Yapay zekâ destekli beslenme, kalori, aktivite ve fitness platformu. iOS ve Android.

Ürün kararlarında tek nihai referans `Calouch PRD v3.0.pdf`'tir. Uygulama odaklı iş paketleri için `docs/prd/` klasörüne bak — ajan okuma protokolü `docs/prd/README.md` içinde.

**Durum:** Faz 1, Dalga 1C. Auth/onboarding, besin-öğün-su-tarif, ölçüm/fotoğraf ve AI yemek job pipeline'ı tamamlandı; sıradaki iş MVP-10 kullanıcı doğrulaması (`docs/prd/13-agent-work-orders.md`).

## Kurulum

```bash
pnpm install
cp .env.example apps/mobile/.env   # değerleri doldur
```

`apps/mobile/.env` yalnız üç değer taşır. `EXPO_PUBLIC_*` öneki alan her değer istemci bundle'ına **gömülür** ve public kabul edilir; service-role ve Gemini anahtarı buraya asla girmez (PRD §01).

## Çalıştırma

Expo Go **kullanılmaz** (PRD §6.2). Development Build gerekir:

```bash
pnpm mobile android      # yerel Android build + çalıştır
pnpm mobile start        # dev server (build kuruluysa)
```

iOS build için macOS veya EAS Build gerekir — bkz. `docs/prd/14-open-decisions.md`.

## Doğrulama

```bash
pnpm verify              # typecheck + lint + test
pnpm turbo run test      # 175 test
pnpm --filter @calouch/mobile doctor
```

Veritabanı testleri Docker ister:

```bash
supabase start
pnpm db:lint
pnpm db:test             # pgTAP RLS testleri
```

## Yapı

```text
apps/mobile              Expo Router uygulaması
packages/design-tokens   Semantik token'lar, 4 tema, WCAG kontrast testi
packages/localization    TR/EN
packages/config          Ortam değişkeni şeması ve secret kapısı
packages/analytics       Kapalı olay kataloğu + redaksiyon
packages/nutrition-engine Hedef, nutrient ve deterministik AI taslak motoru
packages/types           Paylaşılan TypeScript kontratları
packages/validation      Zod çalışma zamanı doğrulaması
supabase/migrations      Şema ve RLS
supabase/tests           pgTAP RLS testleri
```

`packages/*` domain mantığı taşır, `apps/*` ekran ve platform entegrasyonu. Domain paketlerine React Native veya veri erişimi importu ESLint tarafından reddedilir (PRD §01).

## Katkı kuralları

Commit/PR açıklaması iş kimliği ve PRD bölümü taşır:

```text
Implements: MVP-09
PRD: §10.1-10.5, §11.2, §43
```

Bir iş ancak kod, migration, test, dokümantasyon ve gerekli telemetry birlikte tamamlandığında biter.

### Otomatik zorlanan kurallar

Bunlar kod incelemesi temennisi değil, CI kapısıdır:

- Kod içinde ham renk/radius/spacing yok — `@calouch/design-tokens` kullan.
- `process.env` yalnız `apps/mobile/src/env.ts` içinde okunur.
- Domain paketleri UI/framework/veri erişimi importu taşımaz.
- Analitik olayları kapalı katalogdan gelir; hassas alan reddedilir.
- İstemciden erişilen her tabloda RLS + pozitif/negatif test.

## Değişmez ürün kuralları

`docs/prd/README.md` §"Değişmez ürün kuralları" bağlayıcıdır. Özellikle:

- AI yalnızca taslak üretir; kullanıcı onayı olmadan öğün kalıcılaşmaz.
- Kalori ve makrolar AI metninden değil, sürümlü besin verisi ve deterministik motordan gelir.
- İzinler reddedilse de temel manuel kullanım çalışır.
- Hassas görseller private storage kullanır; public URL üretilmez.
- Sağlık verileri reklam hedefleme veya üçüncü taraf optimizasyonu için kullanılmaz.
- Ürün teşhis, tedavi veya doz önerisi vermez.
