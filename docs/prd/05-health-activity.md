# Sağlık, Ölçü ve Aktivite

## Vücut ölçüleri

Kilo, boy, yağ oranı, kas kütlesi; boyun, omuz, göğüs, bel, kalça; sağ/sol kol, ön kol, üst bacak ve baldır desteklenir. Her kayıtta birim, zaman, kaynak ve sürüm bulunur.

Kaynaklar: manuel, Apple Health, Health Connect, akıllı tartı, profesyonel ölçüm ve deneysel fotoğraf tahmini. Kaynak kullanıcıya gösterilir; aynı değerler sessizce birleştirilmez.

## İlerleme fotoğrafları

Ön, yan ve arka fotoğraf private bucket'ta tutulur; public URL yoktur, görüntüleme signed URL kullanır. Opsiyonel biyometrik kilit uygulanabilir. Görseller analitiğe gönderilmez ve kullanıcının açık eylemi olmadan AI'a aktarılmaz.

Fotoğraftan ölçü deneysel ve ileri fazdır. Boy, mesafe, standart duruş, ön/yan görüntü ve çekim kılavuzu ister. Sonuç tek sayı yerine aralık ve kamera/kıyafet/duruş uyarısı taşır.

## HealthKit ve Health Connect

İlk veri türleri: adım, aktif enerji, yürüme/koşma mesafesi, antrenman, kilo ve boy.

İzin akışı bağlamsaldır:

1. Kullanıcı ilgili özelliği açar.
2. Calouch faydayı ve istenen veri türünü açıklar.
3. Kullanıcı `Bağla` eylemini seçer.
4. OS izin ekranı açılır.
5. Yalnızca gerekli türler istenir.
6. Ayarlarda erişim yönetimi sunulur.

Onboarding'de toplu ve zorunlu izin istenmez. Manifest/entitlement ve mağaza beyanı gerçek kullanılan türlerle aynı olmalıdır.

## Senkronizasyon ve deduplication

Her kaynak kayıt platform record ID, kaynak app/cihaz, başlangıç/bitiş, tür, sync zamanı ve dedup key/hash taşır. Sync cursor veri türü ve bağlantı bazlı tutulur.

- Yeniden sync çift kayıt üretmez.
- Kaynak silme/güncelleme davranışı adaptör testinde belirlenir.
- Timezone ve gün sınırı açıkça modellenir.
- Manuel kayıt ile health kaydı otomatik olarak aynı kayıt sayılmaz.
- Kullanıcı bağlantıyı kesince token/izin durumu güncellenir; kendi kayıtları politika gereği korunur veya silinir.

## Aktivite motoru

Yürüme, koşu, yüzme, bisiklet, takım/raket sporları, kürek, ip, yoga, pilates, HIIT, ağırlık, dans, bahçe ve özel aktivite desteklenebilir. Tahmini enerji; kilo, süre, mesafe, tempo, yoğunluk, MET, nabız ve varsa platform aktif enerjisini kullanır.

Platformdan gelen aktif enerji mevcutsa çift hesap yapılmaz. Sonuç `tahmini yakılan enerji` olarak gösterilir. `activity-engine` formül ve MET veri sürümünü kaydeder.

## Kabul kriterleri

- Health izni reddedilmiş/revoke edilmiş kullanıcı uygulamayı ve manuel ölçüyü kullanır.
- Incremental sync ve tekrar deneme çift kayıt üretmez.
- iOS/Android adaptörleri aynı normalize domain tipini döndürür.
- Timezone/DST ve birim dönüşümü test edilir.
- Progress photo başka kullanıcı veya public URL ile erişilemez.
- Health değerleri analitik/log payload'ına girmez.
- Aktivite hesabı kaynak ve `estimated` etiketiyle gösterilir.

