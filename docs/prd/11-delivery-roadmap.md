# Teslimat Yol Haritası

## Yürütme ilkesi

Fazlar ürün yüzeyini, dalgalar teknik bağımlılık sırasını gösterir. Aynı dalgadaki işler sahip oldukları dosya/migration sınırı ayrıldıysa paralel yapılabilir. Ortak schema, shared types veya auth policy değiştiren ajanlar paralel merge edilmez.

## Faz 0: Temel sistem

Çıktılar: marka/hukuk ön çalışması, veri envanteri, Supabase ortamları, Google Cloud/Gemini projesi, monorepo, Development Build, tasarım tokenları ve CI/CD.

Çıkış kapısı:

- iOS/Android development build açılır.
- Dev/staging/prod config ve secret ayrımı vardır.
- Monorepo typecheck/lint/test/build CI'da çalışır.
- Veri sınıflandırması ve hukuk blokajları kayıtlıdır.

## Faz 1: Mağaza MVP

### Dalga 1A: İskelet

Monorepo, routing, theme/localization, Supabase local/env, migration/test altyapısı, auth shell, error/crash ve analitik allowlist.

### Dalga 1B: Deterministik çekirdek

Profile/onboarding/hedef motoru; besin şeması/kataloğu; nutrition engine; manuel öğün/tarif/su; temel ölçü. Bu dalga AI'dan önce bitmelidir.

### Dalga 1C: AI ve dashboard

Private media upload, AI job/provider, schema validation, katalog eşleştirme, kullanıcı confirmation ve Bugün kartları. AI kalori motoru 1B'nin üstüne kurulur.

### Dalga 1D: Health ve gelir

Temel adım/health bağlantısı, store products, server verified entitlement, paywall ve restore. Health native işi temel manuel özellikleri bloklamaz.

### Dalga 1E: Gizlilik ve yayın

Consent/versioning, privacy center, account deletion, public deletion page, export, legal surfaces, App Privacy/Data Safety/Health declaration, accessibility ve store testleri.

MVP çıkış kapısı `12-quality-release.md` içindeki release kriterlerinin tamamıdır.

## Faz 2: Antrenman

Egzersiz kataloğu -> program builder -> workout session/set -> rest timer -> recovery/sync -> PR/activity -> widget. Nutrition MVP şemasına geriye dönük uyumsuz değişiklik yapmaz.

## Faz 3: Yazılı AI hoca

Conversation/safety -> read-only tools -> confirmed mutation tools -> meal/workout plan draft -> weekly summary/adaptive suggestions. Billing credit ledger ve domain API'leri ön koşuldur.

## Faz 4: Sesli AI hoca

Ephemeral token -> Live session -> voice quota -> workout voice tools -> fallback STT/TTS -> privacy/delete. Gemini Live preview durumu tekrar doğrulanmadan production varsayılanı yapılmaz.

## Faz 5: Cihaz içi form

Native camera/frame processor -> MediaPipe adapter -> shared pose types -> hareket başına state machine -> local feedback -> session summary -> evaluation. İlk on hareket ayrı ayrı feature flag ile açılır.

## Faz 6: İleri analiz

Video form, fotoğraftan ölçü, Apple Watch/Wear OS, akıllı tartı, challenge/achievement ve adaptif program. Her deneysel ölçüm aralık/confidence ve ayrı consent taşır.

## Bağımlılık grafiği

```text
FND-01/02/03
  -> FND-04 data/RLS
  -> MVP-01 auth -> MVP-02 onboarding
  -> MVP-03 catalog -> MVP-04 nutrition engine -> MVP-05 manual meals
                                                -> MVP-08 AI contracts
MVP-08 -> MVP-09 AI jobs -> MVP-10 confirmation -> MVP-11 dashboard
MVP-01 -> MVP-14 billing catalog -> MVP-15 entitlements
FND-04 + all user domains -> MVP-16 consent -> MVP-17 delete/export
All MVP work -> MVP-19 release

MVP release -> TRN-* -> COACH-* -> VOICE-* / POSE-* -> ADV-*
```

## Paralel çalışma sınırları

- Aynı migration dosyasını yalnız bir ajan sahiplenir.
- Shared type değişikliği önce küçük kontrat PR'ı olarak merge edilir.
- UI ajanı mock adapter ile çalışabilir; gerçek adapter kontrata uyar.
- RLS, billing ledger, delete pipeline ve AI credit işlemleri tek sorumlu tarafından uçtan uca ele alınır.
- Feature branch merge öncesi migration sırası ve generated lockfile yeniden doğrulanır.

