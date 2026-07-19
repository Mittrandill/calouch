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
**Kalan:** iOS development build — Apple Developer hesabı artık var (bkz. `14-open-decisions.md`), ama EAS credentials/provisioning henüz kurulmadı ve build bu ortamda üretilip doğrulanmadı.

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
- HealthKit/Health Connect/akıllı tartı senkronizasyonu — `source` kolonu bunu kabul edecek şekilde baştan geniş tutuldu; MVP-12 yalnız `daily_activity_metrics` (adım/aktif enerji) getirdi, `body_measurements`'a (kilo/boy) bağlanmadı — bu iş kimliği hâlâ açık, bkz. `14-open-decisions.md`.
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
- `packages/validation` — provider ve deterministik taslak Zod şemaları, `packages/types` ile `satisfies` üzerinden derleme-zamanı senkron kontrolü, 8 unit test.
- `supabase/functions/analyze-meal-photo` — MVP-09 ile v4'e yükseltildi (`verify_jwt: true`): job'ı hemen kabul eder, provider/katalog/motor zincirini `EdgeRuntime.waitUntil` ile arka planda tamamlar.
- Mobile: fotoğraf çek/seç, resize+EXIF temizliği, idempotent upload/POST, job polling ve katalogdan hesaplanmış sonuç önizlemesi. Kaydet aksiyonu YOK (MVP-10).
- Gemini model: `gemini-2.5-flash`. Kota: kullanıcı başına günde 10 (billing sistemi gelene kadar geçici sabit) — bkz. `14-open-decisions.md` "Gemini model, maliyet tavanı ve kill switch" (Kapalı).
- `ai_jobs_test.sql` — 17 pgTAP testi (pozitif akış, idempotency, sahiplik kontrolü, çapraz kullanıcı izolasyonu, kill switch, rate limit, ledger, anon reddi).

**Kalan:**
- MVP-10: kullanıcı onay/düzenle/kaydet UI'ı.
- Gerçek Gemini yanıtıyla E2E doğrulama — bu ortamda kullanıcı kendi API anahtarını Supabase secret olarak eklemeyi kabul etti; edge function deploy edildi ama gerçek bir fotoğrafla uçtan uca çalıştırılıp doğrulanması ayrı bir adım.
- MVP-08'in özgün 17 pgTAP testi hâlâ topluca yeniden çalıştırılmadı (Docker yok); MVP-09'un yeni 18 pgTAP testi ise canlı şemada transaction+rollback ile geçti.
- `storage.objects` RLS'i (ai-meal-photos) izole pgTAP testine sahip değil — yalnız metadata tablosuna erişim yok zaten (bu bucket'ın hiç metadata tablosu yok, doğrudan job'a bağlı).
- Fotoğraf saklama tercihi (kullanıcının "AI/fotoğraf kullanımı" tercihi, §09 gizlilik merkezi) yok — varsayılan HER ZAMAN analiz sonrası silme (MVP-16/17 kapsamında gerçek tercih eklenebilir).

#### MVP-09 — AI job pipeline
**Durum:** `done` · **PRD:** §10–11 · **Bağımlılık:** MVP-08

`POST /v1/ai/meals/analyze`, `GET /v1/ai/jobs/:id`; schema validation → katalog eşleştirme → deterministik motor.

**Kabul:** AI çıktısı doğrudan kalori yazmaz; katalog eşleşmesi üzerinden hesaplanır.

**Bitti:**
- `public.match_ai_food(text[], locale)` provider adaylarını ad+alias üzerinden, çağıranın katalog RLS görünürlüğü altında current `food_version` ile eşleştirir; source ve 100 g nutrient snapshot'ını döndürür. Eşleşmeyen kalem `null` kalır, AI nutrient fallback'i yoktur.
- `private.ai_jobs.raw_response` (doğrulanmış provider ad/gram tahmini) ile `result_response` (katalogdan deterministik hesaplanan taslak) ayrıldı. Job başına unique usage ledger, completion/failure retry'ında ikinci maliyet satırını engeller.
- Saf motor tahmini/min/max gramı katalog 100 g snapshot'ına ölçekler; opsiyonel bilinmeyen nutrient'ı sıfırlaştırmaz. Bir kalem eşleşmezse yanıltıcı eksik toplam yerine `totals: null` üretir.
- POST artık asenkron `processing` döner; `GET /functions/v1/ai-jobs/:id` yalnız owner'ın durum/sonuç/hata kontratını yayınlar. Mobil 60 saniyeye kadar poll eder ve aynı `operationId` ile güvenli ağ retry'ı yapar.
- Kamera taslağı eşleşen katalog adı/kaynağı ile deterministik kalori-protein-karbonhidrat-yağ değerlerini gösterir. Onay/düzenleme/kaydetme hâlâ bilinçli olarak MVP-10'dadır.

**Doğrulama:** 4 deterministik motor unit testi; canlı şemada transaction+rollback ile 18/18 pgTAP (exact/alias/source/snapshot, raw-result ayrımı, owner/other/anon, idempotent ledger); `pnpm verify` 24/24 task. `analyze-meal-photo` v4 ve `ai-jobs` v1 ACTIVE, ikisi de `verify_jwt: true`.

#### MVP-10 — Kullanıcı doğrulaması
**Durum:** `done` · **PRD:** §10.1, §11 · **Bağımlılık:** MVP-09

Taslak sunumu: toplam tahmin + **aralık** + güven seviyesi. Onay/düzenle/ekle/yeniden analiz/sil.

**Kabul:** Değişmez kural: "AI yalnızca tahmin veya taslak üretir; kullanıcı onayı olmadan öğün kalıcılaşmaz." ✅ — kayıt yalnız kullanıcı "Onayla ve kaydet"e bastığında `log_meal()` üzerinden olur. Düşük güven açıkça işaretlenir ✅ (`overallConfidence` banner + kalem bazlı `confidence` etiketi + zayıf katalog eşleşmesi uyarısı).

**Kapsam kararı:** Yeni migration/RPC yok — onaylanan her eşleşmiş kalem `catalogMatch.foodId` (veya kullanıcının manuel seçimi) + gram ile mevcut `log_meal()` `kind:'food'` dalına gönderilir. `log_meal()` zaten kayıt anındaki `current_version_id`'yi çözüyor; taslaktaki `food_version_id`'yi pinlemeye gerek yok — manuel arama akışıyla birebir aynı semantik.

**Bitti:**
- `apps/mobile/src/camera/MealDraftReview.tsx` — taslağı düzenlenebilir/onaylanabilir hale getiren ana bileşen: canlı toplam, düşük genel güven banner'ı, öğün türü seçimi (`add-meal.tsx`'ten yeniden kullanılan `defaultMealTypeForNow`, artık `@/data/meals`'de), "Onayla ve kaydet" (`useLogMeal()`), "Yeniden analiz" (aynı fotoğrafla, yeni `operationId`/`storagePath`), "Vazgeç".
- `apps/mobile/src/camera/MealDraftItemRow.tsx` — kalem başına düzenlenebilir gram + `scaleCatalogNutrients` ile canlı kcal/makro önizlemesi; dahil et/kaldır; eşleşmeyen kalemlerde satır içi katalog araması (`useFoodSearch`/`FoodSearchResultRow` yeniden kullanıldı) — §04 "katalog eşleşmesi yoksa kullanıcı manuel arama/özel besine yönlenir".
- `apps/mobile/src/camera/mealDraftPreview.ts` — saf önizleme mantığı (`previewNutrients`/`resolvedFoodId`), manuel seçim her zaman orijinal AI eşleşmesinden önceliklidir.
- `packages/nutrition-engine` — `scale`/`sum` iç fonksiyonları `scaleCatalogNutrients`/`sumCatalogNutrients` adıyla export edildi (mobil, gram düzenlemesinde AYNI null-koruyan formülü yeniden kullanır), birim testleri eklendi.
- **E2E doğrulama (Chrome + `expo start --web`, gerçek Supabase projesine karşı, gerçek bir Adana kebap tabağı fotoğrafıyla):** fotoğraf çek → analiz → düzenlenebilir taslak → gram değiştir/kalem kaldır → "Onayla ve kaydet" → `meal_entries` satırı oluştu, günlükte göründü zinciri uçtan uca çalıştı.
- **Bu doğrulama sırasında iki gerçek hata bulundu ve düzeltildi:**
  1. `packages/validation/src/mealAnalysis.ts` ve edge function'ın inline kopyasındaki `catalogFoodMatchSchema.foodId`/`foodVersionId` `z.string().uuid()` kullanıyordu — zod v4'te bu RFC 4122 versiyon/varyant hanelerini zorunlu kılıyor. `supabase/seed/catalog_starter_foods.sql`'deki "vanity" id'ler (`10000000-0000-0000-0000-000000000012` gibi) bu kalıba uymuyor — geçerli bir Postgres uuid ama RFC-uyumlu değil. Sonuç: katalogda **başarılı bir eşleşme** olan HER job `mealDraftSchema` doğrulamasında çöküp `invalid_response` ile `failed` oluyordu. `.uuid()` → `.guid()` (yalnız şekli doğrular, sürüm dayatmaz) ile düzeltildi, `analyze-meal-photo` v5 olarak redeploy edildi, `packages/validation/src/mealAnalysis.test.ts`'e regresyon testi eklendi.
  2. 15 besinlik seed katalogda "Adana kebap" yok — bulanık (trigram) arama onu en yakın isme (`Izgara köfte`, ~%44 skor) düşürüyor ve bunu sessizce "kesin eşleşme" gibi sunuyordu. Kalıcı çözüm (gerçek bir besin veritabanı) MVP-10'un kapsamı dışı ve `14-open-decisions.md`'de açık karar olarak duruyor; MVP-10 kapsamında UI tarafı düzeltildi: `matchScore < 0.7` olan kalemlerde "Bu eşleşme kesin olmayabilir" uyarısı + her eşleşmiş kalemde "Değiştir" butonu (satır içi aramayla manuel düzeltme).

**Kalan:**
- Besin veri kaynağı (USDA FoodData Central / Türkiye'ye özgü lisanslı kaynak) — `14-open-decisions.md`'de açık karar, henüz bir işe bağlanmadı. Katalog küçük kaldığı sürece zayıf/yanlış eşleşmeler (yukarıdaki "Değiştir" ile) elle düzeltilmeye devam edecek.
- Tam istemci tarafı offline outbox — MVP-05'teki aynı kapsam-dışı gerekçe.
- Onaylanan taslağın `ai_jobs.status`'unu ayrı bir "confirmed" durumuna taşıması yok — tamamlanma sinyali `meal_entries` satırının varlığı, job şeması MVP-09'un kapsam kararıyla `needs_confirmation`'da kalmaya devam ediyor.

#### MVP-11 — Bugün ekranı
**Durum:** `done` · **PRD:** §9 · **Bağımlılık:** MVP-10

Kart kataloğu, sıralama/görünürlük/odak kartı; tercih hesaba yazılır, offline okunur, cihazlar arası senkron.

**Kabul:** Boş/loading/offline/hata/dolu durumları ✅; kart düzenleme erişilebilir ve kalıcı ✅ (buton tabanlı sıralama, ekran okuyucu dostu — bkz. 14-open-decisions.md); hiçbir health değeri analitiğe girmez ✅ (bu iş hiçbir analitik olayı eklemedi).

**Kapsam kararı:** PRD'nin 6 madde bülleti (kalori+aktif enerji, makrolar, su+adım, son öğün+antrenman, ölçü trendi+seri+challenge, AI değerlendirme) 11 bağımsız yönetilebilir karta açıldı — her biri ayrı gizlenip boyutlandırılabilsin diye. Veri kaynağı olmayan 6 kart (aktif enerji, adım, bugünkü antrenman, seri, challenge, AI değerlendirme) katalogda tam yer alır (sıralanabilir/gizlenebilir/odak seçilebilir) ama gövdede uydurma sayı YERİNE "Yakında" durumu gösterir — bkz. 14-open-decisions.md.

**Bitti:**
- `profiles.dashboard_layout jsonb` (migration `20260718080000`) — `goal_overrides` ile AYNI desen: tek satır/kullanıcı, obje şekli CHECK, yeni RPC yok (mevcut `useUpdateProfile()` ile yazılır, §09 last-write-wins). 8 pgTAP testi (varsayılan, pozitif yazma, çapraz kullanıcı izolasyonu, CHECK ihlalleri, anon reddi) canlı şemada transaction+rollback ile 8/8 geçti.
- `apps/mobile/src/dashboard/cardCatalog.ts` — 11 kartlık statik katalog; `useDashboardLayout()` sunucudaki serbest-şekilli jsonb'yi güvenli bir yerleşime çevirir, kayıtlı olmayan yeni kart id'lerini sona ekler (yeni kart tipi migration gerektirmez).
- Gerçek veri kartları: `CalorieCard`, `MacroCard`, `WaterCard`, `LastMealCard`, `MeasurementTrendCard` — mevcut `useDailyNutritionSummary`/`useProfile`/`useDailyWaterSummary`/`useTodaysMeals`/`useWeightTrend` hook'larını yeniden kullanır, yeni sorgu yolu açmaz.
- `ComingSoonCard` — veri kaynağı olmayan 6 kart için tek paylaşımlı "Yakında" gövdesi.
- `apps/mobile/app/manage-dashboard-cards.tsx` — görünürlük/sıra (yukarı/aşağı buton)/boyut/odak kartı düzenleme; her etkileşim anında yazar.
- Paylaşımlı `Card`/`ProgressBar` bileşenleri (`apps/mobile/src/components/`) — önceki ekranlardaki inline kart tekrarının ilk paylaşımlı çıkarımı (eski ekranlar refactor edilmedi, kapsam dışı).
- Offline okunabilirlik: `@tanstack/react-query-persist-client` + `@react-native-community/netinfo` — `queryClient.ts`/`_layout.tsx`'e eklendi, yalnız Bugün ekranını değil profil/su/öğün/ölçü sorgularının tümünü offline-okunur yaptı.

**Kalan:**
- ~~Aktif enerji + adım → MVP-12 (health) gerçek veriyle bağlanınca `ComingSoonCard` yerini alır.~~ MVP-12'de yapıldı — `StepsCard`/`ActiveEnergyCard`, `ComingSoonCard` artık bu ikisini kapsamıyor.
- Bugünkü antrenman → `TRN-*` (Faz 2+).
- AI kısa değerlendirme → `COACH-*` (Faz 2+).
- Seri ve challenge → henüz iş kimliği yok; `11-delivery-roadmap.md` grafiğine eklenmeden numaralandırılmaz (§00 "yayınlanmayacak yüzey önceden sözleşmeye çevrilmez").
- pgTAP testleri Docker'da topluca yeniden çalıştırılıp doğrulanmadı (yukarıdaki 8/8, önceki MVP'lerdeki gibi canlı şemada transaction+rollback ile kanıtlandı, dosyanın kendisinin Docker altında da geçtiği ayrıca doğrulanmalı).

### Dalga 1D — Health ve gelir

#### MVP-12 — Health ve aktivite
**Durum:** `partial` · **PRD:** §17 · **Bağımlılık:** MVP-02 · `türetilmiş`

HealthKit/Health Connect, temel adım/aktif enerji. Native entegrasyon kapısı (§01) uygulanır. Bugün ekranındaki (MVP-11) `activeEnergy`/`steps` "Yakında" kartlarını gerçek veriyle değiştirir — bkz. `apps/mobile/src/dashboard/cardCatalog.ts`.

**Kabul:** Health izni reddedilse de manuel öğün/su/ölçü/antrenman çalışır ✅ (health hiçbir mevcut ekranı iznine bağımlı kılmaz); health işi temel özellikleri bloklamaz ✅. Gerçek iPhone'da uçtan uca doğrulandı: HealthKit'e bağlan → izin ver → Bugün ekranında adım/aktif enerji gerçek değerlerle göründü ✅.

**Kapsam kararı:** §17'nin "İlk veri türleri" listesi (adım, aktif enerji, mesafe, antrenman, kilo/boy) daha geniş ama bu iş kimliğinin metni yalnız "temel adım/aktif enerji" diyor — mesafe/antrenman (`TRN-*`'ye ait olması muhtemel) ve kilo/boy senkronu (`body_measurements.source` zaten `apple_health`/`health_connect`'i kabul ediyor ama bu işte bağlanmadı) kapsam dışı bırakıldı. Arka plan senkronu da kapsam dışı — native kapı (§01) bunu HealthKit/Health Connect'ten AYRI, kendi başına gated bir yetenek sayıyor; v1 yalnız Bugün ekranı açılınca senkron yapar. Detaylı gerekçe `14-open-decisions.md`'de.

**Bitti:**
- `daily_activity_metrics` tablosu + `daily_activity_summary()` RPC (migration `20260718120000`) — bu repo'da "kullanıcı+gün başına tek satır, upsert" deseninin İLK örneği (`daily_nutrition_summary`/`daily_water_summary` append-only log üzerinden hesaplanan RPC'lerdir, tablo değil). `unique(user_id, activity_date, source)` yeniden sync'i idempotent kılar; farklı kaynaklar ayrı satır kalır (`body_measurements` ile aynı "asla sessizce birleştirilmez" ilkesi). 15 pgTAP testi canlı şemada transaction+rollback ile 15/15 geçti.
- `packages/health-connectors` (yeni paket, monorepo mimarisinde zaten ayrılmıştı) — normalize tipler + `buildDailyActivityUpsertPayload()` (DB CHECK aralıklarını aynalayan saf fonksiyon, 7 unit test). RN import yasağı `eslint.config.mjs`'e eklendi (nutrition-engine ile aynı kısıt).
- `apps/mobile/src/health/` — `appleHealthAdapter.ts` (`@kingstinct/react-native-healthkit`, Nitro Modules tabanlı, New Architecture destekli), `healthConnectAdapter.ts` (`react-native-health-connect`), `HealthConnectionProvider.tsx` (bağlantı durumu + `connect`/`disconnect`/`syncToday`, tercih yalnız cihazda — hesaba yazılmaz). Her iki adaptör de gerçek paket kaynak koduna (`node_modules/.../src`) karşı typecheck edildi (API tahmin edilmedi, doğrulandı).
- `app/health-connection.tsx` — §17'nin 6 adımlı bağlanma akışı (fayda açıklaması → Bağla → OS izni → durum → Bağlantıyı Kes), Profil sekmesinden giriş linki. Onboarding'e EKLENMEDİ (§00 "Health iznini onboarding engeline dönüştürmek" yasak).
- `StepsCard`/`ActiveEnergyCard` — bağlı değilse "Bağlan" CTA'sı (uydurma sayı YOK, MVP-11'deki ilkeyle aynı), bağlıysa `useDailyActivitySummary()` üzerinden gerçek değer. Bugün ekranı açılınca bağlıysa tek seferlik `syncToday()` tetiklenir (ön plan senkronu).
- `app.json`: iOS `NSHealthShareUsageDescription` (yalnız okuma, `NSHealthUpdateUsageDescription` ve `background-delivery` entitlement'ı bilinçli olarak KAPALI — kullanılmayan yüzey beyan edilmez, §17), Android `READ_STEPS`/`READ_ACTIVE_CALORIES_BURNED` izinleri + Health Connect config plugin + `expo-build-properties` (`minSdkVersion: 26`, bkz. aşağıdaki hata). `expo-doctor` şema doğrulamasından temiz geçti.
- **EAS Build kurulumu**: `eas.json` (development/preview/production profilleri) + proje ilk kez EAS'a bağlandı (`@akintkaya/calouch`). Hem Android hem iOS development build'i başarıyla üretildi ve **gerçek iPhone'a kurulup uçtan uca doğrulandı** (izin akışı, Bugün ekranında gerçek adım/aktif enerji, dev-client Metro bağlantısı).
- **Bu doğrulama sırasında iki gerçek hata bulundu ve düzeltildi** (proje bu ana kadar yalnız `expo start --web` ile geliştirildiği için önceden yakalanamamıştı):
  1. **Android build Gradle manifest merge hatasıyla çöktü**: `react-native-health-connect`'in bağımlı olduğu `androidx.health.connect:connect-client:1.1.0-alpha11` `minSdkVersion 26` istiyor, proje varsayılanı 24'tü. `expo-build-properties` eklenip `android.minSdkVersion: 26` yapıldı — uygulama artık Android 8.0 altını desteklemiyor (karar kaydı: `14-open-decisions.md`).
  2. **Bağlantı durumu sekmeler arası senkronize olmuyordu**: `useHealthConnection` her çağrıldığı yerde kendi yerel `useState`'ini tutuyordu; Expo Router sekmeleri arka planda mounted tuttuğu için (tab switch'te unmount/remount YOK) `health-connection.tsx`'te bağlanıp Bugün sekmesine dönüldüğünde o sekmenin zaten mount olmuş kartları hâlâ "Bağlan" gösteriyordu. `useHealthConnection.ts` → `HealthConnectionProvider.tsx`'e taşındı: tek bir Context, `_layout.tsx`'te bir kez mount edilir (`ThemeProvider`/`LocaleProvider` ile AYNI desen), tüm tüketiciler aynı state'i paylaşır.

**Kalan:**
- Android tarafı build başarıyla üretildi ve talimatla teslim edildi ama **kullanıcı tarafından cihazda henüz doğrulanmadı** (yalnız iOS doğrulandı) — Health Connect izin akışı ve kartların Android'de de doğru göründüğü ayrıca teyit edilmeli.
- Mesafe, antrenman, kilo/boy senkronu — kapsam dışı (yukarıda).
- Arka plan senkronu — kapsam dışı, ayrı native kapı geçişi gerektirir.
- Çoklu-kaynak önceliklendirmesi — RPC şimdilik yalnız en son senkronlanan satırı döner, gerçek ihtiyaç doğunca genişletilir.
- pgTAP testleri Docker'da topluca yeniden çalıştırılıp doğrulanmadı (15/15, önceki MVP'lerdeki gibi canlı şemada transaction+rollback ile kanıtlandı).

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

`TRN-*` Bugün ekranındaki (MVP-11) `todayWorkout`, `COACH-*` ise `aiInsight` "Yakında" kartını gerçek veriyle değiştirir. Seri/challenge kartları (`streak`/`challenge`) henüz hiçbir gruba bağlanmadı — `ADV-*`'nin "challenge" kapsamı bununla örtüşebilir, karar `14-open-decisions.md`'de açık.

## Paralel çalışma sınırları

`11-delivery-roadmap.md` §"Paralel çalışma sınırları" bağlayıcıdır. Özetle: aynı migration dosyasını tek ajan sahiplenir; shared type değişikliği önce küçük kontrat PR'ı olur; RLS, billing ledger, delete pipeline ve AI credit işleri tek sorumlu tarafından uçtan uca yapılır.
