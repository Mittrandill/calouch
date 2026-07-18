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

/**
 * Katalogdaki tek bir food version'ın 100 g snapshot'ı. Nullable alanlar
 * gerçekten "bilinmiyor" demektir; deterministik motor bunları sıfıra çevirmez.
 */
export type CatalogNutrientSnapshot = {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  sugarG: number | null;
  fatG: number;
  saturatedFatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
};

export type CatalogFoodMatch = {
  foodId: string;
  foodVersionId: string;
  matchedName: string;
  matchedCandidate: string;
  matchedLocale: 'tr' | 'en';
  matchScore: number;
  source: {
    key: string;
    displayName: string;
  };
  per100g: CatalogNutrientSnapshot;
};

export type NutrientEstimateRange = {
  estimated: CatalogNutrientSnapshot;
  minimum: CatalogNutrientSnapshot;
  maximum: CatalogNutrientSnapshot;
};

/**
 * Provider adayının katalog eşleştirmesiyle zenginleştirilmiş hali. Eşleşme
 * yoksa nutrient tahmini de yoktur; AI'dan gelen kalori hiçbir zaman fallback
 * olarak kullanılmaz.
 */
export type MealDraftItem = MealAnalysisItem & {
  catalogMatch: CatalogFoodMatch | null;
  nutrients: NutrientEstimateRange | null;
};

/** MVP-09 çıktısı: yalnız katalog snapshot'ından yeniden üretilebilir taslak. */
export type MealDraft = {
  analysisVersion: 'meal-draft-v1';
  providerAnalysisVersion: string;
  mealTitle: string;
  items: MealDraftItem[];
  overallConfidence: ConfidenceLevel;
  requiresUserConfirmation: true;
  unmatchedItemCount: number;
  /** Bir kalem bile eşleşmediyse eksik bir toplam sunmamak için null'dır. */
  totals: NutrientEstimateRange | null;
};

export type AIJobStatus = 'created' | 'processing' | 'needs_confirmation' | 'failed' | 'expired';

export type AIJob = {
  jobId: string;
  status: AIJobStatus;
  result: MealDraft | null;
  errorCode: string | null;
  errorMessage: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
};
