# Beslenme Çekirdeği

## Amaç

Fotoğraf analizi olmasa bile tam çalışan, offline uyumlu bir öğün günlüğü ve deterministik besin hesap motoru sağlamak.

## Öğün oluşturma yöntemleri

Besin arama, son/sık kullanılan, barkod, etiket, fotoğraf, serbest metin, tarif, önceki öğün/gün kopyalama ve özel besin. AI tabanlı yöntemler taslak üretir; kullanıcı onaylar.

Öğün türleri kahvaltı, ara öğün, öğle, akşam, antrenman öncesi/sonrası, gece ve kullanıcı tanımlıdır.

## Temel veri modeli

Katalog:

- `foods`, `food_translations`, `food_aliases`.
- `food_nutrients`, `food_portions`, `food_sources`, `food_versions`.
- `brands`, `barcodes`.

Kullanıcı içeriği:

- `recipes`, `recipe_versions`, `recipe_items`.
- `meal_entries`, `meal_entry_items`, `meal_entry_snapshots`.
- `favorite_foods` ve özel besin sahipliği.

Her kullanıcı tablosunda `id`, `user_id`, `created_at`, `updated_at`, `deleted_at`, `version` standardını uygula. Kesin tip ve null kuralları migration işinde belirlenir.

## Besin kaydı

Bir besin en az ad/yerelleştirilmiş ad/alias, marka, barkod, kategori, ülke, porsiyonlar, 100 g besin değerleri, kaynak, kaynak sürümü, doğrulama durumu ve kalite skoru taşır. Enerji, protein, karbonhidrat, şeker, yağ, doymuş yağ, lif, sodyum ile desteklenen mikro besinler modellenir.

Kaynak önceliği: doğrulanmış Calouch temel verisi, Türk yemekleri, güvenilir uluslararası kaynak, markalı/barkodlu ürün, kullanıcı özel besini/tarifi. Kaynağı olmayan hesap sonucu gösterilmez.

## Snapshot ve sürümleme

Katalog verisi değişse bile eski öğünün kalori/makrosu değişmez. Kayıt sırasında kullanılan besin sürümü, porsiyon girdisi ve hesaplanmış besin değerleri `meal_entry_snapshots` ile sabitlenir. Düzenleme yeni snapshot/version oluşturur; audit izi korunur.

## Hesap motoru

`nutrition-engine` saf ve deterministik olmalıdır:

- 100 g değerini gram/porsiyona dönüştürür.
- Tarif toplamını malzemelerden hesaplar ve porsiyona böler.
- Öğün ve günlük toplamı üretir.
- Eksik nutrient değerini sıfırmış gibi sessizce sunmaz; veri kalitesini taşır.
- Yuvarlama yalnızca gösterim katmanında yapılır.

Kalori ve makro hesapları AI çıktısından alınmaz.

## Tarifler

Kullanıcı tarif oluşturur, malzeme ve gram ekler, porsiyon sayısı belirler, porsiyon değerini görür, kopyalar, özel tutar ve öğüne ekler. Tarif sürümlüdür; eski öğün eski tarif snapshot'ını korur.

## Serbest metin ve etiket

Serbest metin/etiket parser'ı yapılandırılmış `MealDraft` üretir. Bilinmeyen veya düşük güvenli eşleşme kullanıcıya sorulur. Doğrudan `meal_entries` yazılmaz.

## Su takibi

Günlük hedef, tek dokunuş, özel bardak, son kullanılan miktar, günlük/haftalık grafik ve hatırlatma içerir. Su girişi offline yazılabilir. Hatırlatma; uyanma, sessiz saat, kalan hedef ve geçmiş davranışı dikkate alır. Widget/ses/wearable entegrasyonları ileri faz adaptörleridir.

## Offline davranış

Manuel öğün taslağı, su ve son kullanılan besinler offline çalışır. Mutation'lar operation ID ile outbox'a girer. Tekrar gönderim çift öğün/su üretmez. Version çatışmasında sessiz overwrite yapılmaz.

## Kabul kriterleri

- Gram, porsiyon, tarif, günlük toplam ve yuvarlama unit testleri geçer.
- Geçmiş öğün katalog güncellemesinden etkilenmez.
- Özel besin/tarif başka kullanıcı tarafından okunamaz.
- Öğün ve kalem kaydı transaction içinde atomiktir.
- Offline ekleme reconnect sonrası bir kez senkronize olur.
- Arama Türkçe/İngilizce ad ve alias ile sonuç verir.
- Taslak iptali kalıcı öğün oluşturmaz.

