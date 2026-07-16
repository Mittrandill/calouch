/**
 * §03 hesap motoru sözleşmesi. Bu paket saf TypeScript'tir; veritabanı
 * şemasından bağımsızdır (§01) — katalogdan gelen değerler burada argüman
 * olarak geçilir.
 *
 * Zorunlu alanlar (`catalog.food_nutrients`'ta NOT NULL): enerji, protein,
 * karbonhidrat, yağ. Opsiyonel alanlar (şeker, doymuş yağ, lif, sodyum)
 * bazı kaynaklarda hiç ölçülmemiş olabilir — `undefined` "sıfır" DEĞİL,
 * "bilinmiyor" demektir.
 */
export type NutrientProfile = {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  sugarG?: number;
  fatG: number;
  saturatedFatG?: number;
  fiberG?: number;
  sodiumMg?: number;
};

/** `sumNutrients`/`nutrientsForRecipe` girdisi: bir kalemin değeri + ağırlığı. */
export type WeightedNutrients = {
  /** 100 g başına değerler (katalogdaki ham veri). */
  per100g: NutrientProfile;
  grams: number;
};

export const OPTIONAL_NUTRIENT_KEYS = [
  'sugarG',
  'saturatedFatG',
  'fiberG',
  'sodiumMg',
] as const;

export const REQUIRED_NUTRIENT_KEYS = ['energyKcal', 'proteinG', 'carbsG', 'fatG'] as const;
