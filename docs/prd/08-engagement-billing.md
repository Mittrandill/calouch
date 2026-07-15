# Etkileşim, Bildirim ve Gelir

## Başarımlar ve challenge

Başarımlar ilk öğün/AI/antrenman/PR/form, 7/30 günlük seri, su/adım hedefi ve kayıt sayılarıdır. Challenge örnekleri su, adım, antrenman, protein, sebze, öğün kaydı ve form kalitesidir.

En az kalori, en hızlı kilo verme, öğün atlama, susuz kalma, aşırı egzersiz veya sağlıksız beden karşılaştırması yasaktır. Kural motoru server-side, sürümlü ve tekrar çalıştırmada idempotenttir.

## Bildirimler

Öğün, su, antrenman, dinlenme, challenge, seri, haftalık özet, abonelik ve güvenlik bildirimleri desteklenir. İşlevsel ve pazarlama tercihleri ayrıdır. Sessiz saat, timezone ve izin durumu dikkate alınır.

## Widget

Kalan kalori, makro, su, adım, bugünkü antrenman, seri, hızlı fotoğraf ve hızlı öğün yüzeyleri fazlara göre eklenir. Hassas değerin kilit ekranında gösterimi ayrı kullanıcı ayarıdır. Widget uygulama verisini güvenli paylaşılan container üzerinden ve minimum veriyle okur.

## Ürünler ve entitlement

| Plan | Ana haklar |
|---|---|
| Free | Manuel öğün, haftada 3 AI yemek, su/adım, temel ölçü/antrenman, sınırlı katalog/rapor |
| Plus | Ayda 150 yemek, barkod/etiket/tarif, gelişmiş takip, program/canlı antrenman, cihaz içi form, rapor/widget/export |
| AI Coach | Plus + ayda 500 yemek, 120 dk ses, AI plan/özet, video raporu ve yüksek kota |
| Lifetime Core | AI dışı Plus özellikleri kalıcı, cihaz içi form ve başlangıç 500 kredi |

Fiyat ve kota remote config/store catalog ile yönetilir. Kaynak PDF'deki lansman fiyatları ürün kararıdır; kod sabiti değildir.

Lifetime; bulut AI, Gemini Live, video analizi veya gelecekte değişken maliyetli servisi sınırsız açmaz.

## AI kredisi

Örnek tüketim: yemek/etiket/text 1, haftalık rapor 3, program 5, ses dakikası 2, video form 20, cihaz içi form 0. Değerler server-side config'tir.

Ledger append-only olmalı; reserve, consume, refund, expire, grant ve purchase transaction türleri ayrı tutulmalıdır. Aynı job/purchase event ikinci kez kredi değiştirmez. Bakiye yalnızca ledger toplamından veya transaction ile güncellenen güvenilir projection'dan gelir.

## Satın alma

- iOS StoreKit 2, Android Play Billing.
- RevenueCat veya özel backend ortak entitlement katmanı.
- Sunucu doğrulama ve imzalı webhook.
- Restore Purchases, iptal/iade, grace period ve renewal durumu.
- Lifetime non-consumable; kredi paketleri consumable.

İstemci store sonucuna güvenerek hak açmaz. Webhook sırası, tekrar, gecikme ve out-of-order event ele alınır. Raw event audit için tutulur, işlenmiş event idempotency anahtarı taşır.

## Kabul kriterleri

- Plan hakları tek server-side entitlement kaynağından okunur.
- Sahte/tekrar/out-of-order webhook hak veya kredi çoğaltmaz.
- Restore yeni cihazda abonelik ve lifetime hakkını geri getirir.
- İade/iptal/grace period beklenen erişim politikasını uygular.
- AI job başarısızlığında rezervasyon tam bir kez iade edilir.
- Paywall yenileme, fiyat, koşul ve restore eylemini gösterir.
- Pazarlama izni işlevsel/güvenlik bildiriminden ayrıdır.

