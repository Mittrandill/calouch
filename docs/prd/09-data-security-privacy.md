# Veri, Güvenlik ve Gizlilik

## Veri ilkeleri

Veri domain bazlı, kullanıcı sahipliği açık, sürümlü, denetlenebilir, offline uyumlu, silinebilir, dışa aktarılabilir, AI provider bağımsız ve veri minimizasyonuna uygun olmalıdır.

Şemalar:

- `public`: istemciden erişilen, RLS korumalı kullanıcı tabloları.
- `private`: yalnız server-side.
- `audit`: güvenlik ve işlem kayıtları.
- `catalog`: besin/egzersiz içeriği.
- `billing`: ürün, satın alma ve entitlement.

Bir şemanın Data API'ye açık olması GRANT ile, satır erişimi RLS ile ayrı ayrı yönetilir.

## RLS sözleşmesi

- İstemciden erişilebilen her tabloda RLS zorunlu.
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` ayrı policy'dir.
- Kullanıcı sahipliği tipik olarak `(select auth.uid()) = user_id` ile kontrol edilir.
- `UPDATE` hem `USING` hem `WITH CHECK` taşır ve ayrıca gerekli `SELECT` policy bulunur.
- Yalnız `TO authenticated` yetkilendirme değildir.
- Rol kararı kullanıcı tarafından değiştirilebilen metadata'dan alınmaz; admin rolü server kontrollü app metadata/rol tablosundan gelir.
- View'lar `security_invoker` veya kapalı şema ile RLS sınırını korur.
- `SECURITY DEFINER` yalnız zorunluysa kapalı şemada, açık auth kontrolü ve dar EXECUTE grant ile kullanılır.

Her migration pozitif/negatif RLS testi taşır: sahibi okuyabilir/yazar; başka kullanıcı ve anon erişemez; ownership değiştirilemez.

## Storage

Private: meal images, profile images, body progress, form videos, exports ve admin imports. Public: onaylı egzersiz medyası ve hukuk belgeleri.

Object path kullanıcı sahipliği taşır. Signed URL kısa sürelidir. Storage policy'leri select/insert/update/delete ayrı test edilir; upsert için gereken yetkiler açıkça verilir. Hassas bucket'ta public access yoktur.

## Transaction sınırları

Öğün + kalem/snapshot, antrenman completion, challenge progress, AI kredi reserve/refund, entitlement geçişi ve hesap silme state değişimleri atomiktir. Client'ın birden çok bağımsız write yapmasına bırakılmaz.

## Offline ve outbox

Offline destek: manuel öğün taslağı, su, set/tekrar, workout completion, ölçü, son besinler ve günlük hedef görünümü.

- SecureStore: token/küçük secret.
- SQLite: domain cache ve outbox.
- File system: geçici medya.
- TanStack Query persistence: yeniden üretilebilir server cache.

Outbox `operation_id`, entity/type/id, operation, payload, created time, attempt, last error ve status taşır. Endpoint idempotency aynı operation'ı bir kez uygular. Ayarlarda last-write-wins; öğün/antrenmanda version kontrolü; kritik çatışmada iki sürüm kullanıcıya sunulur.

## Güvenlik katmanları

TLS, platform disk encryption, RLS/RBAC, private storage/signed URL, SecureStore, rate limit, input validation, audit, secret management, dependency/secret scan, log redaction, backup ve retention gerekir.

Ek envelope encryption yalnız özel sağlık/alerji notu, kullanıcı özel notu veya opt-in özel AI konuşması gibi seçili alanlarda değerlendirilir. Anahtar rotasyonu ve arama gereksinimi tasarım öncesi netleştirilir.

Loglara medya, token, API key, parola, tam sağlık kaydı veya tam AI konuşması yazılmaz.

## Admin güvenliği

MFA, RBAC, kısa/uygun session, hassas işlem re-auth, audit trail, bulk export sınırı ve cihaz/IP kaydı gerekir. Service-role mobil, browser client veya public env'e girmez.

## Rıza ve KVKK

Hesap, iletişim, cihaz, beslenme, medya, ölçü, aktivite, antrenman, form, AI, billing, log ve consent için veri envanteri tutulur. Sağlıkla ilişkilendirilebilir veri yüksek hassasiyetle işlenir.

Aydınlatma ve açık rıza ayrı yüzeylerdir. Consent kaydı tür, belge sürümü, dil, zaman, app sürümü, verildi/reddedildi/geri çekildi ve geri çekilme zamanı taşır.

Supabase, Google, Vercel, Sentry ve ödeme sağlayıcısı için gönderilen veri, amaç, ülke, retention, subprocessor, silme, teknik önlem ve hukuki dayanak hukuk onayıyla belgelenir.

Gerekli metinler: KVKK aydınlatma, açık rıza, privacy, terms, membership/subscription/renewal, retention/destruction, data subject request, incident plan, subprocessors/international transfer, AI disclosure, health disclaimer, account deletion/export ve cookie policy.

## Gizlilik merkezi

Toplanan veri, bağlı servis, Health izinleri, AI/fotoğraf kullanımı, analitik/pazarlama tercihi, consent withdrawal, export ve delete tek erişilebilir merkezden yönetilir.

## Hesap silme

Uygulama içi yol ve public web başlatma sayfası bulunur. Akış: re-auth -> abonelik bilgisi -> request -> session revoke -> storage -> kullanıcı domain verisi -> AI geçmişi -> analitik anonimleştirme -> auth hesabı -> completion audit.

Silme retry edilebilir bir state machine'dir; yarım silme görünür ve operasyonel olarak izlenebilir. Yasal tutulması gereken minimum billing/audit kayıtları hukukça belirlenen şekilde ayrıştırılır.

## Veri dışa aktarma

JSON, CSV ve PDF özet asenkron üretilir. Private bucket, kısa signed URL ve otomatik expiry kullanılır. Export başka kullanıcıyı içermez, rate limited'dir ve audit edilir.

## Kabul kriterleri

- Tüm exposed tablolar RLS/grant envanterinde ve çapraz kullanıcı testinde.
- Hassas bucket public değildir; signed URL expiry test edilir.
- Secret ve hassas veri log/analytics taramasında bulunmaz.
- Offline retry çift mutation üretmez ve çatışma sessiz veri kaybetmez.
- Consent sürümü/withdrawal işleme davranışını etkiler.
- Delete uçtan uca tekrar denenebilir ve public web yolu vardır.
- Export yalnız kullanıcı verisini içerir ve expiry sonrası indirilemez.

