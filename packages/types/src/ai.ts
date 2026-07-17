/**
 * AI fotoğraf analizi tipleri. §04 "Çıktı kontratı" ve "Provider mimarisi".
 *
 * KAPSAM (MVP-08): yalnız `analyzeMealImage`. §04'teki `AIProvider`
 * arayüzü `analyzeNutritionLabel`/`parseMealText`/`generateMealPlan`/
 * `generateWorkoutPlan`/`createWeeklySummary` de listeler — bunlar henüz
 * tasarlanmadığı için buraya EKLENMEDİ (yarım bir tip, hiç tip olmamasından
 * kötüdür); ilgili iş (COACH, TRN, VOICE fazları) başladığında eklenir.
 *
 * Bu dosya saf TypeScript'tir — Zod bağımlılığı yok (bkz. `packages/validation`,
 * çalışma zamanı doğrulaması orada yaşar; burası yalnız derleme zamanı sözleşmesidir).
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Tek bir yemek kalemi adayı. §04: "Her kalem: aday adlar, tahmini/min/max
 * gram, porsiyon türü, pişirme yöntemi, görünen ve olası gizli malzeme,
 * confidence ve eşleşen veri kaynağı taşır."
 *
 * "Eşleşen veri kaynağı" MVP-09'un işi (katalog eşleştirme) — bu kalem
 * kataloğa henüz BAĞLANMAMIŞ ham bir Gemini adayıdır.
 */
export type MealAnalysisItem = {
  candidateNames: string[];
  estimatedGrams: number;
  minGrams: number;
  maxGrams: number;
  portionType: string;
  cookingMethod: string | null;
  visibleIngredients: string[];
  possibleHiddenIngredients: string[];
  confidence: ConfidenceLevel;
};

/**
 * Üst düzey analiz sonucu. §04: "analysisVersion, öğün başlığı, kalemler,
 * overallConfidence ve requiresUserConfirmation: true içerir."
 *
 * `isFood: false` durumu §04 "Hata davranışı": "Yemek olmayan fotoğraf
 * açıkça reddedilir" — bu durumda `items` boş, `rejectionReason` dolu olur.
 */
export type MealAnalysis =
  | {
      isFood: true;
      analysisVersion: string;
      mealTitle: string;
      items: MealAnalysisItem[];
      overallConfidence: ConfidenceLevel;
      requiresUserConfirmation: true;
    }
  | {
      isFood: false;
      analysisVersion: string;
      rejectionReason: string;
    };

/**
 * §04 "Provider mimarisi": "Gemini ilk provider'dır; domain provider'a
 * kilitlenmez." Sunucu tarafında (Edge Function) kullanılır — mobil bu
 * arayüzü hiç import etmez, yalnız Edge Function'ın döndürdüğü
 * `MealAnalysis`'i tüketir.
 */
export type AIProvider = {
  analyzeMealImage(input: { imageBase64: string; mimeType: string }): Promise<MealAnalysis>;
};
