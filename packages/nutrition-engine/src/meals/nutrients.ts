import { OPTIONAL_NUTRIENT_KEYS, REQUIRED_NUTRIENT_KEYS, type NutrientProfile, type WeightedNutrients } from './types';

export class NutrientCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NutrientCalculationError';
  }
}

/**
 * §03: "100 g değerini gram/porsiyona dönüştürür."
 *
 * Bir porsiyon zaten bir gram miktarıdır (`food_portions.grams`); ayrı bir
 * "porsiyon için" fonksiyona gerek yok — porsiyon çözümlemesi (etiket ->
 * gram) bir veri sorgusudur, matematik değil.
 *
 * Yuvarlama YAPILMAZ (§03 "Yuvarlama yalnızca gösterim katmanında
 * yapılır") — ardışık toplamalarda hata birikmesin diye tam hassasiyet
 * korunur.
 */
export function nutrientsForGrams(per100g: NutrientProfile, grams: number): NutrientProfile {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new NutrientCalculationError(`Geçersiz gram miktarı: ${grams}`);
  }

  const factor = grams / 100;
  const result: NutrientProfile = {
    energyKcal: per100g.energyKcal * factor,
    proteinG: per100g.proteinG * factor,
    carbsG: per100g.carbsG * factor,
    fatG: per100g.fatG * factor,
  };

  for (const key of OPTIONAL_NUTRIENT_KEYS) {
    const value = per100g[key];
    if (value !== undefined) result[key] = value * factor;
  }

  return result;
}

/**
 * Birden çok kalemi (öğün kalemleri veya günün öğünleri) toplar.
 *
 * §03: "Eksik nutrient değerini sıfırmış gibi sessizce sunmaz." Zorunlu
 * alanlar (kalori/protein/karb/yağ) katalogda NOT NULL'dur, her zaman
 * toplanır. Opsiyonel bir alan (ör. sodyum) kalemlerden BİRİNDE bile
 * eksikse, o alanın toplamı `undefined` döner — "270 mg" gibi yanlışlıkla
 * tam görünen ama aslında eksik bir sayı üretilmez. Arayüz bunu "bu değer
 * bilinmiyor" olarak göstermelidir, "0" olarak değil.
 */
export function sumNutrients(items: readonly NutrientProfile[]): NutrientProfile {
  if (items.length === 0) {
    throw new NutrientCalculationError('Toplanacak kalem yok');
  }

  const sum: NutrientProfile = { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  for (const key of REQUIRED_NUTRIENT_KEYS) {
    sum[key] = items.reduce((acc, item) => acc + item[key], 0);
  }

  for (const key of OPTIONAL_NUTRIENT_KEYS) {
    const allPresent = items.every((item) => item[key] !== undefined);
    if (allPresent) {
      sum[key] = items.reduce((acc, item) => acc + (item[key] ?? 0), 0);
    }
    // allPresent değilse alan tanımsız bırakılır — kısmi toplam sunulmaz.
  }

  return sum;
}

/** Bir tarifin toplamını porsiyon sayısına böler. */
export function divideNutrients(total: NutrientProfile, divisor: number): NutrientProfile {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    throw new NutrientCalculationError(`Geçersiz bölen: ${divisor}`);
  }

  const result: NutrientProfile = {
    energyKcal: total.energyKcal / divisor,
    proteinG: total.proteinG / divisor,
    carbsG: total.carbsG / divisor,
    fatG: total.fatG / divisor,
  };

  for (const key of OPTIONAL_NUTRIENT_KEYS) {
    const value = total[key];
    if (value !== undefined) result[key] = value / divisor;
  }

  return result;
}

/**
 * §03: "Tarif toplamını malzemelerden hesaplar ve porsiyona böler."
 *
 * Her malzeme 100g değeri + kullanılan gram taşır; toplam alınır ve tarifin
 * belirttiği porsiyon sayısına bölünür (1 porsiyonluk besin değeri çıkar).
 */
export function nutrientsForRecipe(
  ingredients: readonly WeightedNutrients[],
  servings: number,
): NutrientProfile {
  if (ingredients.length === 0) {
    throw new NutrientCalculationError('Tarifte malzeme yok');
  }

  const perIngredient = ingredients.map((ing) => nutrientsForGrams(ing.per100g, ing.grams));
  const total = sumNutrients(perIngredient);
  return divideNutrients(total, servings);
}

/**
 * Gösterim katmanı için yuvarlama — §03: "Yuvarlama yalnızca gösterim
 * katmanında yapılır." Hesap motorunun geri kalanı bu fonksiyonu HİÇ
 * çağırmaz; yalnız UI, bir değeri ekrana yazmadan hemen önce kullanır.
 */
export function roundNutrientsForDisplay(nutrients: NutrientProfile): NutrientProfile {
  const result: NutrientProfile = {
    energyKcal: Math.round(nutrients.energyKcal),
    proteinG: Math.round(nutrients.proteinG * 10) / 10,
    carbsG: Math.round(nutrients.carbsG * 10) / 10,
    fatG: Math.round(nutrients.fatG * 10) / 10,
  };

  if (nutrients.sugarG !== undefined) result.sugarG = Math.round(nutrients.sugarG * 10) / 10;
  if (nutrients.saturatedFatG !== undefined) {
    result.saturatedFatG = Math.round(nutrients.saturatedFatG * 10) / 10;
  }
  if (nutrients.fiberG !== undefined) result.fiberG = Math.round(nutrients.fiberG * 10) / 10;
  if (nutrients.sodiumMg !== undefined) result.sodiumMg = Math.round(nutrients.sodiumMg);

  return result;
}
