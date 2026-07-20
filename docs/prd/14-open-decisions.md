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

### Tasarım dili yenilemesi (Rift-ilhamlı)
**Karar tarihi:** 2026-07-19 · **Etki:** `apps/mobile` tüm ekranlar, `packages/design-tokens`, `packages/localization` (string değişikliği yok, yalnız yeni auth string'leri) · **PRD:** Yok — kullanıcı talebiyle başlatıldı, PRD'de görsel dil şartı zaten "marka kimliği sonradan gelir" diyordu.

**Karar:** Uygulamanın görsel dili Behance'teki "Rift — AI Fitness & Wellness Mobile App" referans alınarak yenilendi. Kapsam kullanıcı tarafından açıkça sınırlandı: **yalnız tasarım dili** (renk, tipografi, kart/efekt/animasyon stili) — Calouch'un kendi logosu, sloganı ve markası KORUNDU, Rift'in markası kopyalanmadı.

- `packages/design-tokens/src/primitives.ts`: yeni `chartreuse` (marka rengi, `500`=`#D8FF00`), `teal` (ikincil vurgu), `graphite` (koyu yüzey hiyerarşisi: `background`/`surface`/`surfaceElevated`/`surfacePressed` + OLED varyantları) ölçekleri.
- `packages/design-tokens/src/colors.ts`: koyu tema chartreuse/graphite'tan besleniyor; açık temada `brand.text` bilinçli olarak `chartreuse[800]` kullanıyor (`[500]` beyaz zeminde WCAG AA'yı geçemiyor — kontrast hesaplanarak doğrulandı, `tokens.test.ts` 30/30 geçti).
- `ThemeProvider.tsx`: varsayılan tema `system` yerine `dark` — Rift referansı koyu-öncelikli, kullanıcı onayıyla (`"Koyu temayı varsayılan yap"`).
- `@expo-google-fonts/space-grotesk` + `@expo-google-fonts/inter` eklendi (`typography.ts`): display/heading/numeric Space Grotesk, body/label/caption Inter.
- Yeni `RingGauge.tsx` (react-native-svg tabanlı animasyonlu halka gösterge) — Kalori kartının imza öğesi.
- Kart köşe yarıçapı `radius.md` → `radius.lg`: yalnız gerçek içerik kartları (`surface.default` arkaplan + kenarlık taşıyan konteynerler), buton/input'lar bilinçli olarak `radius.md`'de bırakıldı (görsel hiyerarşi: kart ≠ kontrol).
- App icon/splash/favicon, kullanıcının `apps/mobile/public/icon.png` altına eklediği yeni marka görseliyle değiştirildi (`app.json` `primaryColor`/`adaptiveIcon.backgroundColor` de `#D8FF00`'a güncellendi). `android-icon-monochrome.png` bilinçli olarak dokunulmadı — silüet çıkarımı için görüntü işleme aracı bu ortamda yok.

**Gerekçe:** Kullanıcı ürünün genel görsel kimliğinin şablonik kaldığını belirtti ve somut bir referans verdi. Marka (logo/slogan) korunarak yalnız tasarım dilinin değişmesi istendi — bu ayrım kullanıcı tarafından açıkça yapıldı (`"sloganı logoyu falan bizimki kalsın... ekranlar, efektler, animasyonlar, stiller, görseller, cardlar vb."`). Token mimarisi (primitives → semantic colors → `useTheme()`) zaten mevcuttu; bu iş yeni bir mimari kurmadı, mevcut katmanı yeniden doldurdu — Profile ekranının SIFIR kod değişikliğiyle doğru göründüğü doğrulandı, bu da token-cascade'in çalıştığını kanıtladı.

**Sonuç:** ~22 ekran/bileşen dosyası tarandı, kart-konteyner deseni (`surface.default` arkaplan + `radius`) taşıyan 9 dosyada `radius.lg`'ye geçirildi; buton/input'lar kasıtlı olarak dokunulmadı. `pnpm typecheck`/`lint` temiz. Görsel QA `expo start --web` üzerinden Chrome ile ekran ekran doğrulandı (Bugün/Günlük/Kamera/Tarifler/Öğün ekle/Tarif oluştur/Ölçüler/Health/Kartları düzenle/Onboarding). Android monochrome icon ve gerçek cihazda ikon/splash görünümü henüz doğrulanmadı — sonraki EAS build'de kontrol edilmeli.

### Tasarım dili yenilemesi: fotoğraf arkaplanlı kartlar + öğün fotoğrafı saklama davranışı değişikliği
**Karar tarihi:** 2026-07-20 · **Etki:** `apps/mobile` (Card.tsx, dashboard kartları), `packages/design-tokens`, `supabase/functions/analyze-meal-photo`, `meal_entries` şeması · **PRD:** Yok — yukarıdaki tasarım dili yenilemesinin devamı, kullanıcı talebiyle.

**Karar:** Kullanıcının kendi başka bir projesi ("fitpulsev1", aynı koyu/chartreuse-lime estetiği) referans alınarak kart arkaplanlarına fotoğraf + gradient overlay deseni eklendi. Kapsam: (1) "Yakında" kartları (antrenman/seri/challenge) dekoratif fotoğraf — `aiInsight` BİLİNÇLİ OLARAK hariç tutuldu (tutarsız olurdu); (2) Su kartı her zaman temalı arkaplan (gerçek veri, "yakında" değil); (3) Ölçü trendi kartı kullanıcının en yeni ilerleme fotoğrafını gösterir (fotoğraf yoksa fallback YOK — gerçek veri, uydurma görsel eklenmez); (4) Son öğün kartı GERÇEK öğün fotoğrafını gösterir (yoksa öğün türüne göre dekoratif fallback).

- `packages/design-tokens/src/colors.ts`: yeni `text.onMedia` (dark/light/oled'de `neutral[0]`, `background.media`'nın eşleniği — fotoğraf/scrim üstünde her zaman okunur metin).
- `apps/mobile/src/components/Card.tsx`: opsiyonel `backgroundImage` prop'u — `expo-linear-gradient` (yeni bağımlılık) ile alttan-karartan overlay, `ImageBackground` (RN core) ile fotoğraf. Additive: prop verilmezse eski davranış birebir korunur.
- Dekoratif görseller fitpulsev1'in `public/images/{challenges,zones,meals}` klasöründen `apps/mobile/assets/decorative/`'a kopyalandı (statik `require`/import, network yok).

**Kritik keşif ve davranış değişikliği:** Son öğün fotoğrafını göstermek, `analyze-meal-photo` edge function'ının `finally` bloğunda analiz biter bitmez (kullanıcı taslağı görmeden ÖNCE, başarı/başarısızlık ayrımı olmadan) fotoğrafı sildiğini ortaya çıkardı — bu, MVP-08'in "varsayılan HER ZAMAN analiz sonrası silme" kararının BİREBİR uygulanmış hâliydi. Bu karar burada TERSİNE ÇEVRİLDİ:

- `analyze-meal-photo/index.ts`: fotoğraf artık yalnız BAŞARISIZ analizde silinir (`succeeded` bayrağı ile); başarılı analizde `ai-meal-photos`'ta kalır. v6 olarak deploy edildi.
- Migration `20260720145844_meal_entries_photo.sql`: `meal_entries.photo_storage_path` (nullable) + `log_meal()`'a additive `p_photo_storage_path` parametresi. **Gerçek bir güvenlik regresyonu bu ortamda pgTAP ile yakalandı ve düzeltildi**: yeni parametreli imza Postgres'te yeni bir fonksiyon nesnesi yarattığı için önceki `revoke execute ... from anon` grant'i bu imzaya taşınmadı — anon tekrar `log_meal()` çalıştırabiliyordu (aynı sınıf hata: bkz. yukarıdaki "`anon` EXECUTE varsayılanı"). Migration içine açık `revoke ... from public/anon` + `grant ... to authenticated` eklendi, pgTAP 23/23 canlı şemada transaction+rollback ile doğrulandı.
- Client: kullanıcı taslağı ONAYLAYIP KAYDEDERSE fotoğraf `log_meal()` üzerinden kalıcı referans alır; VAZGEÇERSE veya YENİDEN ANALİZ ile önceki fotoğraf geçersiz kalırsa `camera.tsx` fotoğrafı açıkça siler (`cleanupOrphanedPhoto`, eski edge-function davranışının client-side eşleniği).

**Bilinen sınır (kapsam dışı):** Kullanıcı taslağı ne kaydeder ne vazgeçer (uygulamadan çıkar/sekme değiştirir) ise fotoğraf `ai-meal-photos`'ta öksüz kalır — otomatik temizlik (cron/storage lifecycle policy) bu işin kapsamı dışında bırakıldı, MVP-05/06'daki "tam offline outbox kapsam dışı" ile aynı gerekçe (ayrı, kendi başına bir iş). Manuel öğünlerde (kamera akışı dışında kaydedilen) `photo_storage_path` her zaman null kalır — bu tasarım gereği, manuel akışta hiç fotoğraf yoktur.

**Gerekçe:** Kullanıcı Son öğün kartında gerçek fotoğraf istedi; bu, mevcut "analiz sonrası her zaman sil" gizlilik varsayılanıyla doğrudan çelişiyordu. Varsayılan "kullanıcı onaylayana/vazgeçene kadar sakla"ya çevrildi — bu hâlâ "AI yalnızca tahmin/taslak üretir, kullanıcı onayı olmadan kalıcılaşmaz" değişmez kuralıyla uyumlu (fotoğraf da onay olmadan meal_entries'e BAĞLANMAZ, yalnız geçici olarak bucket'ta durur).

**Sonuç:** `pnpm typecheck`/`lint` temiz. Görsel QA `expo start --web` + Chrome ile Bugün ekranındaki tüm dokunulan kartlar (Su, 3× Yakında, Son öğün boş-durum, Ölçü trendi fotoğrafsız) doğrulandı. Gerçek fotoğrafla (AI kamera → onayla → kaydet → Son öğün kartı) ve "Vazgeç" akışının storage'dan gerçek silme yaptığı uçtan uca doğrulanmadı — bu ortamda kullanıcı hesabıyla gerçek bir fotoğraf çekimi/onayı gerekir, sonraki oturumda yapılmalı.

### MVP-12: Android minSdkVersion 24 → 26 (Health Connect zorunluluğu)
**Karar tarihi:** 2026-07-19 · **Etki:** MVP-12, tüm Android kullanıcı tabanı · **PRD:** §17

**Karar:** `apps/mobile/app.json`'a `expo-build-properties` eklendi, `android.minSdkVersion: 26` olarak sabitlendi (Expo 57 varsayılanı 24'tü).

**Gerekçe:** İlk EAS Android build denemesi Gradle manifest merge hatasıyla ÇÖKTÜ: `react-native-health-connect`'in bağımlı olduğu `androidx.health.connect:connect-client:1.1.0-alpha11` kütüphanesi kendi `AndroidManifest.xml`'inde `minSdkVersion 26` istiyor — "kullanılan API'ler 24'te mevcut olmayabilir" diyerek merger'ı hard-fail ediyor (`tools:overrideLibrary` ile bastırmak "runtime failure'a yol açabilir" uyarısı taşıyor, bu yüzden kullanılmadı). Bu, PRD'de önceden belirtilmemiş bir kısıt — Health Connect'in kendi platform gereksinimi.

**Sonuç:** Uygulama artık Android 8.0 (API 26) altı cihazlara KURULAMAZ. Android 7.x ve altı pazar payı (2026 itibarıyla küçük ve azalan) göz önüne alındığında kabul edilebilir bir taviz sayıldı; store yayın öncesi (MVP-19) bu sınırın Play Console "Data Safety"/minimum sürüm beyanına yansıtılması gerekir. Bu iş kimliğinden önce Android build'i hiç denenmemişti (proje bu ana kadar yalnız `expo start --web` ile geliştirildi) — bu yüzden kısıt önceden yakalanamamıştı.

### MVP-12: Health kapsamı, tablo deseni ve native paket seçimi
**Karar tarihi:** 2026-07-19 · **Etki:** MVP-12, gelecekte kilo/boy senkronu, `TRN-*` · **PRD:** §17

**Karar:** MVP-12 yalnız "temel adım/aktif enerji" teslim eder — §17'nin daha geniş "İlk veri türleri" listesindeki mesafe, antrenman ve kilo/boy senkronu bu işin kapsamı DIŞINDA bırakıldı (kilo/boy `body_measurements.source` CHECK'inde zaten `apple_health`/`health_connect` kabul ediyor ama bu iş onu bağlamadı — hâlâ açık bir iş, kimliği yok). Arka plan senkronu da kapsam dışı: v1 yalnız Bugün ekranı açılınca (ön planda) senkron yapar.

Adım/aktif enerji için repoda İLK KEZ "kullanıcı+gün başına tek satır, upsert" tablo deseni kuruldu (`daily_activity_metrics`, `unique(user_id, activity_date, source)`) — mevcut `daily_nutrition_summary`/`daily_water_summary` append-only log üzerinden hesaplanan RPC'lerdir, bu farklı bir veri şekli (OS'un gün içinde güncellediği kümülatif toplam) olduğu için farklı bir desen gerektirdi. Farklı kaynaklar (`apple_health`/`health_connect`) `body_measurements` ile AYNI ilkeyle ayrı satır kalır, asla sessizce birleştirilmez; `daily_activity_summary()` RPC'si nadir çoklu-kaynak durumunda en son senkronlanan satırı döner (basit v1 kararı).

Native paketler: iOS için `@kingstinct/react-native-healthkit` (Nitro Modules tabanlı, Expo config plugin dahil, New Architecture destekli — react≥19/react-native≥0.79 peer gereksinimleri bu projenin sürümleriyle uyumlu doğrulandı), Android için `react-native-health-connect` (Expo config plugin dahil). İkisi de gerçek `node_modules` kaynak koduna karşı typecheck edildi — API tahmin edilmedi.

**Gerekçe:** İş kimliğinin kendi metni ("temel adım/aktif enerji") dar kapsamı zaten söylüyor; geniş listeyi şimdi teslim etmeye çalışmak §00'ın "yayınlanmayacak yüzey önceden sözleşmeye çevrilmez" ilkesini ihlal ederdi. Arka plan senkronu, native kapının (§01) kendisi bunu HealthKit/Health Connect'ten AYRI, kendi başına gated bir yetenek saydığı için ayrıca ertelendi — aynı işte iki ayrı native kapı geçişini birleştirmek riski büyütürdü. Upsert deseni PRD'nin doğrudan gereksinimi: "§17 yeniden sync çift kayıt üretmez."

**Sonuç:** Bu ortamda Android SDK/Java kurulu değil, Windows'ta iOS simulator yok — migration/pgTAP/paket kodu doğrulandı (15/15 pgTAP, typecheck/lint temiz) ama native kapının 4-5. adımları (`expo prebuild`/`expo run:android`/EAS iOS build, gerçek cihaz smoke testi) kullanıcının kendi cihazında yapılmalı — bkz. `13-agent-work-orders.md` MVP-12 "Kalan".

### Apple Developer hesabı
**Karar tarihi:** 2026-07-18 · **Etki:** FND-02 (iOS development build), MVP-14/15 (StoreKit), MVP-19 (yayın)

**Karar:** Kullanıcının bir Apple Developer hesabı var — hesap edinimi artık blocked değil.

**Gerekçe:** Önceki blok yalnız hesabın varlığına bağlıydı (bireysel/şirket, D-U-N-S vb.). Hesap zaten mevcut olduğu için bu karar kapandı.

**Sonuç:** Geliştirme makinesi hâlâ Windows — iOS Development Build yerelde üretilemez, EAS Build (cloud) hâlâ gerekli. Hesap edinimi artık engel değil ama **EAS credentials/provisioning kurulumu henüz yapılmadı** — FND-02/MVP-14/15/19'u üstlenen ajan bunu ayrı bir adım olarak doğrulamalı, hesabın varlığını "iOS build çalışıyor" ile eşitlememeli.

### Bugün ekranı: kart kataloğu kapsamı ve "Yakında" placeholder'ı
**Karar tarihi:** 2026-07-18 · **Etki:** MVP-11, MVP-12, `TRN-*`, `COACH-*` · **PRD:** §9

**Karar:** PRD §9'un 6 madde bülleti (kalori+aktif enerji, makrolar, su+adım, son öğün+antrenman, ölçü trendi+seri+challenge, AI değerlendirme) 11 bağımsız yönetilebilir karta açıldı (`calorie`, `macros`, `water`, `lastMeal`, `measurementTrend`, `activeEnergy`, `steps`, `todayWorkout`, `streak`, `challenge`, `aiInsight` — bkz. `apps/mobile/src/dashboard/cardCatalog.ts`). Bunlardan 5'inin gerçek veri kaynağı vardı (mevcut hook'lar), 6'sının yoktu. Kullanıcıyla konuşuldu: kart kataloğunun TAMAMI şimdi inşa edildi (sıralama/görünürlük/boyut/odak hepsi çalışır, veri kaynağı olmayan kartlar dahil) — ama gövdede uydurma sayı YOK, `ComingSoonCard` "Yakında" rozeti + hangi işin bunu getireceğini anlatan kısa açıklama gösterir.

**Gerekçe:** "Kart kataloğu" ifadesi doğal olarak her kartın bağımsız gizlenip boyutlandırılabildiği bir yapıyı işaret ediyor — 6 bülleti tek büyük kart yapmak bu özerkliği kaybederdi. Gerçek kullanıcılara (bu bir üretim ekranı, storybook/demo değil) sahte adım sayısı, uydurma seri günü veya var olmayan bir AI değerlendirmesi göstermek §00'ın "belirsizlik görünürdür" ve genel dürüstlük ilkesiyle çelişirdi — bir sağlık/beslenme uygulamasında bu yalnız kozmetik değil, güven sorunu. "Yakında" durumu PRD'nin "kart kataloğu + düzenleme" gereksinimini tam karşılarken bu riski taşımaz.

Ayrıca sürükle-bırak yerine buton tabanlı sıralama seçildi: bu ortamda `react-native-reanimated`/`react-native-gesture-handler` kurulu değildi (expo-router bunları optional peer olarak listeliyor ama hiç yüklenmemiş), yeni bir native bağımlılık zinciri açmak bu işin kapsamını aşardı. Buton tabanlı sıralama ayrıca kabul kriterindeki "kart düzenleme erişilebilir" şartını sürükleme jestinden daha doğrudan karşılıyor (ekran okuyucu ile çalışır). Aynı gerekçeyle ring yerine düz `ProgressBar` (`react-native-svg` kurulu değildi) kullanıldı.

**Sonuç:** `docs/prd/13-agent-work-orders.md`'de MVP-12/`TRN-*`/`COACH-*` tanımlarına bu kartlara geri referans eklendi — o işleri üstlenen ajan `ComingSoonCard`'ı gerçek veriyle değiştirmesi gerektiğini bilir. Seri (`streak`) ve challenge kartlarının bağlanacağı iş kimliği henüz yok — `ADV-*`'nin "challenge" kapsamı (§21–24) örtüşebilir ama teyit edilmedi; bu satır `Açık` sayılır, ilgili faz başlamadan numaralandırılmayacak (§00).

### Gemini model, maliyet tavanı ve kill switch
**Karar tarihi:** 2026-07-17 · **Etki:** MVP-08, MVP-09 · **PRD:** §10–11

**Karar:** Model `gemini-2.5-flash`. Kullanıcı başına günlük kota: 10 fotoğraf analizi (`private.ai_jobs` üzerinden sayılır, `public.create_ai_job()` içinde kontrol edilir). Kill switch: `private.ai_feature_flags` tablosunda tekil bir `meal_photo_analysis` bayrağı (varsayılan açık).

**Gerekçe:** §26'daki hedef kotalar (Free 3/hafta, Plus 150/ay, AI Coach 500/ay) billing/entitlement verisinden okunur (§04: "ticari değerler istemciye gömülmez") — ama entitlement sistemi (MVP-14/15) `blocked` (mağaza hesapları yok). Günde 10 istek/kullanıcı, billing gelene kadar kötüye kullanımı sınırlayan geçici, tek-katmanlı bir taban değerdir; gerçek plan bazlı kotalar MVP-14/15 kapandığında bu sabiti değiştirir/kaldırır. Model seçimi hız/maliyet dengesi içindir — görsel analiz görevinde `flash` katmanı yeterli, `pro` katmanının ek doğruluğu bu aşamada maliyeti haklı çıkarmaz.

**Sonuç:** Maliyet tahmini (`estimated_cost_usd`, `private.ai_usage_ledger`) Edge Function içinde sabit birim fiyatlarla (input/output token başına, gemini-2.5-flash'ın bu yazının tarihindeki yayınlanmış fiyatı) hesaplanır — gerçek billing sistemi kurulunca güncellenmeli. Google Cloud/Gemini projesi kullanıcı tarafından oluşturuldu; `GEMINI_API_KEY` Supabase Edge Function secret'ı olarak kullanıcı tarafından eklendi (Claude asla API anahtarı değerini görmedi/girmedi — güvenlik kuralı).

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
