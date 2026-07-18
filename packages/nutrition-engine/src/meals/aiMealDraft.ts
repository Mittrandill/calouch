import type {
  CatalogFoodMatch,
  CatalogNutrientSnapshot,
  MealAnalysis,
  MealDraft,
} from '@calouch/types';

const OPTIONAL_KEYS = ['sugarG', 'saturatedFatG', 'fiberG', 'sodiumMg'] as const;
const REQUIRED_KEYS = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;

/**
 * Bir 100 g snapshot'ını verilen grama ölçekler; bilinmeyen (null) opsiyonel
 * alan null kalır, sıfır SAYILMAZ. MVP-10: mobil taraf kullanıcının taslakta
 * düzenlediği gram değeri için kcal/makro önizlemesini bu AYNI saf fonksiyonla
 * yeniden hesaplar — mantık iki yerde ayrı ayrı yazılmaz.
 */
export function scaleCatalogNutrients(
  per100g: CatalogNutrientSnapshot,
  grams: number,
): CatalogNutrientSnapshot {
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

/**
 * Birden çok kalemin snapshot'ını toplar; bir kalemde eksik olan opsiyonel
 * alan TÜMÜNDE eksikmiş gibi toplamı sessizce sıfırlamaz — yalnız TÜM
 * kalemler o alanı taşıyorsa toplanır (bkz. `daily_nutrition_summary` ile
 * aynı semantik).
 */
export function sumCatalogNutrients(
  items: readonly CatalogNutrientSnapshot[],
): CatalogNutrientSnapshot {
  const result: CatalogNutrientSnapshot = {
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

/**
 * MVP-09 deterministik motorunun domain sürümü. Edge deploy birimi aynı saf
 * algoritmayı `supabase/functions/_shared/meal-draft.ts` içinde taşır.
 */
export function buildAiMealDraft(
  raw: Extract<MealAnalysis, { isFood: true }>,
  matches: readonly (CatalogFoodMatch | null)[],
): MealDraft {
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
              estimated: scaleCatalogNutrients(catalogMatch.per100g, item.estimatedGrams),
              minimum: scaleCatalogNutrients(catalogMatch.per100g, item.minGrams),
              maximum: scaleCatalogNutrients(catalogMatch.per100g, item.maxGrams),
            },
    };
  });
  const unmatchedItemCount = items.filter((item) => item.catalogMatch === null).length;
  const allNutrients = items.map((item) => item.nutrients).filter((value) => value !== null);
  const totals =
    unmatchedItemCount > 0
      ? null
      : {
          estimated: sumCatalogNutrients(allNutrients.map((range) => range.estimated)),
          minimum: sumCatalogNutrients(allNutrients.map((range) => range.minimum)),
          maximum: sumCatalogNutrients(allNutrients.map((range) => range.maximum)),
        };

  return {
    analysisVersion: 'meal-draft-v1',
    providerAnalysisVersion: raw.analysisVersion,
    mealTitle: raw.mealTitle,
    items,
    overallConfidence: raw.overallConfidence,
    requiresUserConfirmation: true,
    unmatchedItemCount,
    totals,
  };
}
