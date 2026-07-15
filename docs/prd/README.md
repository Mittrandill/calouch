# Calouch Modüler PRD

Bu klasör, `Calouch PRD v3.0.pdf` belgesini yapay zekâ kodlama ajanlarının sınırlı bağlamla uygulayabileceği iş paketlerine ayırır. Kaynak PDF ürün kararlarında tek nihai referanstır; bu dosyalar uygulama odaklı özet ve teslimat sözleşmesidir.

## Ajan okuma protokolü

Her görevde yalnızca şu dosyaları yükle:

1. Bu dosya.
2. `00-product-contract.md`.
3. Görevin bağlı olduğu domain dosyası.
4. Gerekirse `09-data-security-privacy.md` ve `12-quality-release.md`.
5. İş kimliği için `13-agent-work-orders.md`.

Bir iş paketinin dışındaki özelliği uygulama. Eksik karar varsa varsayımı koda gömmek yerine `14-open-decisions.md` kaydına göre hareket et.

## Dosya haritası

| Dosya | İçerik | Kaynak PRD bölümleri |
|---|---|---|
| `00-product-contract.md` | Ürün amacı, kullanıcılar, değişmez ilkeler, kapsam | 1-5, 45 |
| `01-architecture.md` | Monorepo, mobil/backend/web mimarisi, state, API | 6, 36-37, 40-41 |
| `02-design-auth-dashboard.md` | Tasarım sistemi, auth, onboarding, Bugün ekranı | 7-9 |
| `03-nutrition-core.md` | Manuel öğün, tarif, besin kataloğu, su | 12-14 |
| `04-ai-meal-analysis.md` | Fotoğraf analizi, Gemini, maliyet ve güven | 10-11 |
| `05-health-activity.md` | Ölçü, fotoğraf, Health, aktivite | 15-17 |
| `06-training.md` | Egzersiz kataloğu, program, canlı antrenman | 18-20 |
| `07-ai-coach-pose.md` | AI hoca, planlar, pose ve video analizi | 21-24 |
| `08-engagement-billing.md` | Başarım, bildirim, widget, paket ve ödeme | 25-27 |
| `09-data-security-privacy.md` | Şema, RLS, offline, güvenlik, KVKK | 28-34 |
| `10-admin-analytics.md` | Yönetim paneli ve analitik | 35, 38 |
| `11-delivery-roadmap.md` | Fazlar, bağımlılıklar ve paralel çalışma sınırları | 42 |
| `12-quality-release.md` | Test, yayın kapıları, kabul ve metrikler | 39, 41, 43-44 |
| `13-agent-work-orders.md` | Kodlanabilir atomik iş listesi | Tüm bölümler |
| `14-open-decisions.md` | Kodlamadan önce netleştirilecek kararlar | Tüm bölümler |

## Öncelik sözlüğü

- `P0`: Fazın çalışması veya güvenliği için zorunlu.
- `P1`: Fazın ürün değerini tamamlar; P0 sonrasında yapılır.
- `P2`: İyileştirme veya ileri faz.
- `Blocked`: Harici karar, hesap, hukuk veya platform erişimi bekler.

## İş paketi sözleşmesi

Bir ajan göreve başlamadan önce şunları açıkça yazmalıdır:

- İş kimliği ve hedefi.
- Dokunacağı uygulama/paketler.
- Bağımlı iş kimlikleri.
- Veri sınıflandırması ve izin etkisi.
- Kabul kriterlerini nasıl doğrulayacağı.

Bir iş ancak kod, migration, test, dokümantasyon ve gerekli telemetry birlikte tamamlandığında biter. Sağlık verisi, ödeme, AI kredisi, RLS veya hesap silme içeren işler güvenlik testi olmadan tamamlanmış sayılmaz.

## Değişmez ürün kuralları

- AI yalnızca tahmin veya taslak üretir; kullanıcı onayı olmadan öğün ya da program kalıcılaşmaz.
- Kalori ve makrolar AI metninden değil, sürümlü besin verisi ve deterministik hesap motorundan gelir.
- Sağlık izinleri, bildirim, fotoğraf saklama veya analitik reddedilse de temel manuel kullanım çalışır.
- Hassas görseller private storage kullanır; public URL üretilmez.
- Gemini ve service-role anahtarları hiçbir istemci bundle'ına girmez.
- Sağlık ve fitness verileri reklam hedefleme, broker satışı veya üçüncü taraf reklam optimizasyonu için kullanılmaz.
- Ürün teşhis, tedavi, ilaç/doz veya sakatlanmama garantisi vermez.
- Offline yazmalar idempotent outbox üzerinden senkronize edilir; sessiz veri kaybı kabul edilmez.

## Kaynak ve izlenebilirlik

Her PR/commit açıklamasında iş kimliği ve ilgili PRD bölümü bulunmalıdır. Örnek:

```text
Implements: MVP-08
PRD: §10.1-10.5, §11.2, §43
```

