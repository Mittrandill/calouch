# Açık Kararlar

Kodlamadan önce netleşmesi gereken kararların kaydı. `README.md` §"Ajan okuma protokolü": eksik karar varsa varsayımı **koda gömme** — buraya bak.

Bir karar kapandığında satır `Kapalı` bölümüne taşınır ve gerekçesi korunur. Karar kaydı silinmez: altı ay sonra "bu neden böyle?" sorusunun cevabı burasıdır.

## Durum sözlüğü

| Durum | Anlam |
|---|---|
| `Blocked` | Harici hesap, hukuk veya platform erişimi bekler; kod ilerleyemez |
| `Açık` | Karar verilmedi ama ilgili iş henüz sırada değil |
| `Kapalı` | Karar verildi; gerekçe kayıtlı |

---

## Blocked — kod ilerleyemez

### Apple Developer hesabı
**Etki:** FND-02 (iOS development build), MVP-14/15 (StoreKit), MVP-19 (yayın)

Geliştirme makinesi Windows. iOS Development Build **yerelde üretilemez**; EAS Build (cloud) + Apple Developer Program üyeliği (99 USD/yıl) şart. Faz 0 çıkış kapısı "iOS/Android development build açılır" der — bu kapı hesap alınmadan kapanmaz.

Android tarafı yerelde etkilenmez ve bağımsız ilerler.

**Karar gereken:** Hesabı kim/hangi tüzel kişilik açacak? Bireysel mi şirket mi — şirket hesabı D-U-N-S numarası ister ve haftalar sürebilir. Veri sorumlusu yapısıyla (§09) tutarlı olmalı.

### Google Play Console hesabı
**Etki:** MVP-14/15, MVP-19

25 USD tek seferlik. Play, yeni geliştirici hesapları için kapalı test dönemi şartı arayabilir — yayın takvimini etkiler.

### Hukuki metinler ve veri sorumlusu yapısı
**Etki:** MVP-16 (consent), MVP-18, MVP-19

Gereken metinler (§09): KVKK aydınlatma, açık rıza, privacy, terms, membership/subscription/renewal, retention/destruction, data subject request, incident plan, subprocessors/international transfer, AI disclosure, health disclaimer, account deletion/export, cookie policy.

Consent kaydı **belge sürümü** taşır; metin yoksa sürüm de yoktur, yani consent şeması hukuk çıktısına bağlıdır.

**Karar gereken:** Veri sorumlusu tüzel kişilik; subprocessor listesi (Supabase, Google, Vercel, Sentry, ödeme sağlayıcısı); AB'ye aktarım dayanağı.

### Marka tescili
**Etki:** MVP-19 · **PRD:** §3.4

"Calouch" için tescil araştırması ve başvurusu. Mağaza isimleri (§3.2) ve slogan (§3.3) buna bağlı.

---

## Açık — ilgili iş sırada değil

### Sentry (veya eşdeğeri) sağlayıcı seçimi
**Etki:** FND-01

`apps/mobile/src/observability/reportError.ts` şu an konsola yazıyor; redaksiyon ve çağrı yerleri hazır, yalnız `deliver()` değişecek.

**Karar gereken:** Sentry mi, alternatif mi. Sağlık verisi işlendiği için sağlayıcının veri ikametgâhı ve subprocessor kaydı (§09) önemli — AB bölgesi tercih edilmeli, DB bölgesi kararıyla tutarlı olsun.

### staging/production Supabase projeleri
**Etki:** FND-01, §01 "Ortamlar"

Şu an tek proje var: `calouch` (development). §01 development/staging/production ayrımını şart koşuyor ve "production verisi development'a kopyalanmaz" diyor.

**Karar gereken:** Ücretli plan (staging + production ayrı proje) ne zaman açılacak? Free tier organizasyon başına proje sayısını sınırlar. En geç MVP-14 (billing) öncesinde gerekir — ödeme webhook'u development projesine bakamaz.

### Gemini model, maliyet tavanı ve kill switch
**Etki:** MVP-08, MVP-09 · **PRD:** §10–11

**Karar gereken:** Hangi model; görsel başına maliyet tavanı; kullanıcı başına kota; kill switch eşiği. AI kredi sistemi (§26) bu maliyet modeline dayanır.

Google Cloud / Gemini projesi henüz oluşturulmadı (Faz 0 çıktısı).

### Gemini Live preview durumu
**Etki:** `VOICE-*` · **PRD:** §11 Faz 4

§11 bağlayıcı: "Gemini Live preview durumu tekrar doğrulanmadan production varsayılanı yapılmaz." Faz 4 başlamadan yeniden değerlendirilir.

### Envelope encryption kapsamı
**Etki:** MVP-02 (alerji notu), `COACH-*` · **PRD:** §09

§09: ek envelope encryption "yalnız özel sağlık/alerji notu, kullanıcı özel notu veya opt-in özel AI konuşması gibi seçili alanlarda değerlendirilir. Anahtar rotasyonu ve arama gereksinimi tasarım öncesi netleştirilir."

**Karar gereken:** Hangi alanlar; anahtar rotasyonu; şifreli alanda arama gerekiyor mu (gerekiyorsa tasarım kökten değişir).

### Hedef motoru formülü ve sürümü
**Etki:** MVP-02 · **PRD:** §8.4

§8.4 "Formül ve sürümü kaydedilir" diyor. Formül seçimi (ör. Mifflin-St Jeor) ve `v1` etiketi MVP-02 başlamadan sabitlenmeli — sonradan değişirse kullanıcıların geçmiş hedefleri yeniden hesaplanmamalı.

### `13-agent-work-orders.md` türetilmiş kimlikler
**Etki:** iş takibi

`FND-02`, `FND-03`, `MVP-06`, `MVP-07`, `MVP-12`, `MVP-13`, `MVP-18` kimlikleri bağımlılık grafiğinde numarayla geçiyor ama adlandırılmamış; kapsamları dalga tanımlarından türetildi.

**Karar gereken:** Türetilen kapsamlar onaylansın veya düzeltilsin.

---

## Kapalı

### Veritabanı bölgesi: eu-central-1 (Frankfurt)
**Karar tarihi:** 2026-07-15 · **Etki:** FND-04, §09

İlk proje `ap-northeast-1` (Tokyo) bölgesinde açılmıştı. `eu-central-1` (Frankfurt) ile yeniden kuruldu (`aaufvndbagvkpbtqefee`).

**Gerekçe:** Türkiye'den gidiş-dönüş gecikmesi ~250–300 ms yerine ~50 ms. Daha önemlisi sağlık verisi AB'de kalır; §09'un yurt dışı aktarım, subprocessor ve hukuki dayanak dokümantasyonu Japonya'ya aktarımla kıyaslanmayacak kadar sadeleşir. Proje boştu (0 tablo, 0 migration), yani taşımanın maliyeti sıfırdı.

**Sonuç:** Sentry ve diğer subprocessor'lar için de AB bölgesi tercih edilmeli — tek bir servis veriyi AB dışına taşırsa kazanım kaybolur.

**Artık iş:** Tokyo projesi (`uwmjppxnfzerbqbliirs`) **hâlâ silinmedi** — Supabase MCP sunucusunda `delete_project` aracı yok. Dashboard'dan elle silinmeli.

### Expo SDK 57 / React Native 0.86
**Karar tarihi:** 2026-07-15 · **Etki:** FND-02

§01 "PRD'deki örnek sürümleri körlemesine sabitleme. Başlangıç günündeki kararlı Expo/RN sürümünü ve tüm native paketlerin New Architecture uyumunu doğrula; karar kaydı oluştur." — bu kayıt odur.

Kurulum günü `expo@latest` = **57.0.6**, React Native **0.86.0**, React **19.2.3**. Native paketler `npx expo install` ile SDK-uyumlu sürümlerden çözüldü (elle sabitlenmedi). New Architecture SDK 54'ten beri varsayılan; `newArchEnabled: true` açıkça yazıldı.

**Sonuç:** Sürüm yükseltmesi `npx expo install --check` ile yapılır; `package.json`'a elle sürüm yazılmaz.

### TypeScript 5.9 (şablonun önerdiği 6.0 yerine)
**Karar tarihi:** 2026-07-15 · **Etki:** FND-01

`create-expo-app` şablonu TypeScript `~6.0.3` getirdi. Monorepo genelinde `^5.9.3` sabitlendi.

**Gerekçe:** `typescript-eslint` 8.x'in resmî desteklediği üst sınır 5.9. Desteklenmeyen TS sürümü, ESLint'in tip-farkında kurallarını sessizce bozar — ve bu repoda mimari kuralların (§01, §02) taşıyıcısı ESLint.

**Sonuç:** typescript-eslint TS 6'yı desteklediğinde birlikte yükseltilir.

### Analitik: kapalı olay kataloğu
**Karar tarihi:** 2026-07-15 · **Etki:** FND-01, §02

Serbest biçimli `track(name, props)` yerine tip düzeyinde sayılmış olay kataloğu + çalışma zamanı redaksiyon denetimi.

**Gerekçe:** §02 "Hiçbir health/personal değer analitik payload'a girmez" bir kod incelemesi temennisi olarak yaşayamaz. Tip sistemi tek başına yetmiyor: hesaplanmış anahtar (`{ [key]: value }`) TS'in fazla-alan denetimini atlatıyor — bu, testle doğrulandı. Bu yüzden iki katman var.

### Ham hex/spacing yasağı: ESLint `no-restricted-syntax`
**Karar tarihi:** 2026-07-15 · **Etki:** FND-03, §02

**Gerekçe:** §02 "Kod içinde doğrudan renk, radius ve spacing kullanılmaz" kuralı otomatik denetlenmezse ilk teslim baskısında delinir.

**Tuzak (kayda geçirilir):** Sayısal literal için `Literal[value=/regex/]` seçicisi **sessizce hiçbir şey yakalamaz** — esquery number tipinde regex eşleştirmez; `[value>0]` kullanılır. Ayrıca `top`/`bottom`/`left`/`right` anahtarları kural kapsamına alınamaz: JS'te `true > 0` doğru olduğundan `edges={{ top: true }}` yanlış pozitif üretir.

### CI secret taraması: kelime değil, değer biçimi
**Karar tarihi:** 2026-07-15 · **Etki:** FND-01, §01

Bundle taraması `service_role` gibi **kelimeleri** aramaz; `sb_secret_[A-Za-z0-9_-]{20,}`, `AIzaSy[A-Za-z0-9_-]{33}` gibi **değer biçimlerini** arar.

**Gerekçe:** Hermes bytecode'unda string tablosu bitişik yazılır ve kelime bazlı grep yanlış pozitif verir. İlk taramada gerçekten görülenler:
- `home_repair_service` + `role` → "service_role" (Material Symbols ikon adı)
- `SHEET_COMPAT_LARGE` + `MINITIAL_SESSION` → "LARGEMINITIAL" içinde "GEMINI"
- Koruma kodumuzun kendi desen sabitleri (`SERVICE_ROLE`, `GEMINI`, `sb_secret_`)

Kelime bazlı bir kapı ilk PR'da kırmızı yanar, ekip onu devre dışı bırakır — hiç olmamasından kötü olur.
