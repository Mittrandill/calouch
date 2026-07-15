# AI Yemek Analizi

## Kullanıcı akışı

1. Kullanıcı fotoğraf çeker veya galeriden seçer.
2. Cihaz görüntüyü yeniden boyutlandırır; EXIF ve konumu temizler.
3. Görsel private geçici alana yüklenir.
4. Sunucu bir AI job oluşturur ve kota/kredi rezervasyonu yapar.
5. Gemini yiyecek ve porsiyon adayları üretir.
6. JSON Schema doğrulaması yapılır.
7. Adaylar Calouch besin kataloğuyla eşleştirilir.
8. Deterministik motor kalori ve makroyu hesaplar.
9. Kullanıcı güven/aralık içeren taslağı düzenler veya onaylar.
10. Onayla öğün transaction'ı tamamlanır; saklama tercihi yoksa görsel süre sonunda silinir.

## Çıktı kontratı

Her kalem: aday adlar, tahmini/min/max gram, porsiyon türü, pişirme yöntemi, görünen ve olası gizli malzeme, confidence ve eşleşen veri kaynağı taşır. Kalori, protein, karbonhidrat, yağ ve lif yalnızca eşleşen besin snapshot'ından hesaplanır.

Üst düzey sonuç `analysisVersion`, öğün başlığı, kalemler, `overallConfidence` ve `requiresUserConfirmation: true` içerir. Şema dışı yanıt son kullanıcıya gösterilmez.

## Doğruluk destekleri

İsteğe bağlı ikinci/yan fotoğraf, tabak çapı, porsiyon boyutu, yağ, sos, tüketilen oran ve manuel gram girdisi sunulabilir. Her düzeltme ayrı AI geri bildirim kaydıdır; katalog verisini otomatik değiştirmez.

## Provider mimarisi

Gemini ilk provider'dır; domain provider'a kilitlenmez:

```ts
interface AIProvider {
  analyzeMealImage(input: unknown): Promise<MealAnalysis>
  analyzeNutritionLabel(input: unknown): Promise<NutritionLabel>
  parseMealText(input: unknown): Promise<MealDraft>
  generateMealPlan(input: unknown): Promise<MealPlanDraft>
  generateWorkoutPlan(input: unknown): Promise<WorkoutPlanDraft>
  createWeeklySummary(input: unknown): Promise<WeeklySummary>
}
```

Kesin tipler `packages/types` ve `packages/validation` içinde paylaşılır. Model adları mobilde veya iş mantığında sabitlenmez; server-side config hızlı, güçlü, text ve live görevlerini yönlendirir.

## Güvenlik

- Gemini key yalnızca server secret store'dadır.
- Mobil yalnızca Calouch backend ile konuşur.
- MIME, boyut, piksel sınırı ve gerçek dosya içeriği doğrulanır.
- Signed upload/download kısa sürelidir.
- EXIF temizliği test edilir.
- Görsel, prompt, AI cevabı ve öğün içeriği uygulama logu/analitiğine girmez.
- Job erişimi kullanıcı sahipliği ile korunur.

## Job state machine

Önerilen durumlar: `created`, `uploaded`, `queued`, `processing`, `needs_confirmation`, `completed`, `failed`, `cancelled`, `expired`.

Geçişler idempotenttir. Aynı fotoğraf hash'i için politika belirlenir. Timeout/retry sınırlıdır; başarısız veya iptal işte rezervasyon/kredi transaction ile iade edilir.

## Kota ve maliyet

Her istek model, input/output kullanımı, süre, tahmini maliyet, cache durumu, kullanıcı planı ve job kimliğiyle ledger'a yazılır. Kontroller: kullanıcı/plan kotası, günlük/global limit, rate limit, cache, model fallback, global kill switch ve maliyet dashboard'u.

Free haftada 3, Plus ayda 150, AI Coach ayda 500 fotoğraf analizi hedefler; ticari değerler remote config/entitlement verisinden okunur, istemciye gömülmez.

## Hata davranışı

- Yemek olmayan fotoğraf açıkça reddedilir.
- Düşük güven taslakta görünür ve kesin dil kullanılmaz.
- Katalog eşleşmesi yoksa kullanıcı manuel arama/özel besine yönlenir.
- Network timeout iş durumunu kaybetmez; kullanıcı tekrar sorgular.
- AI kapalı veya kota doluysa manuel öğün akışı çalışır.

## Kabul kriterleri

- Gemini key mobile bundle ve public env'de bulunmaz.
- Şema dışı/mock bozuk yanıt kullanıcıya ulaşmaz.
- Onaysız sonuç `meal_entries` oluşturmaz.
- Kalori sonucu katalog snapshot'ı ile yeniden üretilebilir.
- Başarısız/tekrarlanan job çift kredi düşmez.
- Fotoğraf saklama tercihi ve expiry cleanup doğrulanır.
- Türk yemekleri, karışık tabak, düşük ışık, kısmen yenmiş ve non-food evaluation seti raporlanır.

