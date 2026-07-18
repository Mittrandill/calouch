import type { CatalogNutrientSnapshot, FoodSearchResult, MealDraftItem } from '@calouch/types';
import { scaleCatalogNutrients } from '@calouch/nutrition-engine';

/**
 * MVP-10 taslak düzenleme durumu — kalem başına. `manualFood` yalnız
 * orijinalde `catalogMatch === null` olan kalemler için doludur (§04
 * "Katalog eşleşmesi yoksa kullanıcı manuel arama/özel besine yönlenir").
 */
export type DraftItemState = {
  included: boolean;
  gramsInput: string;
  manualFood: FoodSearchResult | null;
};

export function initialDraftItemState(item: MealDraftItem): DraftItemState {
  return {
    // Eşleşmeyen kalem varsayılan olarak kaydetme listesine girmez — kullanıcı
    // manuel bir besin seçerse dahil olur (bkz. `applyManualFood` çağrı yeri).
    included: item.catalogMatch !== null,
    gramsInput: String(item.estimatedGrams),
    manualFood: null,
  };
}

/**
 * `search_foods` dönüşü yalnız zorunlu dört nutrient'ı taşır (§03); eksik
 * opsiyonel alanlar burada da "bilinmiyor" (null) kalır, sıfır sayılmaz.
 */
function per100gFromSearchResult(food: FoodSearchResult): CatalogNutrientSnapshot {
  return {
    energyKcal: food.energy_kcal,
    proteinG: food.protein_g,
    carbsG: food.carbs_g,
    sugarG: null,
    fatG: food.fat_g,
    saturatedFatG: null,
    fiberG: null,
    sodiumMg: null,
  };
}

/**
 * Kalemin şu anki (düzenlenmiş gram/manuel eşleşme dahil) canlı önizlemesi.
 * `null` = henüz kaydedilebilir değil (katalog eşleşmesi/manuel seçim yok
 * veya gram geçersiz) — çağıran bunu "toplama dahil etme" sinyali olarak
 * kullanır.
 *
 * `manualFood` her zaman `catalogMatch`'ten ÖNCELİKLİDİR: kullanıcı bir
 * kalemi elle değiştirdiyse (ör. zayıf otomatik eşleşmeyi düzeltmek için),
 * bu seçim orijinal AI eşleşmesini geçersiz kılar.
 */
export function previewNutrients(
  item: MealDraftItem,
  state: DraftItemState,
): CatalogNutrientSnapshot | null {
  const per100g =
    state.manualFood !== null
      ? per100gFromSearchResult(state.manualFood)
      : (item.catalogMatch?.per100g ?? null);
  if (per100g === null) return null;

  const grams = Number.parseFloat(state.gramsInput.replace(',', '.'));
  if (!Number.isFinite(grams) || grams <= 0) return null;

  return scaleCatalogNutrients(per100g, grams);
}

/** Kaydedilecek katalog besin kimliği — manuel seçim varsa o, yoksa orijinal eşleşme. */
export function resolvedFoodId(item: MealDraftItem, state: DraftItemState): string | null {
  return state.manualFood?.food_id ?? item.catalogMatch?.foodId ?? null;
}

/**
 * `match_ai_food`'un bulanık (trigram) benzerlik skoru — 1.0 tam eşleşme,
 * daha düşük değerler yalnızca isim benzerliğine dayanan ZAYIF bir eşleşmeyi
 * gösterir (ör. "Adana kebap" adayı, katalogda kebap olmadığı için "Izgara
 * köfte"ye ~0.44 skorla düşer). §04 "düşük güven açıkça işaretlenir" AI'nin
 * kendi tahmin güvenine (confidence) kadar değil, bu tür sessiz yanlış
 * eşleşmelere de uygulanır — kullanıcı gözden geçirmeden onaylamamalı.
 */
export const WEAK_MATCH_SCORE_THRESHOLD = 0.7;

export function isWeakCatalogMatch(item: MealDraftItem): boolean {
  return item.catalogMatch !== null && item.catalogMatch.matchScore < WEAK_MATCH_SCORE_THRESHOLD;
}
