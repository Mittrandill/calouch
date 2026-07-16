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

### Tam offline outbox kapsam dışı bırakıldı (MVP-05)
**Etki:** MVP-05, mobil mimarinin geneli

MVP-05 (manuel öğün) yalnız **sunucu tarafı** idempotency'yi teslim etti: `log_meal()` çağrısı client tarafından üretilen `operation_id` taşır, aynı `operation_id` ile ikinci çağrı yeni satır yaratmadan mevcut kaydı döner. Cihaz tamamen offlineyken yazmayı bir kuyruğa alıp bağlantı dönünce otomatik tekrar deneyen istemci tarafı outbox (SQLite tabanlı) **yok**.

**Gerekçe:** Offline outbox tek bir MVP işine değil mobil mimarinin geneline ait bir altyapı çalışması — yalnız öğün için inşa edilirse su/ölçü/tarif (MVP-06/07) her biri kendi ad-hoc kuyruğunu icat eder. Sunucu tarafı idempotency zaten MVP-05'in kendi kabul kriterini ("offline retry çift kayıt üretmez") karşılıyor: kuyruk ne zaman gelirse gelsin, tekrar denemesi güvenli.

**Karar gereken:** Outbox mimarisi ne zaman ve hangi iş kimliği altında ele alınacak — muhtemelen MVP-06/07'den önce, birden fazla domain'in ortak ihtiyacı netleştiğinde.

### `13-agent-work-orders.md` türetilmiş kimlikler
**Etki:** iş takibi

`FND-02`, `FND-03`, `MVP-06`, `MVP-07`, `MVP-12`, `MVP-13`, `MVP-18` kimlikleri bağımlılık grafiğinde numarayla geçiyor ama adlandırılmamış; kapsamları dalga tanımlarından türetildi.

**MVP-06 kapanmıştır:** Tarif/su/favori kapsamı `03-nutrition-core.md`'nin "Tarifler"/"Su takibi" bölümleri ve MVP-05'in kapsam-dışı notuyla (`favorite_foods`) birebir eşleşti; ek yorumlama gerekmedi. Uygulandığı hâliyle onaylanmış sayılır.

**Karar gereken (kalan):** `FND-02`, `FND-03`, `MVP-07`, `MVP-12`, `MVP-13`, `MVP-18` için türetilen kapsamlar onaylansın veya düzeltilsin.

---

## Kapalı

### Onboarding'e biyolojik cinsiyet alanı eklendi
**Karar tarihi:** 2026-07-16 · **Etki:** MVP-02 · **PRD sapması:** §8.2

**Bulgu:** "Cinsiyet" kelimesi PRD'nin tamamında geçmiyor — ne kaynak PDF'te ne modüler dosyalarda. §8.2 alan listesi doğum yılı, boy, kilo, hedef kilo, aktivite ve hedefi topluyor; cinsiyet yok.

**Sorun:** Her standart bazal metabolizma formülü cinsiyet ister. Mifflin-St Jeor'da sabit farkı **166 kcal/gün** (erkek +5, kadın −161) — aynı yaş/boy/kiloda bazal metabolizmanın ~%10'u. Ortalamaya yuvarlamak her kullanıcıda ±83 kcal sistematik hata demekti: kadınlara fazla, erkeklere az kalori. Kilo verme hedefinde bu haftada ~0.1 kg sapmadır ve ürünün tüm değer önerisi kalori doğruluğu üzerine kurulu.

**Karar:** §8.2'ye **atlanabilir** bir adım eklendi (`biological_sex`, varsayılan `unspecified`).

**Gerekçe:**
- Atlanabilir olması §00'ın "veri/izin reddedilse de temel kullanım çalışır" ilkesine uyar; zorunlu alan trans/non-binary kullanıcılar için zorlayıcı olurdu.
- Atlanırsa iki sabitin orta noktası (−78) kullanılır, sonuç `confidence: 'low'` ve `sex_unspecified` uyarısı taşır — §00 "Belirsizlik görünürdür" ilkesi deterministik tahminde de geçerli.
- Cinsiyet bilinmiyorken **koruyucu** (düşük, 1200 kcal) güvenlik tabanı uygulanır.
- §8.4 zaten tüm değerlerin elle değiştirilebilmesini istiyor; yanlış tahmin kullanıcıyı kilitlemiyor.
- Sorulan şey kimlik değil fizyoloji: sabit, ortalama yağsız kütle farkını temsil eder.

**Sonuç:** Health entegrasyonu (MVP-12) biyolojik cinsiyeti otomatik doldurabilir, ama izin reddedilebileceği için bu adım yine de kalır.

### Hedef motoru formülü: Mifflin-St Jeor v1
**Karar tarihi:** 2026-07-16 · **Etki:** MVP-02 · **PRD:** §8.4

§8.4 **ne** hesaplanacağını sayıyor (bazal metabolizma, enerji ihtiyacı, kalori, protein, karb, yağ, lif, su) ama **formülü vermiyor**. §8.4 "Formül ve sürümü kaydedilir" dediği için bu kayıt zorunlu.

**Karar:** Mifflin-St Jeor (1990). Sürüm etiketi: `mifflin-st-jeor-v1`.

**Gerekçe:** Güncel klinik standart; beslenme uzmanlığı kurulularının önerdiği formül. Harris-Benedict (1984) genel popülasyonda kaloriyi fazla tahmin eder ve kilo verme hedefinde sistematik olarak cömert davranır. Katch-McArdle daha isabetli ama vücut yağ oranı ister — §8.2 onu toplamıyor (Faz 6'daki "fotoğraftan ölçü" ile ileride seçenek olabilir).

**Sonuç:** `GOAL_FORMULA_VERSION` sabiti profile yazılır. `packages/nutrition-engine/src/goals/constants.ts` içindeki **herhangi bir sabit** değişirse sürüm artmalıdır — aksi hâlde iki kullanıcı aynı etiketle farklı hesaptan geçmiş olur. Formül değişince eski hedefler sessizce yeniden hesaplanmaz.

### Makro stratejisi: protein g/kg tabanlı
**Karar tarihi:** 2026-07-16 · **Etki:** MVP-02 · **PRD:** §8.4

§8.4 protein/karb/yağ/lif istiyor ama oran vermiyor.

**Karar:** Protein hedefe göre g/kg (kas geliştirmede 2.0, kilo vermede 1.8, sağlıklı beslenmede 1.2); yağ, `max(0.8 g/kg tabanı, kalorinin %25'i)`; karbonhidrat kalanı doldurur; lif 1000 kcal başına 14 g; su 35 ml/kg.

**Gerekçe:** Sabit kalori yüzdesi (30/40/30 gibi) kullanılsaydı, kalori açığı büyüdükçe protein hedefi de düşerdi — kilo verirken kas kaybı riskini artıran tam olarak budur. §00'daki "kas geliştiren" ve "ileri sporcu" personaları için doğru olan g/kg'dır.

**İki ince karar kayda geçer:**
- **Referans ağırlık:** Kilo verirken `min(mevcut, hedef)` kullanılır. 120 kg'lık kullanıcı için 1.8 × 120 = 216 g protein hem gereksiz hem uygulanamaz olurdu; yağ dokusu protein ihtiyacı yaratmaz, ihtiyacı yağsız kütle belirler ve hedef ağırlık ona çok daha yakın bir vekildir. Kilo alırken tersi geçerli değil — hedef ağırlık henüz var olmayan kütledir, mevcut ağırlık kullanılır.
- **Yağ tabanı:** Karbonhidrat "kalanı" doldurduğu için, taban olmasaydı agresif açıkta yağ sıfıra yaklaşırdı. 0.8 g/kg hormon üretimi ve yağda çözünen vitamin emilimi için tutulur.

### Güvenlik tabanı: motor riskli hedef önermez
**Karar tarihi:** 2026-07-16 · **Etki:** MVP-02 · **PRD:** §8.4, §00

§8.4: "Riskli derecede düşük hedeflerde kullanıcı uyarılır ve profesyonel destek önerilir."

**Karar:** Motorun **kendi önerisi** klinik tabanın (erkek 1500, kadın/bilinmeyen 1200 kcal) altına inmez: kırpar ve `target_below_safe_minimum` uyarısı üretir. Kullanıcı §8.4 gereği elle daha düşüğe çekebilir.

**Gerekçe:** Kullanıcının haftada 1 kg vermek istemesi, ürünün ona 72 kcal/gün önermesini meşrulaştırmaz. Ürün teşhis/tedavi vermez (§00) — yapabileceği tek şey riski işaret edip uzmana yönlendirmektir. Kırpma sonrası hedef hâlâ bazal metabolizmanın altındaysa ayrıca `target_below_bmr` uyarısı çıkar.

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

### Yerel migration dosya adları remote sürüm numaralarıyla eşleştirildi
**Karar tarihi:** 2026-07-16 · **Etki:** FND-04, MVP-03

**Bulgu:** `apply_migration` MCP aracı, geçirdiğim `name` parametresini kullanıyor ama migration'ın `version` (dosya adı zaman damgası) kısmını **kendi anlık saatinden** üretiyor — benim yerel dosya adımdaki zaman damgasını değil. Sonuç: `supabase/migrations/` içindeki dosya adları haftalarca remote'un `supabase_migrations.schema_migrations` tablosundaki gerçek `version` değerleriyle **hiç eşleşmedi**.

**Neden önemli:** `supabase db push` ve `supabase migration list`, yerel dosyanın zaman damgası önekini remote'taki `version` sütunuyla karşılaştırır. Eşleşme yoksa CLI, zaten uygulanmış bir migration'ı "yeni" sanıp tekrar uygulamaya çalışır — bu da "relation already exists" gibi hatalarla sonuçlanır. Bu, gerçek build zamanına kadar fark edilmeyen türden bir hatadır.

**Kök neden:** İki migration (`enable_pgtap_for_tests`, `catalog_missing_fk_indexes`) yalnızca `execute_sql`/`apply_migration` ile remote'a uygulandı, hiç yerel dosyaya yazılmadı.

**Sonuç:**
- Var olan 4 dosya, remote'taki gerçek `version` değerleriyle yeniden adlandırıldı.
- `enable_pgtap_for_tests` ve `catalog_missing_fk_indexes` gerçek remote sürüm numaralarıyla yerel dosya olarak eklendi.
- `catalog_immutable_unaccent_search_path` için AYRI dosya oluşturulmadı: düzeltme zaten `catalog_foods.sql`'in orijinal `CREATE FUNCTION`'ına gömülü (dosya baştan doğru). Sıfırdan çalıştırıldığında aynı doğru son duruma tek adımda ulaşılıyor; iki adımlı geçmişi taklit etmek yanıltıcı olurdu. Bu yüzden yerel klasör remote'tan bir migration eksik görünür — kasıtlı.
- **Kural:** Bundan sonra her `apply_migration` çağrısından hemen sonra `list_migrations` ile gerçek `version` kontrol edilip yerel dosya o numarayla adlandırılacak.

### `anon` EXECUTE varsayılanı: her fonksiyon açıkça revoke etmeli, `alter default privileges` güvenilir değil
**Karar tarihi:** 2026-07-16 · **Etki:** tüm gelecek `public.*` fonksiyonları · **PRD:** §09

**Bulgu:** MVP-06 sırasında `has_function_privilege` ile ampirik test edildi — `revoke_public_execute_defaults.sql`'deki (154323) `alter default privileges in schema public revoke execute on functions from public` kuralı, projede o tarihten SONRA `apply_migration` ile oluşturulan dört yeni fonksiyonun (`daily_water_summary`, `save_recipe`, `recipe_detail`, `list_recipes`) hepsinde `anon`'un EXECUTE alabildiğini engellemedi. `pg_default_acl` sorgusu kanıtladı: `public` şemasında `postgres` rolünün fonksiyon varsayılan ACL'i zaten `anon`'u PUBLIC'ten BAĞIMSIZ, AYRI bir grant olarak içeriyordu — `revoke ... from public` bu ayrı grant'e dokunmadı.

**İkinci bulgu (bu kaydı "Kapalı" değil yarı-açık yapan kısım):** Aynı gün, `alter default privileges in schema public revoke execute on functions from anon;` çalıştırılıp `postgres` rolünün `pg_default_acl` girdisinden `anon` GERÇEKTEN kaldırıldığı doğrulandı — ama hemen sonra oluşturulan YENİ bir test fonksiyonu YİNE `anon=X` için `has_function_privilege` `true` döndürdü çünkü fonksiyonun nihai ACL'inde beklenmeyen bir çıplak `=X` (PUBLIC) girdisi vardı. Yani `postgres` rolünün `pg_default_acl`'ini düzeltmek bile CREATE FUNCTION'ın gerçekte hangi rol/yol üzerinden (`apply_migration` MCP aracı neyi kullanıyor — `postgres`, `supabase_admin` veya bağlantı havuzundan geçen başka bir rol) çalıştığını garanti altına almadı. Kök mekanizma netleştirilmedi.

**Karar (bugün için çalışan, doğrulanmış tek yol):** Her yeni `public.*` fonksiyonu HEM `revoke execute ... from public` HEM `revoke execute ... from anon` içerir — ikisi ayrı satır, ikisi de zorunlu. Bu kalıp `water_logs.sql`, `recipe_functions.sql`, `favorite_foods.sql`'de uygulandı ve `has_function_privilege` ile her seferinde doğrulandı.

**Karar gereken (henüz kapanmadı):** `apply_migration`/CREATE FUNCTION'ın hangi rol altında çalıştığı ve neden `postgres` rolü için düzeltilen `pg_default_acl`'in tutarlı uygulanmadığı — Supabase platform desteğine sorulabilir veya `supabase_admin` rolünün kendi `pg_default_acl` girdisi de aynı şekilde düzeltilip test edilebilir. O ana kadar yukarıdaki "her fonksiyon açıkça revoke eder" kuralı BAĞLAYICI kalır; `alter default privileges`e güvenilmez.

### CI secret taraması: kelime değil, değer biçimi
**Karar tarihi:** 2026-07-15 · **Etki:** FND-01, §01

Bundle taraması `service_role` gibi **kelimeleri** aramaz; `sb_secret_[A-Za-z0-9_-]{20,}`, `AIzaSy[A-Za-z0-9_-]{33}` gibi **değer biçimlerini** arar.

**Gerekçe:** Hermes bytecode'unda string tablosu bitişik yazılır ve kelime bazlı grep yanlış pozitif verir. İlk taramada gerçekten görülenler:
- `home_repair_service` + `role` → "service_role" (Material Symbols ikon adı)
- `SHEET_COMPAT_LARGE` + `MINITIAL_SESSION` → "LARGEMINITIAL" içinde "GEMINI"
- Koruma kodumuzun kendi desen sabitleri (`SERVICE_ROLE`, `GEMINI`, `sb_secret_`)

Kelime bazlı bir kapı ilk PR'da kırmızı yanar, ekip onu devre dışı bırakır — hiç olmamasından kötü olur.
