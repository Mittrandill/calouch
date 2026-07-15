# Ürün Sözleşmesi

## Amaç

Calouch; beslenme, aktivite, vücut ölçüsü ve antrenman verilerini tek mobil deneyimde birleştiren kişisel AI sağlık ve fitness koçudur. Ana farklılaştırıcı, fotoğraftan yemek ve porsiyon tahmini yapıp sonucu kullanıcı doğrulamasından sonra günlüğe kaydetmektir.

Platformlar iOS ve Android'dir. Gelir modeli freemium, abonelik, tüketilebilir AI kredisi ve AI dışı kalıcı özellikleri açan Lifetime Core'dur.

## Kullanıcıya verilen temel cevaplar

Uygulama en az şu soruları yanıtlamalıdır:

- Bugün tüketilen ve kalan kalori ne kadar?
- Protein ve diğer makro hedefleri ne durumda?
- Su, adım ve aktif enerji ne durumda?
- Bugünkü antrenman ne ve önceki performansa göre ilerleme var mı?
- Kilo ve ölçü trendi nasıl?
- Bugün hedefe yaklaşmak için en önemli eylem ne?

## Hedef kullanıcılar

| Persona | Temel ihtiyaç |
|---|---|
| Kilo vermek isteyen | Tartmadan hızlı öğün kaydı, kalori açığı, su/adım ve haftalık trend |
| Kas geliştiren | Makrolar, set/tekrar/ağırlık, dinlenme, hacim ve kişisel rekor |
| Sağlıklı yaşam kullanıcısı | Katı diyet olmadan bütünsel alışkanlık görünümü |
| Evde spor yapan | Ekipmana göre hareket, kamera ile tekrar/form, sesli kayıt |
| İleri sporcu | RPE/RIR, 1RM tahmini, hacim, tempo, ROM ve kas grubu yükü |

## Ürün ilkeleri

### Fotoğraf merkezli

Ana sayfadan AI Kamera'ya en fazla tek dokunuşla ulaşılır. Kamera; öğün, etiket, barkod, form ve ilerleme fotoğrafı eylemlerine giriş olabilir.

### Belirsizlik görünürdür

AI sonucu tek kesin değer gibi gösterilmez. Toplam tahmin, muhtemel aralık ve güven seviyesi birlikte sunulur. Düşük güven, eksik görünürlük veya riskli öneri açıkça işaretlenir.

### Kullanıcı kontrolü

AI çıktısı daima taslaktır. Kullanıcı onaylayabilir, kalemleri/porsiyonu düzenleyebilir, eksik yiyecek ekleyebilir, yeniden analiz edebilir veya fotoğrafı silebilir.

### Gizlilik varsayılandır

Beslenme kayıtları, yemek/ilerleme fotoğrafları, ölçüler, sağlık verisi, antrenman, form analizi, AI sohbeti ve ses özel veridir. Ham ses ve canlı kamera görüntüsü varsayılan olarak kalıcı saklanmaz.

### Sağlık uygulaması sınırı

Calouch teşhis koymaz, tedavi veya ilaç önermez, profesyonel sağlık uzmanı gibi davranmaz ve güvenli sonuç garantisi vermez. Riskli derecede düşük hedeflerde uyarı ve profesyonel destek önerisi gösterilir.

### İzinlerden bağımsız temel kullanım

Health, bildirim, fotoğraf saklama ve analitik izinleri ayrı ve bağlamsal istenir. Red halinde manuel öğün, su, ölçü ve antrenman çalışır.

## Faz kapsamı

### İlk mağaza sürümü

- Auth ve onboarding.
- Özelleştirilebilir dashboard.
- Kalori/makro hedefi.
- Fotoğraftan yemek analizi ve kullanıcı doğrulaması.
- Manuel öğün, besin arama ve tarif.
- Su, kilo/ölçü ve temel adım.
- Türkçe/İngilizce, açık/koyu tema.
- Free/Plus, sunucu doğrulamalı ödeme ve restore.
- Uygulama içi hesap silme ve veri dışa aktarma.

### İlk sürüm dışında, mimaride öngörülecek

- Gelişmiş antrenman.
- Yazılı ve sesli AI hoca.
- Cihaz içi hareket formu.
- Video form raporu, fotoğraftan ölçü, wearable, challenge ve başarımlar.

İleri faz tabloları veya API'leri yalnızca mevcut fazı basitleştiriyorsa önceden oluşturulur; kullanılmayan ürün yüzeyi yayınlanmaz.

## Başarı tanımı

Ürün açısından ilk kritik funnel: onboarding -> ilk AI tarama -> düzeltme/onay -> öğün kaydı. Teknik açıdan kritik göstergeler crash-free session, AI hata/süre/maliyet, health sync ve billing webhook hata oranlarıdır.

## Kapsam dışı davranışlar

- AI'ın doğrudan nihai kalori yazması.
- Kullanıcı onayı olmadan kayıt veya plan aktivasyonu.
- Health iznini onboarding engeline dönüştürmek.
- Hassas içeriği analitik olayı veya uygulama loguna koymak.
- Canlı form videosunu varsayılan olarak sunucuya göndermek.
- Sağlıksız kilo verme, öğün atlama, susuzluk veya aşırı egzersiz challenge'ı.

