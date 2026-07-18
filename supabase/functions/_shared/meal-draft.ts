// Implements: MVP-09
// Saf, yan etkisiz deterministik motor. Provider yalnız ad/gram tahmini verir;
// bu modülün kabul ettiği nutrient değerleri sadece catalog.food_versions
// snapshot'ından gelir. Edge Function ve unit test aynı kodu çalıştırır.

export type NullableNutrients = {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  sugarG: number | null;
  fatG: number;
  saturatedFatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
};

export type CatalogMatch = {
  foodId: string;
  foodVersionId: string;
  matchedName: string;
  matchedCandidate: string;
  matchedLocale: 'tr' | 'en';
  matchScore: number;
  source: { key: string; displayName: string };
  per100g: NullableNutrients;
};

export type RawMealItem = {
  candidateNames: string[];
  estimatedGrams: number;
  minGrams: number;
  maxGrams: number;
  portionType: string;
  cookingMethod: string | null;
  visibleIngredients: string[];
  possibleHiddenIngredients: string[];
  confidence: 'low' | 'medium' | 'high';
};

export type RawFoodAnalysis = {
  isFood: true;
  analysisVersion: string;
  mealTitle: string;
  items: RawMealItem[];
  overallConfidence: 'low' | 'medium' | 'high';
  requiresUserConfirmation: true;
};

const OPTIONAL_KEYS = ['sugarG', 'saturatedFatG', 'fiberG', 'sodiumMg'] as const;
const REQUIRED_KEYS = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;

function scale(per100g: NullableNutrients, grams: number): NullableNutrients {
  const factor = grams / 100;
  return {
    energyKcal: per100g.energyKcal * factor,
    proteinG: per100g.proteinG * factor,
    carbsG: per100g.carbsG * factor,
    sugarG: per100g.sugarG === null ? null : per100g.sugarG * factor,
    fatG: per100g.fatG * factor,
    saturatedFatG:
      per100g.saturatedFatG === null ? null : per100g.saturatedFatG * factor,
    fiberG: per100g.fiberG === null ? null : per100g.fiberG * factor,
    sodiumMg: per100g.sodiumMg === null ? null : per100g.sodiumMg * factor,
  };
}

function sum(items: readonly NullableNutrients[]): NullableNutrients {
  const result: NullableNutrients = {
    energyKcal: 0,
    proteinG: 0,
    carbsG: 0,
    sugarG: null,
    fatG: 0,
    saturatedFatG: null,
    fiberG: null,
    sodiumMg: null,
  };

  for (const key of REQUIRED_KEYS) {
    result[key] = items.reduce((total, item) => total + item[key], 0);
  }
  for (const key of OPTIONAL_KEYS) {
    if (items.every((item) => item[key] !== null)) {
      result[key] = items.reduce((total, item) => total + (item[key] ?? 0), 0);
    }
  }
  return result;
}

export function buildMealDraft(raw: RawFoodAnalysis, matches: readonly (CatalogMatch | null)[]) {
  if (matches.length !== raw.items.length) {
    throw new Error('Her analiz kalemi için tam bir katalog eşleşme sonucu gerekir');
  }

  const items = raw.items.map((item, index) => {
    const catalogMatch = matches[index] ?? null;
    return {
      ...item,
      catalogMatch,
      nutrients:
        catalogMatch === null
          ? null
          : {
              estimated: scale(catalogMatch.per100g, item.estimatedGrams),
              minimum: scale(catalogMatch.per100g, item.minGrams),
              maximum: scale(catalogMatch.per100g, item.maxGrams),
            },
    };
  });

  const unmatchedItemCount = items.filter((item) => item.catalogMatch === null).length;
  const allNutrients = items.map((item) => item.nutrients).filter((value) => value !== null);

  // Eksik toplam güvenli bir toplam değildir. Bir kalem eşleşmediyse `totals`
  // null kalır ve MVP-10 kullanıcıyı manuel katalog aramasına yönlendirir.
  const totals =
    unmatchedItemCount > 0
      ? null
      : {
          estimated: sum(allNutrients.map((range) => range.estimated)),
          minimum: sum(allNutrients.map((range) => range.minimum)),
          maximum: sum(allNutrients.map((range) => range.maximum)),
        };

  return {
    analysisVersion: 'meal-draft-v1' as const,
    providerAnalysisVersion: raw.analysisVersion,
    mealTitle: raw.mealTitle,
    items,
    overallConfidence: raw.overallConfidence,
    requiresUserConfirmation: true as const,
    unmatchedItemCount,
    totals,
  };
}
