# Kalite ve Yayın Kapıları

## Test piramidi

### Unit

Kalori/makro, porsiyon/tarif, hedef hesabı, MET, streak, AI schema, credit/entitlement, form state machine, idempotency ve RLS helper mantığı.

### Integration

Supabase Auth/RLS/Storage, Gemini job/fallback, HealthKit/Connect, StoreKit/Play Billing/webhook, push, delete ve export. Harici servis testleri deterministic fixture/sandbox ile ayrılır.

### E2E

Yeni kullanıcı, onboarding izin reddi, ilk AI fotoğrafı ve düzeltme, manuel öğün, su, ölçü, offline sync, abonelik/restore, hesap silme ve export. İleri fazlarda workout recovery, voice tool ve form analizi eklenir.

## Güvenlik test matrisi

- Her kullanıcı tablosunda owner / other user / anon matrisi.
- Her private bucket'ta list/read/write/delete ve signed URL expiry.
- API auth, role, ownership, rate, size, malformed input ve idempotency.
- Webhook signature, replay ve out-of-order.
- Secret scan ve mobile bundle inspection.
- Log/analytics fixture'larında yasak alan taraması.
- Delete/export çapraz kullanıcı ve yarım iş retry senaryosu.

## AI yemek evaluation

Türk kahvaltısı, kuru fasulye-pilav, mantı, döner/kebap, çorba, zeytinyağlı, salata, karışık/soslu tabak, fast food, paketli ürün, kısmen yenmiş, düşük ışık, çoklu tabak ve non-food örnekleri bulunur.

Rapor en az schema pass, food detection/eşleşme, gram aralığı coverage, correction rate, latency, failure ve birim maliyeti içerir. Dataset hassas veri içermemeli veya açık kullanım hakkı taşımalıdır.

## Pose evaluation

Boy/vücut tipi/kıyafet/ışık/açı/profil/kısmi görünürlük ile doğru-hatalı ve hızlı-yavaş tekrarlar. Hareket başına rep precision/recall, state transition error, feedback doğruluğu, confidence rejection ve cihaz performansı ölçülür.

## MVP release checklist

- Development Build kullanılıyor; Expo Go ve New Architecture uyumsuz paket yok.
- Gemini key istemcide değil; AI limit/kill switch aktif.
- Fotoğraf analizi, düzenleme ve confirmation çalışıyor; onaysız kayıt yok.
- Kalori besin snapshot'ından hesaplanıyor; manuel öğün, su, ölçü ve temel adım çalışıyor.
- Health izni reddi temel uygulamayı bozmuyor.
- Tüm kullanıcı tablolarında testli RLS; tüm hassas görseller private.
- Abonelik server verified; restore çalışıyor.
- Uygulama/web hesap silme ve export çalışıyor.
- Aydınlatma/açık rıza ayrılmış; privacy center tamam.
- App Privacy, Data Safety ve Health declaration gerçek davranışla eşleşiyor.
- Türkçe/İngilizce, light/dark ve erişilebilirlik kontrolü tamam.
- Crash reporting aktif ve hassas veri maskelemesi doğrulanmış.
- TestFlight ve Play test kanalları tamamlanmış.

## Definition of Done

Her iş için:

- Kabul kriterleri otomatik test veya tekrarlanabilir manuel senaryoyla kanıtlanır.
- Loading/empty/error/offline/permission-denied durumları ele alınır.
- Schema değişikliği migration, RLS, rollback/forward plan ve seed/test içerir.
- API değişikliği request/response validation ve hata kontratı içerir.
- Yeni analitik yalnız allowlist şemasıyla eklenir.
- Yeni native capability izin/manifest/entitlement ve gerçek cihaz testini içerir.
- Kullanıcı metni Türkçe/İngilizce ve erişilebilirlik etiketiyle gelir.
- İlgili PRD/work-order kimliği PR açıklamasındadır.

## Release metrikleri

Ürün funnel: ilk gün scan completion, scan-to-save, correction, haftalık öğün/antrenman, su/form/voice kullanımı ve retention kohortları.

Ticari: Free->Plus, Plus->Coach, yıllık/lifetime oranı, renewal/refund, kullanıcı başı AI maliyeti ve brüt marj.

Teknik: crash-free session, AI error/latency, voice latency, health sync, delete success ve billing webhook error.

Metrik hedef değerleri `14-open-decisions.md` içinde release öncesi belirlenir; health veya öğün içeriği analitiğe eklenmez.

