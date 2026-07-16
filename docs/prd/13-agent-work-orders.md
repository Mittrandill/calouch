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
**Durum:** `todo` · **PRD:** §12–13 · **Bağımlılık:** FND-04

`catalog` şeması, besin verisi, **sürümleme**, arama, özel besin.

**Kabul:** Kalori/makro sürümlü veriden gelir; arama offline son besinleri kapsar.

#### MVP-04 — Nutrition engine
**Durum:** `todo` · **PRD:** §12–14 · **Bağımlılık:** MVP-03

Deterministik hesap motoru. Saf TypeScript — RN/veri erişimi importu yasak (ESLint zorlar).

**Kabul:** Değişmez kural: "Kalori ve makrolar AI metninden değil, sürümlü besin verisi ve deterministik hesap motorundan gelir." Unit test kapsamı.

#### MVP-05 — Manuel öğün
**Durum:** `todo` · **PRD:** §14 · **Bağımlılık:** MVP-04

Öğün + kalem/snapshot atomik yazılır. Offline taslak + outbox.

**Kabul:** Öğün+kalem tek transaction; offline retry çift kayıt üretmez.

#### MVP-06 — Tarif ve su
**Durum:** `todo` · **PRD:** §13–14 · **Bağımlılık:** MVP-05 · `türetilmiş`

#### MVP-07 — Ölçü ve kilo
**Durum:** `todo` · **PRD:** §15–16 · **Bağımlılık:** MVP-02 · `türetilmiş`

Kilo/ölçü kaydı ve trend. İlerleme fotoğrafı **private** storage.

**Veri sınıfı:** Sağlık + medya (yüksek).

### Dalga 1C — AI ve dashboard

#### MVP-08 — AI kontratları ve private medya
**Durum:** `todo` · **PRD:** §10–11 · **Bağımlılık:** MVP-04, MVP-05

Private media upload, provider adapter, request/response şeması, Zod validation, idempotency, rate limit, correlation ID, maliyet/kill switch.

**Kabul:** Gemini anahtarı istemciye girmez; hassas bucket public değil; signed URL expiry testli.

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
