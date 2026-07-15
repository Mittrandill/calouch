# Teknik Mimari

## Teknoloji sözleşmesi

- Mobil: React Native, TypeScript, Expo SDK, Expo Router, Hermes, New Architecture.
- Geliştirme: Expo Development Build, `expo-dev-client`, EAS Build/Update. Expo Go hedef değildir.
- Native: Continuous Native Generation, Expo Prebuild, Config Plugins, Expo Modules API; gerektiğinde Swift/Kotlin.
- Backend: Supabase Auth, PostgreSQL, Storage, Edge Functions, Cron, Realtime ve RLS.
- AI: Google Gemini; canlı ses için Gemini Live; cihaz içi pose için MediaPipe.
- Web/admin: Next.js ve Vercel.
- Repo: pnpm workspace ve Turborepo tercih edilir.

Gerçek kurulumda PRD'deki örnek sürümleri körlemesine sabitleme. Başlangıç günündeki kararlı Expo/RN sürümünü ve tüm native paketlerin New Architecture uyumunu doğrula; karar kaydı oluştur.

## Monorepo sınırları

```text
apps/mobile        Mobil uygulama
apps/admin         Yönetim paneli
apps/web           Pazarlama, hukuk, hesap silme
packages/ui        Paylaşılan UI primitive'leri
packages/design-tokens
packages/types
packages/validation
packages/nutrition-engine
packages/activity-engine
packages/pose-engine
packages/ai-client
packages/health-connectors
packages/localization
packages/analytics
packages/config
supabase/migrations
supabase/functions
supabase/seed
supabase/tests
supabase/policies
```

Paketler domain mantığı taşır; uygulamalar ekran ve platform entegrasyonu taşır. UI paketine veri erişimi, `nutrition-engine` içine React Native bağımlılığı koyma.

## Katmanlar

```text
Mobile UI
  -> domain/use-case katmanı
  -> local SQLite + outbox / TanStack Query cache
  -> Supabase Data API veya güvenli Edge Function
  -> PostgreSQL / private Storage

AI istekleri
  -> Edge Function / server API
  -> provider adapter
  -> Gemini
  -> schema validation
  -> deterministic domain engine
```

## State yönetimi

- Server state: TanStack Query. Öğün, profil, besin arama, program, rapor, abonelik.
- Client state: Zustand. Aktif antrenman, kamera akışı, tema, geçici filtre, bottom sheet, AI Live.
- Form: React Hook Form + Zod.
- Offline kalıcı state: SQLite ve outbox.

Tek bir global store kullanılmaz. Server yanıtları Zustand'a kopyalanmaz.

## API standartları

Her endpoint kimlik doğrulama, rate limit, Zod validation, request-size limiti, idempotency, correlation ID, güvenli hata ve gerektiğinde audit log uygular.

Başlangıç yüzeyi:

```text
POST  /v1/ai/meals/analyze
GET   /v1/ai/jobs/:id
POST  /v1/ai/text-to-meal
POST  /v1/ai/nutrition-label
POST  /v1/ai/live/token
POST  /v1/ai/workout-plan
POST  /v1/ai/meal-plan
GET   /v1/foods/search
POST  /v1/foods/custom
POST  /v1/recipes
POST  /v1/health/sync
GET   /v1/health/daily-summary
POST  /v1/workouts/sessions
PATCH /v1/workouts/sessions/:id
POST  /v1/workouts/sessions/:id/complete
POST  /v1/pose/sessions
POST  /v1/pose/sessions/:id/summary
POST  /v1/account/export
POST  /v1/account/delete
POST  /v1/billing/apple/webhook
POST  /v1/billing/google/webhook
```

Bu liste kontrat taslağıdır. Uygulamadan önce request/response şeması, auth rolü, idempotency davranışı ve hata kodu ilgili domain işinde tanımlanır.

## Native entegrasyon kapısı

HealthKit, Health Connect, StoreKit, Play Billing, native frame processor, MediaPipe, widget, Live Activity, background task veya özel Swift/Kotlin değişikliği:

1. New Architecture uyumluluğu doğrulanır.
2. Config plugin/prebuild etkisi belgelenir.
3. iOS entitlement ve Android manifest farkı gözden geçirilir.
4. Development Build iki platformda yenilenir.
5. Gerçek cihaz smoke testi yapılır.

## Ortamlar

Development, staging ve production ayrıdır. Production verisi development'a kopyalanmaz. Feature flag, AI model config ve kill switch sunucu tarafında ortam bazlı yönetilir.

## CI/CD minimumu

PR kapıları: TypeScript, ESLint, unit/integration test, Expo Doctor, dependency audit, secret scan, migration lint, RLS testleri ve build kontrolü.

Kanallar: development, preview, staging, production. Mobil hat: Development Build -> EAS -> TestFlight/Play Internal -> Closed Testing -> Production.

## Mimari kabul kriterleri

- Mobil bundle'da Gemini/service-role secret yok.
- Expo Go bağımlılığı yok ve iki platform Development Build açılıyor.
- Domain paketleri UI/framework bağımlılığından ayrılmış.
- Offline desteklenen mutation'lar idempotent.
- Environment config ve secret'lar istemci/public değişken ayrımına uyuyor.
- Native değişiklikler mağaza build gereksinimini tetikliyor.

