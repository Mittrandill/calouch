# Ajan İş Emirleri

Bu dosya, PRD'nin tamamını kodlanabilir atomik işlere böler. Ürün kararlarında kaynak `Calouch PRD v3.0.pdf`; bu liste yalnızca teslimat sözleşmesidir.

## Kimliklerin kaynağı

İş kimlikleri uydurulmamıştır: `11-delivery-roadmap.md` içindeki bağımlılık grafiği `FND-01`, `FND-04`, `MVP-01`–`MVP-05`, `MVP-08`–`MVP-11`, `MVP-14`–`MVP-17` ve `MVP-19`'u adıyla sabitler. Bu dosya onları korur.

Grafikte numarası geçip adı verilmeyen işler (`FND-02`, `FND-03`, `MVP-06`, `MVP-07`, `MVP-12`, `MVP-13`, `MVP-18`) faz/dalga tanımlarından **türetilmiştir** ve aşağıda `türetilmiş` işaretini taşır. Kaynak PDF'te iş kimliği listesi yoktur; bu türetmeler `14-open-decisions.md` üzerinden onaya tabidir.

## Sözleşme

Her iş ancak kod, migration, test, dokümantasyon ve gerekli telemetry birlikte tamamlandığında biter. Sağlık verisi, ödeme, AI kredisi, RLS veya hesap silme içeren işler güvenlik testi olmadan tamamlanmış sayılmaz.

Commit/PR açıklaması iş kimliği ve PRD bölümü taşır:

```text
Implements: MVP-08
PRD: §10.1-10.5, §11.2, §43
```

## Durum

| Durum | Anlam |
|---|---|
| `done` | Kabul kriterleri karşılandı ve doğrulandı |
| `partial` | Bir kısmı teslim edildi; kalanı aynı kimlik altında |
| `todo` | Başlanmadı |
| `blocked` | Harici karar/hesap/hukuk bekliyor (`14-open-decisions.md`) |

---

## Faz 0 — Temel sistem

### FND-01 — Repo, CI/CD ve gözlemlenebilirlik
**Durum:** `partial` · **PRD:** §40, §41 · **Bağımlılık:** —

pnpm/Turborepo monorepo, git remote, PR kapıları (typecheck, lint, test, Expo Doctor, dependency audit, secret scan, migration lint, RLS testi, build), hata/crash raporlama ve log redaksiyonu.

**Kabul:** CI kapıları PR'da çalışır; bundle secret taraması geçer; redaksiyon testlidir.
**Kalan:** Sentry (veya eşdeğeri) adapter'ı — şu an `reportError` konsola yazıyor. Sağlayıcı seçimi açık.

### FND-02 — Monorepo sınırları ve Development Build
**Durum:** `partial` · **PRD:** §6.1–6.4, §40 · **Bağımlılık:** FND-01 · `türetilmiş`

`apps/*` ve `packages/*` sınırları; domain paketlerinin UI/framework bağımsızlığı; Expo Development Build (Expo Go değil); New Architecture + Hermes.

**Kabul:** §01 mimari kabul kriterleri; iki platformda development build açılır.
**Kalan:** iOS development build — `blocked`, Apple Developer hesabı yok.

### FND-03 — Tasarım tokenları
**Durum:** `done` · **PRD:** §7.4–7.11 · **Bağımlılık:** FND-01 · `türetilmiş`

Semantik renk/spacing/radius/shadow/tipografi token'ları; system/light/dark/OLED; tabular numeric; ham hex/px yasağı.

**Kabul:** Kod içinde ham renk/radius/spacing yok (ESLint); dört tema aynı token şeklini taşır; WCAG AA kontrastı testli.

### FND-04 — Veri temeli ve RLS sözleşmesi
**Durum:** `partial` · **PRD:** §28–34 · **Bağımlılık:** FND-01/02/03

Şema sınırları (`public`/`private`/`audit`/`catalog`/`billing`), RLS deseni, pgTAP test altyapısı.

**Kabul:** Exposed her tablo RLS/grant envanterinde ve çapraz kullanıcı testinde.
**Kalan:** `audit`, `catalog`, `billing` şemaları ilgili domain işiyle birlikte açılır — kullanılmayan yüzey önceden yayınlanmaz (§00).

---

## Faz 1 — Mağaza MVP

### Dalga 1A — İskelet

#### MVP-01 — Auth
**Durum:** `partial` · **PRD:** §8.1 · **Bağımlılık:** FND-04

E-posta/şifre, Google, Apple, şifre sıfırlama, magic link, opsiyonel biyometrik kilit. `profiles` auth hesabından ayrı. Token SecureStore'da.

**Veri sınıfı:** Kimlik (yüksek hassasiyet).
**Kabul:** Başarı, iptal, hata ve session restore durumları çalışır.
**Kalan:** Google/Apple/magic link/şifre sıfırlama bağlanmadı; ekranda `disabled` duruyor. Apple ile giriş, platform kuralı gerektirdiğinde görünür olmalı.

### Dalga 1B — Deterministik çekirdek

> Bu dalga AI'dan **önce** bitmelidir (§11).

#### MVP-02 — Onboarding ve hedef motoru
**Durum:** `partial` · **PRD:** §8.2–8.4 · **Bağımlılık:** MVP-01

Adımlı onboarding; ad/doğum yılı/boy/kilo/aktivite/hedef/tercih/birim/dil/bildirim. Bazal metabolizma, günlük enerji, kalori/protein/karb/yağ/lif/su hedefi. Formül **sürümlü**.

**Veri sınıfı:** Sağlıkla ilişkilendirilebilir (yüksek).
**Kabul:** Hedef hesabı unit testli ve sürümlü; manuel override korunur; yarıda kalan onboarding devam eder; izin reddi bloklamaz; riskli düşük hedef uyarılır ve tıbbi tavsiye verilmez.

**Bitti:**
- `packages/nutrition-engine` — Mifflin-St Jeor v1 hedef motoru, saf TypeScript, 47 unit test. Deterministik ve sürümlü; güvenlik tabanı ve uyarılar dahil.
- `profiles` onboarding + hedef kolonları, kısıtlar motorun doğrulamasını aynalar, 14 pgTAP testi.
- §8.2'de olmayan `biological_sex` alanı eklendi — karar ve gerekçe `14-open-decisions.md`'de.

**Kalan:**
- Adımlı onboarding ekranları ve yarıda kalanı sürdürme.
- Hedef düzenleme ekranı; `goal_overrides` okuma/yazma (etkin değer = override ?? hesaplanan).
- Riskli hedef uyarısı ve profesyonel destek önerisinin UI'da gösterimi.
- Kilo/hedef değişince yeniden hesaplama tetiği.
- Alerji alanı — `blocked`, envelope encryption kararına bağlı (§09).

#### MVP-03 — Besin şeması ve kataloğu
**Durum:** `done` · **PRD:** §12–13 · **Bağımlılık:** FND-04

`catalog` şeması, besin verisi, **sürümleme**, arama, özel besin.

**Kabul:** Kalori/makro sürümlü veriden gelir ✅; arama offline son besinleri kapsar — offline kısmı MVP-05'e ait (henüz yok).

**Bitti:** foods/food_versions/food_nutrients/food_portions/food_translations/food_aliases/brands/food_sources/barcodes; karma sahiplik RLS (global + kullanıcı özel besini); `public.search_foods`/`public.food_detail` (TR/EN aksan-duyarsız arama, pg_trgm+unaccent); 15 pgTAP testi; 15 besinlik başlangıç seed'i (üretim ölçeği değil — kaynak seçimi `14-open-decisions.md`'de açık karar).

**Mimari not:** `catalog` şeması Data API'ye doğrudan açık değil; istemci yalnız `public` şemasındaki SECURITY INVOKER fonksiyonlar üzerinden erişir (§09 view/security_invoker deseni).

#### MVP-04 — Nutrition engine (öğün hesabı)
**Durum:** `done` · **PRD:** §12–14 · **Bağımlılık:** MVP-03

Deterministik hesap motoru. Saf TypeScript — RN/veri erişimi importu yasak (ESLint zorlar).

**Kabul:** Değişmez kural karşılandı ✅. Unit test kapsamı: 21 test (`packages/nutrition-engine/src/meals/`).

**Bitti:** `nutrientsForGrams`, `sumNutrients` (eksik opsiyonel nutrient TOPLAMDA `undefined` kalır, sessizce sıfırlanmaz — test edildi), `divideNutrients`, `nutrientsForRecipe`, `roundNutrientsForDisplay` (yuvarlama yalnız gösterim katmanında).

#### MVP-05 — Manuel öğün
**Durum:** `done` · **PRD:** §14 · **Bağımlılık:** MVP-04

Öğün + kalem/snapshot atomik yazılır. Offline taslak + outbox.

**Kabul:** Öğün+kalem tek transaction ✅; offline retry çift kayıt üretmez ✅ (sunucu tarafı idempotency, aşağıda).

**Bitti:** `meal_entries`/`meal_entry_items`/`meal_entry_snapshots` (§03 snapshot ve sürümleme — katalog sonradan değişse de eski öğün donmuş kalır); tek yazma yolu `public.log_meal()` (SECURITY DEFINER, client'a tablolarda INSERT verilmez); `operation_id` ile sunucu tarafı idempotency; `daily_nutrition_summary` (eksik opsiyonel nutrient'ı sessizce sıfırlamayan toplam); arama → miktar/porsiyon → öğün türü → kaydet akışı (`add-meal.tsx`) ve günlük ekranı; 21 pgTAP testi (pozitif akış, idempotency, çapraz kullanıcı izolasyonu, snapshot değişmezliği, RLS/GRANT negatifleri).

**Kalan:** Tam istemci tarafı offline outbox (cihaz kapalıyken kuyruğa alma, SQLite) — ayrı bir mobil mimari altyapı işi, tek MVP'ye ait değil; bkz. `14-open-decisions.md`. Öğün kompozisyonunu düzenleme (kalem ekleme/çıkarma) bu dalgada yok — kullanıcı yanlış öğünü soft-delete edip yeniden kaydeder.

#### MVP-06 — Tarif ve su
**Durum:** `done` · **PRD:** §13–14 · **Bağımlılık:** MVP-05 · `türetilmiş`

Tarif oluşturma/düzenleme/öğüne ekleme, su takibi, favori besin. Kapsam `03-nutrition-core.md`'deki "Tarifler"/"Su takibi" bölümlerinden ve MVP-05'in kapsam-dışı notundan (`favorite_foods`) türetildi.

**Kabul:** Gram/porsiyon/tarif/günlük toplam yuvarlama testleri geçer ✅; geçmiş öğün katalog güncellemesinden etkilenmez ✅ (tarif sürüm pinlemesi + snapshot); özel besin/tarif başkası tarafından okunamaz ✅; öğün+kalem atomik ✅ (tarif kalemi de aynı `log_meal()` yoluyla). Su offline tam outbox'ı `MVP-05`'teki gibi kapsam dışı (aşağıda).

**Bitti:**
- `recipes`/`recipe_versions`/`recipe_items` — `catalog.foods`'tan bağımsız, versiyonlanmış kullanıcı içeriği (§03 "Tarif sürümlüdür; eski öğün eski tarif snapshot'ını korur"). Tek yazma yolu `public.save_recipe()` (SECURITY DEFINER, düzenleme yeni sürüm oluşturur, eskisi değişmez).
- `log_meal()` tarif kalemlerini de kabul edecek şekilde genişletildi (`meal_entry_items`'a nullable `recipe_id`/`recipe_version_id`/`recipe_servings`, tam bir kaynak zorunlu kılan CHECK). Tarif toplaması eksik opsiyonel nutrient'ı (`sugar_g` vb.) sessizce sıfırlamaz — `daily_nutrition_summary`'deki aynı sınıf düzeltme burada da uygulandı.
- `water_logs` + `daily_water_summary` — tek tablo, client doğrudan INSERT (SECURITY DEFINER gerektirmez), `operation_id` UNIQUE ile idempotency.
- `favorite_foods` + `list_favorite_foods` — basit yıldızlama, `search_foods` ile aynı dönüş şekli.
- Mobile: tarif oluşturma/düzenleme ekranı (`recipe-builder.tsx`), tarif listesi (`recipes.tsx`), su kartı + tek dokunuş/özel miktar (`diary.tsx`), add-meal akışına tarif/favori seçimi entegre edildi.
- 21 (recipes) + 17 (water_logs) + 11 (favorite_foods) pgTAP testi — pozitif akış, idempotency, sürüm/snapshot değişmezliği, çapraz kullanıcı izolasyonu (hem tarif hem tarifte kullanılan özel besin), eksik nutrient NULL-güvenliği, anon reddi.
- Sistemik güvenlik bulgusu: `anon` rolünün `public` şema fonksiyonları için PUBLIC'ten bağımsız kendi varsayılan EXECUTE grant'i olduğu ampirik olarak bulundu ve düzeltildi — bkz. `14-open-decisions.md` "`anon` EXECUTE varsayılanı".

**Kalan:**
- Tam istemci tarafı offline outbox (su + tarif dahil) — MVP-05 ile aynı gerekçeyle mobil mimarinin geneline ait, ayrı iş.
- Su hatırlatma bildirimleri, günlük/haftalık grafik — bildirim altyapısı ve chart bileşeni henüz yok.
- Tarif kalemlerinde mikronutrient toplama (birden çok malzemenin jsonb'sini anahtar bazında birleştirme) — kapsam dışı, `14-open-decisions.md`'de kayıtlı.
- Widget/ses/wearable su entegrasyonları — §03 "ileri faz adaptörleri".

#### MVP-07 — Ölçü ve kilo
**Durum:** `partial` · **PRD:** §15–16 · **Bağımlılık:** MVP-02 · `türetilmiş`

Kilo/ölçü kaydı ve trend. İlerleme fotoğrafı **private** storage.

**Veri sınıfı:** Sağlık + medya (yüksek).

**Bitti:**
- `body_measurements` (17 nullable metrik kolonu — EAV değil, geniş tablo; §05 "aynı değerler sessizce birleştirilmez" kabul kriteri satır bazlı kaynak ayrımıyla sağlanır) + `operation_id` idempotency + fiziksel akla yatkınlık CHECK'leri (nutrition-engine'in kendi aralıklarıyla eşleştirilmiş) + `weight_trend()` RPC (SECURITY INVOKER).
- `progress_photos` — `progress-photos` private bucket + storage.objects RLS (`{user_id}/{photo_id}.ext` yol sözleşmesi, hem storage hem metadata tablosunda çift katman kontrol) + signed URL üretimi (600s TTL). Public URL yok.
- Mobile: `measurements.tsx` (kilo hızlı giriş + "diğer ölçüler" genişleyen form + geçmiş listesi), `progress-photos.tsx` (açı seçimi, kamera/galeriden yükleme, silme, opsiyonel Face ID/parmak izi kilidi — `useBiometricLockPreference`/`useBiometricGate`). Profil sekmesinden giriş linki.
- Kilo girildiğinde hedef motorunun yeniden tetiklenmesi (`useLogMeasurement` içinde, onboarding.tsx ile aynı çağrı deseni).
- 18 (body_measurements) + 12 (progress_photos) pgTAP testi yazıldı — pozitif akış, aralık/has-value CHECK'leri, idempotency, çapraz kullanıcı izolasyonu, soft-delete, anon reddi, DELETE grant'inin yokluğu. **Bu ortamda Docker/yerel Postgres olmadığı için `supabase test db` ile ÇALIŞTIRILAMADI** — merge öncesi CI'da veya yerel Docker ile doğrulanmalı.
- **E2E doğrulama (Chrome + `expo start --web`, gerçek Supabase projesine karşı, test hesabı `calouch.local.test+uiverify@gmail.com`):** ölçü formu → kaydet → geçmiş listesi → profil `weight_kg` güncellemesi → hedef motoru yeniden hesabı (`target_calories_kcal` değişti) zinciri uçtan uca çalıştı; ilerleme fotoğrafı kilit tercihi (kalıcı, donanımsız cihazda sessiz devre dışı), açı seçimi, galeriden yükleme (storage.objects'e gerçek dosya + doğru `{user_id}/{uuid}` yolu) ve silme (storage'dan gerçek silme + metadata soft-delete) doğrulandı.
- Bu doğrulama sırasında **gerçek bir hata bulundu ve düzeltildi**: `useBiometricLock.ts` doğrudan `expo-secure-store` çağırıyordu; bu paketin web karşılığı yok (`authStorage.ts`'teki bilinen sınırlama) ve ekranı web'de çökertiyordu. `webDevStorage` deseni uygulanarak düzeltildi (yalnız web dev-browsing dalını etkiler, iOS/Android'de zaten SecureStore kullanılıyordu).

**Kalan:**
- Ölçü geçmişinde düzenleme/silme aksiyonu yok — kullanıcı yanlış ölçüyü yeni kayıtla düzeltir (MVP-05'teki aynı kapsam-dışı gerekçe).
- Tam istemci tarafı offline outbox — MVP-05/06 ile aynı gerekçeyle mobil mimarinin geneline ait, ayrı iş.
- HealthKit/Health Connect/akıllı tartı senkronizasyonu — `source` kolonu bunu kabul edecek şekilde baştan geniş tutuldu, gerçek adaptör MVP-12'de.
- Fotoğraftan ölçü tahmini — §05 "deneysel ve ileri fazdır", kapsam dışı (bkz. migration yorumu, `14-open-decisions.md`).
- `storage.objects` RLS politikaları pgTAP ile test edilmedi (gerçek upload/silme akışı yukarıdaki E2E testinde dolaylı olarak doğrulandı, ama izole pozitif/negatif pgTAP testi yok).
- Kamera ile fotoğraf çekimi (`launchCameraAsync`) test edilmedi — bu ortamda webcam yok; gerçek cihazda denenmeli.
- pgTAP testleri hâlâ Docker'da çalıştırılıp doğrulanmadı (yukarıdaki E2E, veritabanı davranışını kanıtlıyor ama pgTAP dosyalarının kendisinin sözdizimsel/mantıksal olarak eksiksiz çalıştığını KANITLAMAZ).

### Dalga 1C — AI ve dashboard

#### MVP-08 — AI kontratları ve private medya
**Durum:** `partial` · **PRD:** §10–11 · **Bağımlılık:** MVP-04, MVP-05

Private media upload, provider adapter, request/response şeması, Zod validation, idempotency, rate limit, correlation ID, maliyet/kill switch.

**Kabul:** Gemini anahtarı istemciye girmez; hassas bucket public değil; signed URL expiry testli.

**Kapsam kararı:** Bu iş, Gemini'den doğrulanmış HAM aday listesini (yiyecek adları, porsiyon aralığı, güven) dönen bir dikey dilim olarak sınırlandı. Katalog eşleştirme ve kalori/makro hesabı MVP-09'un işi — bkz. `supabase/functions/analyze-meal-photo/index.ts` üstündeki kapsam notu.

**Bitti:**
- `private` şeması ilk kez açıldı (`ai_jobs`/`ai_usage_ledger`/`ai_feature_flags`) — yalnız `public.create_ai_job`/`complete_ai_job`/`fail_ai_job` SECURITY DEFINER RPC'leri üzerinden erişilir (`log_meal()`/`catalog` şemasıyla AYNI desen). Data API `private`'ı yayınlamaz.
- **Sıfır servis rolü mimarisi:** Edge Function kullanıcının kendi JWT'siyle çalışır — storage indirme/silme ve RPC'ler kullanıcının kendi RLS/`auth.uid()` kontrolüyle işler. `GEMINI_API_KEY` tek server secret'tır.
- `ai-meal-photos` private bucket — `progress-photos` ile birebir aynı RLS deseni (`{user_id}/{uuid}.jpg`).
- `packages/types/src/ai.ts` — `AIProvider`/`MealAnalysis`/`MealAnalysisItem` (yalnız `analyzeMealImage`, diğer §04 metodları henüz tasarlanmadığı için eklenmedi).
- `packages/validation` (yeni paket) — Zod şeması, `packages/types` ile `satisfies` üzerinden derleme-zamanı senkron kontrolü, 8 unit test.
- `supabase/functions/analyze-meal-photo` — deploy edildi (v2, `verify_jwt: true`). İş mantığı sonuçları (kill switch/rate limit/non-food/provider hatası) HTTP 200 + `{ok:false,code,message}` döner (yalnız gerçekten beklenmeyen durumlar non-2xx) — `supabase-js functions.invoke()`'ın non-2xx'te `data`'yı gizleme davranışını basitleştirmek için.
- Mobile: `camera.tsx` gerçek ekran oldu (placeholder'ın yerine) — fotoğraf çek/seç, `expo-image-manipulator` ile resize+EXIF temizliği, yükleme, sonuç önizleme listesi (kaydet aksiyonu YOK, bilinçli olarak "önizleme" etiketli).
- Gemini model: `gemini-2.5-flash`. Kota: kullanıcı başına günde 10 (billing sistemi gelene kadar geçici sabit) — bkz. `14-open-decisions.md` "Gemini model, maliyet tavanı ve kill switch" (Kapalı).
- `ai_jobs_test.sql` — 17 pgTAP testi (pozitif akış, idempotency, sahiplik kontrolü, çapraz kullanıcı izolasyonu, kill switch, rate limit, ledger, anon reddi).

**Kalan:**
- MVP-09: katalog eşleştirme + deterministik motor (bu iş kasıtlı olarak ham aday listesinde durdu).
- MVP-10: kullanıcı onay/düzenle/kaydet UI'ı.
- Gerçek Gemini yanıtıyla E2E doğrulama — bu ortamda kullanıcı kendi API anahtarını Supabase secret olarak eklemeyi kabul etti; edge function deploy edildi ama gerçek bir fotoğrafla uçtan uca çalıştırılıp doğrulanması ayrı bir adım.
- pgTAP testleri (Docker yok, MVP-07'dekiyle aynı sınırlama) ve `packages/validation`/mobile unit testleri dışında hiçbiri CI'da çalıştırılmadı.
- `storage.objects` RLS'i (ai-meal-photos) izole pgTAP testine sahip değil — yalnız metadata tablosuna erişim yok zaten (bu bucket'ın hiç metadata tablosu yok, doğrudan job'a bağlı).
- Fotoğraf saklama tercihi (kullanıcının "AI/fotoğraf kullanımı" tercihi, §09 gizlilik merkezi) yok — varsayılan HER ZAMAN analiz sonrası silme (MVP-16/17 kapsamında gerçek tercih eklenebilir).

#### MVP-09 — AI job pipeline
**Durum:** `todo` · **PRD:** §10–11 · **Bağımlılık:** MVP-08

`POST /v1/ai/meals/analyze`, `GET /v1/ai/jobs/:id`; schema validation → katalog eşleştirme → deterministik motor.

**Kabul:** AI çıktısı doğrudan kalori yazmaz; katalog eşleşmesi üzerinden hesaplanır.

#### MVP-10 — Kullanıcı doğrulaması
**Durum:** `todo` · **PRD:** §10.1, §11 · **Bağımlılık:** MVP-09

Taslak sunumu: toplam tahmin + **aralık** + güven seviyesi. Onay/düzenle/ekle/yeniden analiz/sil.

**Kabul:** Değişmez kural: "AI yalnızca tahmin veya taslak üretir; kullanıcı onayı olmadan öğün kalıcılaşmaz." Düşük güven açıkça işaretlenir.

#### MVP-11 — Bugün ekranı
**Durum:** `todo` · **PRD:** §9 · **Bağımlılık:** MVP-10

Kart kataloğu, sıralama/görünürlük/odak kartı; tercih hesaba yazılır, offline okunur, cihazlar arası senkron.

**Kabul:** Boş/loading/offline/hata/dolu durumları; kart düzenleme erişilebilir ve kalıcı; hiçbir health değeri analitiğe girmez.

### Dalga 1D — Health ve gelir

#### MVP-12 — Health ve aktivite
**Durum:** `todo` · **PRD:** §17 · **Bağımlılık:** MVP-02 · `türetilmiş`

HealthKit/Health Connect, temel adım/aktif enerji. Native entegrasyon kapısı (§01) uygulanır.

**Kabul:** Health izni reddedilse de manuel öğün/su/ölçü/antrenman çalışır; health işi temel özellikleri bloklamaz.

#### MVP-13 — Paywall ve restore
**Durum:** `todo` · **PRD:** §26–27 · **Bağımlılık:** MVP-14 · `türetilmiş`

#### MVP-14 — Ürün kataloğu ve store bağlantısı
**Durum:** `blocked` · **PRD:** §26–27 · **Bağımlılık:** MVP-01

StoreKit / Play Billing. Store hesapları olmadan ilerlemez.

#### MVP-15 — Server-verified entitlement
**Durum:** `blocked` · **PRD:** §26–27 · **Bağımlılık:** MVP-14

`billing` şeması, webhook doğrulama, entitlement geçişi (atomik), AI kredi ledger'ı.

**Kabul:** Entitlement istemci iddiasına güvenmez; ledger reserve/refund atomik. Tek sorumlu uçtan uca ele alır (§11).

### Dalga 1E — Gizlilik ve yayın

#### MVP-16 — Consent ve versiyonlama
**Durum:** `blocked` · **PRD:** §29–33 · **Bağımlılık:** FND-04 + tüm kullanıcı domainleri

Consent kaydı: tür, belge sürümü, dil, zaman, app sürümü, verildi/reddedildi/geri çekildi.

**Kabul:** Consent sürümü ve withdrawal davranışı etkiler. Hukuk metinleri olmadan kapanmaz.

#### MVP-17 — Hesap silme ve export
**Durum:** `todo` · **PRD:** §33–34 · **Bağımlılık:** MVP-16

Silme retry edilebilir state machine; uygulama içi + public web yolu. Export JSON/CSV/PDF, private bucket, kısa signed URL.

**Kabul:** Silme uçtan uca tekrar denenebilir; yarım silme görünür; export yalnız kullanıcı verisini içerir ve expiry sonrası indirilemez. Tek sorumlu uçtan uca ele alır (§11).

#### MVP-18 — Hukuki yüzeyler, erişilebilirlik ve store hazırlığı
**Durum:** `blocked` · **PRD:** §33, §39, §43 · **Bağımlılık:** MVP-16 · `türetilmiş`

Privacy/terms/KVKK yüzeyleri, App Privacy / Data Safety / Health declaration, erişilebilirlik denetimi.

#### MVP-19 — Yayın
**Durum:** `blocked` · **PRD:** §43–44 · **Bağımlılık:** tüm MVP işleri

Çıkış kapısı `12-quality-release.md` içindeki release kriterlerinin tamamıdır.

---

## Faz 2+ — İleri fazlar

Kimlikler `11-delivery-roadmap.md` grafiğinde grup olarak geçer (`TRN-*`, `COACH-*`, `VOICE-*`, `POSE-*`, `ADV-*`) ve tek tek numaralandırılmamıştır. Numaralandırma, ilgili faz başlamadan önce bu dosyaya eklenir — erken numaralandırma, yayınlanmayacak yüzeyi sözleşmeye çevirir (§00).

| Grup | Kapsam | PRD | Ön koşul |
|---|---|---|---|
| `TRN-*` | Egzersiz kataloğu → program → session/set → rest timer → PR/activity → widget | §18–20 | MVP-19 |
| `COACH-*` | Yazılı AI hoca: conversation/safety → read-only tools → confirmed mutation → plan taslağı | §21–24 | Billing credit ledger (MVP-15), domain API'leri |
| `VOICE-*` | Sesli hoca: ephemeral token → Live session → voice quota → fallback STT/TTS | §21–24 | Gemini Live preview durumu doğrulanmadan production varsayılanı olmaz |
| `POSE-*` | Cihaz içi form: frame processor → MediaPipe → state machine → local feedback | §21–24 | İlk on hareket ayrı feature flag |
| `ADV-*` | Video form, fotoğraftan ölçü, wearable, challenge, adaptif program | §21–24 | Her deneysel ölçüm aralık/confidence ve ayrı consent taşır |

## Paralel çalışma sınırları

`11-delivery-roadmap.md` §"Paralel çalışma sınırları" bağlayıcıdır. Özetle: aynı migration dosyasını tek ajan sahiplenir; shared type değişikliği önce küçük kontrat PR'ı olur; RLS, billing ledger, delete pipeline ve AI credit işleri tek sorumlu tarafından uçtan uca yapılır.
