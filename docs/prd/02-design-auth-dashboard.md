# Tasarım, Hesap ve Dashboard

## Tasarım sistemi

Calouch modern, sade, premium, fotoğraf merkezli, tek elle kullanılabilir ve erişilebilir olmalıdır. iOS ve Android aynı marka dilini paylaşır; picker, switch, alert, context menu, share sheet, bottom sheet, başlık, haptic, izin ve geri hareketi platform davranışına uyarlanır.

### Navigasyon

Alt sekmeler: `Bugün`, `Günlük`, `AI Kamera`, `Antrenman`, `Profil`. Ortadaki kamera aksiyonu görsel olarak ayrışır ve öğün fotoğrafı, etiket, barkod, hareket formu ve ilerleme fotoğrafına açılabilir.

### Token zorunluluğu

Kod içinde doğrudan renk, radius ve spacing kullanılmaz. En az şu semantik token grupları bulunur:

- Background, surface, text, brand, status ve border renkleri.
- 4 tabanlı spacing ölçeği.
- Small/medium/large/full radius.
- Small/medium/large shadow.
- Display, heading, body, label, caption ve numeric tipografi.

Kalori, kilo ve antrenman sayıları tabular number kullanır. Makrolar yalnızca renkle ayrılmaz; metin veya ikon taşır.

### Tema ve erişilebilirlik

Tema: system, light, dark ve OLED black; yeniden başlatmadan değişir. Minimum dokunma alanı 44x44, dynamic type, screen reader etiketi, yüksek kontrast, Reduce Motion, haptic kapatma, grafik metin özeti, RTL ve tablet desteği gerekir. Safe area, klavye ve system-bar inset'leri ortak layout'ta çözülür.

## Kimlik doğrulama

Desteklenen akışlar:

- E-posta/şifre.
- Google.
- Apple.
- Şifre sıfırlama.
- Magic link.
- Opsiyonel biyometrik uygulama kilidi.

Auth hesabı ile `profiles` verisini ayır. Oturum yenileme, cold start, çıkış, iptal edilmiş OAuth ve ağ hataları test edilir. Apple ile giriş, platform kuralı gerektirdiği durumda görünür olmalıdır.

## Onboarding

Tek uzun form yerine adımlı akış kullanılır. Alanlar:

- Ad/rumuz, doğum yılı, boy, mevcut ve hedef kilo.
- Aktivite seviyesi ve ana hedef.
- Beslenme tercihi; opsiyonel alerji.
- Haftalık hedef değişim ve öğün düzeni.
- Birim sistemi ve dil.
- Bildirim tercihleri.
- Bağlamsal Health bağlantısı.

Hedefler kilo verme/alma/koruma, kas, sağlıklı beslenme, aktivite, antrenman düzeni ve ölçü geliştirmedir.

### Hedef motoru

Bazal metabolizma, günlük enerji ihtiyacı, kalori, protein, karbonhidrat, yağ, lif ve su hedefi üretir. Formül ve sürümü kaydedilir. Kullanıcı tüm değerleri sonradan düzenleyebilir. Riskli düşük hedef uyarılır; tıbbi tavsiye verilmez.

Onboarding Health veya bildirim izni reddedildiğinde tamamlanabilmelidir. Rıza ve izin açıklamaları ayrı tutulur.

## Bugün ekranı

Kart kataloğu:

- Kalan/tüketilen kalori ve aktif enerji.
- Protein, karbonhidrat ve yağ ilerlemesi.
- Su ve adım.
- Son öğün ve bugünkü antrenman.
- Ölçü trendi, seri ve challenge.
- AI kısa değerlendirme.

Kullanıcı kart sırasını, görünürlüğünü, desteklenen boyutunu ve günlük odak kartını seçebilir. Yerleşim tercihi kullanıcı hesabına kaydedilir, offline okunur ve cihazlar arası senkronize edilir.

## Kabul kriterleri

- Auth yöntemlerinin başarı, iptal, hata ve session restore durumları çalışır.
- Onboarding yarıda kalınca devam eder; izin reddi bloklamaz.
- Hedef hesabı unit testlidir, sürümlüdür ve manuel override korunur.
- Dashboard boş, loading, offline, hata ve dolu durumları gösterir.
- Kart düzenleme erişilebilir ve kalıcıdır.
- Light/dark/OLED, dynamic type, screen reader ve Reduce Motion kontrol edilir.
- Hiçbir health/personal değer analitik payload'a girmez.

