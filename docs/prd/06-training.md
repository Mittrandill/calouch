# Antrenman

## Egzersiz kataloğu

Egzersiz; yerelleştirilmiş ad, ana/yardımcı kas, ekipman, zorluk, açıklama, adımlar, sık hata, güvenlik uyarısı, lisanslı/üretilmiş medya, form desteği ve moderasyon durumu taşır.

Kas grupları ve ekipmanlar PRD §18'deki katalogla seed edilir; enum'ları UI metinlerine bağlama. İçerik çevirilebilir ve medya lisans kaydı taşır.

## Programlar

Kullanıcı hazır program seçer, kendi programını oluşturur veya AI taslağını düzenler. Gün, egzersiz, set/tekrar/ağırlık, dinlenme, superset, dropset, warm-up, hafta ve deload modellenir. Program kopyalanabilir ve sürümlenebilir.

AI programı kullanıcı onayı olmadan aktif edilmez. Aktif program değişikliği geçmiş session verisini değiştirmez.

## Canlı antrenman

Ekran en az aktif egzersiz, set, hedef/tamamlanan tekrar, ağırlık, RPE, RIR, önceki değer, PR, dinlenme, sonraki egzersiz, süre, hacim ve not gösterir.

Mutation'lar:

- Session başlat/devam/bitir.
- Set ekle/güncelle/tamamla/sil.
- Egzersiz atla/değiştir.
- Dinlenme başlat/uzat/kısalt/atla.
- Not, RPE ve RIR kaydet.

## Dinlenme sayacı

Arka planda ve ekran kilidinde doğru kalır. Mutlak `ends_at` zamanı kullanır; yalnızca memory decrement'e dayanmaz. Bildirim/titreşim tercihe bağlıdır. 15 saniye artır/azalt, atla ve egzersiz varsayılanı desteklenir.

## Oturum kurtarma

Aktif antrenman SQLite, uygulama state'i ve periyodik server snapshot ile korunur. App kill/crash sonrası kaldığı yerden devam edilir. Outbox operation ID'leri set kayıtlarını çoğaltmaz.

## Hesaplamalar

- Toplam hacim: iş kuralına göre set x tekrar x ağırlık; bodyweight/assisted hareketler ayrıca modellenir.
- PR türleri açıkça tanımlanır: ağırlık, tekrar, hacim veya tahmini 1RM.
- RPE/RIR opsiyoneldir ve aralık doğrulaması vardır.
- Önceki performans aynı egzersiz ve uyumlu varyasyonla karşılaştırılır.

## Kabul kriterleri

- Katalog filtreleri kas, ekipman, zorluk ve form desteğiyle çalışır.
- Program versiyonu geçmiş antrenmanı değiştirmez.
- App kill, offline ve reconnect sırasında aktif session kurtarılır.
- Dinlenme sayacı background/lock sonrası doğru süreyi gösterir.
- Aynı offline set mutation'ı server'da bir kez uygulanır.
- Session completion, setler, hacim ve PR transaction'ı atomiktir.
- Erişilebilir büyük kontrollerle tek elle set kaydı yapılabilir.

