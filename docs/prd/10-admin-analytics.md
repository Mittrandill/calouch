# Yönetim, İçerik ve Analitik

## Yönetim paneli

Next.js/Vercel uygulaması ayrı admin güvenlik sınırıdır. Modül grupları:

- İçerik: foods, barcodes, recipes, exercises, programs, translations.
- Engagement: challenges, achievements, notifications, feature flags.
- AI/ML: jobs, corrections, costs, voice usage, pose analyses, moderation.
- Ticari: subscriptions, entitlements, refunds.
- Privacy/ops: KVKK requests, delete/export, audit, security incidents.
- Kullanıcı destek görünümü: minimum gerekli ve maskelenmiş bilgi.

Roller: super admin, content manager, nutrition editor, fitness editor, support, finance, privacy officer, analyst ve read-only. Rol matrisi action/resource bazlıdır; yalnız route gizlemek yetmez, server authorization gerekir.

Hassas veri görüntüleme purpose, re-auth ve audit gerektirir. Bulk export varsayılan kapalı/dar limitli olmalıdır. Admin doğrudan production DB service key'i browser'da kullanmaz.

## İçerik iş akışı

Katalog değişiklikleri draft -> review -> published -> archived durumlarını kullanır. Besin ve tarif değişikliği sürüm üretir; geçmiş öğün snapshot'ını değiştirmez. Egzersiz medyası lisans/moderasyon olmadan yayınlanmaz.

AI correction ekranı ham hassas görseli varsayılan açmaz. Kullanıcı izni/retention ve rol kontrolü olmadan eğitim/evaluation verisi oluşturulmaz.

## Analitik olayları

İzin verilen ürün olayları:

```text
onboarding_completed
meal_scan_started/completed/failed/corrected
meal_saved
water_logged
workout_started/completed
form_session_started/completed
voice_coach_started
paywall_viewed
subscription_started
lifetime_purchased
```

Event şeması version, anonymous/user pseudonymous ID, app/platform/version, timestamp ve izin verilen teknik property'lerle sınırlıdır.

Yasak payload: yemek fotoğrafı/içeriği/kalori, kilo/ölçü, ilerleme/form medyası, health verisi ve AI konuşma metni. Serbest metin property kabul edilmez.

## Operasyon dashboard'ları

- AI: success/error, latency, correction, token/cost, model ve kill-switch durumu.
- Billing: webhook error, entitlement mismatch, refund ve conversion.
- Health: sync hata oranı; kişisel değer olmadan connector/platform kırılımı.
- Privacy: delete/export SLA ve failure queue.
- Release: crash-free session ve app version dağılımı.

## Kabul kriterleri

- Her admin endpoint rol ve resource bazlı server authorization uygular.
- Admin rolü user-editable metadata'dan gelmez.
- Hassas görüntüleme ve mutation audit kaydı üretir.
- Analitik SDK health/AI/meal içeriği almadan çalışır; opt-out gönderimi durdurur.
- Event schema allowlist dışı property'yi build/test aşamasında reddeder.
- İçerik yayını review ve sürümleme olmadan production kataloğunu değiştirmez.

