import { describe, expect, it } from 'vitest';

import {
  divideNutrients,
  nutrientsForGrams,
  nutrientsForRecipe,
  NutrientCalculationError,
  roundNutrientsForDisplay,
  sumNutrients,
} from './nutrients';
import type { NutrientProfile } from './types';

/** Tavuk göğsü (ızgara), seed verisiyle birebir aynı. */
const chicken100g: NutrientProfile = {
  energyKcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  saturatedFatG: 1.0,
  sodiumMg: 74,
};

/** Muz — sodyum verisi VAR ama şeker VAR, doymuş yağ YOK (0 değil, bilinmiyor). */
const banana100g: NutrientProfile = {
  energyKcal: 89,
  proteinG: 1.1,
  carbsG: 23,
  sugarG: 12,
  fatG: 0.3,
  fiberG: 2.6,
  sodiumMg: 1,
};

describe('nutrientsForGrams', () => {
  it('150 g tavuk göğsü: 100g değerinin 1.5 katı', () => {
    const result = nutrientsForGrams(chicken100g, 150);
    expect(result.energyKcal).toBeCloseTo(247.5, 5);
    expect(result.proteinG).toBeCloseTo(46.5, 5);
    expect(result.sodiumMg).toBeCloseTo(111, 5);
  });

  it('50 g: yarıya böler', () => {
    const result = nutrientsForGrams(chicken100g, 50);
    expect(result.energyKcal).toBeCloseTo(82.5, 5);
  });

  it('0 g: tüm değerler sıfır', () => {
    const result = nutrientsForGrams(chicken100g, 0);
    expect(result.energyKcal).toBe(0);
    expect(result.proteinG).toBe(0);
  });

  it('opsiyonel alan kaynakta yoksa sonuçta da yok (sıfır değil)', () => {
    // chicken100g'de fiberG hiç tanımlı değil.
    const result = nutrientsForGrams(chicken100g, 150);
    expect(result.fiberG).toBeUndefined();
  });

  it('negatif gram reddedilir', () => {
    expect(() => nutrientsForGrams(chicken100g, -10)).toThrow(NutrientCalculationError);
  });

  it('NaN gram reddedilir', () => {
    expect(() => nutrientsForGrams(chicken100g, Number.NaN)).toThrow(NutrientCalculationError);
  });
});

describe('sumNutrients — zorunlu alanlar', () => {
  it('iki kalemin zorunlu alanlarını toplar', () => {
    const item1 = nutrientsForGrams(chicken100g, 150); // 247.5 kcal
    const item2 = nutrientsForGrams(banana100g, 118); // 105.02 kcal
    const total = sumNutrients([item1, item2]);

    expect(total.energyKcal).toBeCloseTo(247.5 + 89 * 1.18, 5);
    expect(total.proteinG).toBeCloseTo(46.5 + 1.1 * 1.18, 5);
  });

  it('boş liste reddedilir', () => {
    expect(() => sumNutrients([])).toThrow(NutrientCalculationError);
  });
});

/**
 * §03 kabul kriteri, dolaylı olarak: "Eksik nutrient değerini sıfırmış
 * gibi sessizce sunmaz." Bu grup o kuralın doğrudan testidir.
 */
describe('sumNutrients — eksik veri sessizce sıfırlanmaz', () => {
  it('tüm kalemlerde bir alan varsa toplanır', () => {
    // İkisinde de sodyum var.
    const total = sumNutrients([chicken100g, banana100g]);
    expect(total.sodiumMg).toBe(75); // 74 + 1
  });

  it('bir kalemde eksik olan alan TOPLAMDA undefined olur, 0 değil', () => {
    // chicken100g'de fiberG yok, banana100g'de var.
    const total = sumNutrients([chicken100g, banana100g]);
    expect(total.fiberG).toBeUndefined();
  });

  it('yanlışlıkla "kısmi toplamı tam gibi" sunmaz', () => {
    // Eğer eksik alan sessizce 0 sayılsaydı, doymuş yağ toplamı
    // sadece chicken'ın 1.0'ı olurdu (banana'nın saturatedFatG'si yok).
    // Doğrusu: toplam bilinmez, sayı üretilmez.
    const total = sumNutrients([chicken100g, banana100g]);
    expect(total.saturatedFatG).toBeUndefined();
  });

  it('hiçbir kalemde alan yoksa yine undefined', () => {
    const noSugar: NutrientProfile = { energyKcal: 10, proteinG: 1, carbsG: 1, fatG: 1 };
    const total = sumNutrients([noSugar, noSugar]);
    expect(total.sugarG).toBeUndefined();
  });

  it('zorunlu alanlar her koşulda toplanır (opsiyonel eksikliğinden etkilenmez)', () => {
    const total = sumNutrients([chicken100g, banana100g]);
    expect(total.energyKcal).toBeCloseTo(165 + 89, 5);
  });
});

describe('divideNutrients', () => {
  it('4 porsiyona böler', () => {
    const total: NutrientProfile = { energyKcal: 800, proteinG: 40, carbsG: 100, fatG: 20, fiberG: 8 };
    const perServing = divideNutrients(total, 4);
    expect(perServing.energyKcal).toBe(200);
    expect(perServing.fiberG).toBe(2);
  });

  it('sıfır veya negatif bölen reddedilir', () => {
    const total: NutrientProfile = { energyKcal: 100, proteinG: 1, carbsG: 1, fatG: 1 };
    expect(() => divideNutrients(total, 0)).toThrow(NutrientCalculationError);
    expect(() => divideNutrients(total, -2)).toThrow(NutrientCalculationError);
  });
});

/** §03: "Tarif toplamını malzemelerden hesaplar ve porsiyona böler." */
describe('nutrientsForRecipe', () => {
  it('iki malzemeli, 4 porsiyonluk tarif', () => {
    // 300g tavuk + 300g pirinç, 4 porsiyona bölünür.
    const rice100g: NutrientProfile = { energyKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 };

    const result = nutrientsForRecipe(
      [
        { per100g: chicken100g, grams: 300 },
        { per100g: rice100g, grams: 300 },
      ],
      4,
    );

    // Toplam: 3*165 + 3*130 = 495+390=885 kcal; 4'e bölünce 221.25
    expect(result.energyKcal).toBeCloseTo(221.25, 5);
  });

  it('malzemesiz tarif reddedilir', () => {
    expect(() => nutrientsForRecipe([], 4)).toThrow(NutrientCalculationError);
  });

  it('ardışık hesapta ara yuvarlama yapılmaz (hassasiyet korunur)', () => {
    // Üç malzemeli, bölmesi tam sayı çıkmayan bir tarif: ara adımda
    // yuvarlama olsaydı sonuç burada hesapladığımızdan sapardı.
    const oneGram: NutrientProfile = { energyKcal: 1, proteinG: 1, carbsG: 1, fatG: 1 };
    const result = nutrientsForRecipe(
      [
        { per100g: oneGram, grams: 100 },
        { per100g: oneGram, grams: 100 },
        { per100g: oneGram, grams: 100 },
      ],
      7,
    );
    // (1+1+1)/7 = 0.42857142857...
    expect(result.energyKcal).toBeCloseTo(3 / 7, 10);
  });
});

describe('roundNutrientsForDisplay', () => {
  it('kaloriyi tam sayıya, gramları 1 ondalığa yuvarlar', () => {
    const raw: NutrientProfile = {
      energyKcal: 221.25489,
      proteinG: 33.2731,
      carbsG: 30.87,
      fatG: 4.14,
      sodiumMg: 111.6,
    };
    const rounded = roundNutrientsForDisplay(raw);
    expect(rounded.energyKcal).toBe(221);
    expect(rounded.proteinG).toBe(33.3);
    expect(rounded.sodiumMg).toBe(112);
  });

  it('tanımsız opsiyonel alanı tanımsız bırakır (0 yapmaz)', () => {
    const raw: NutrientProfile = { energyKcal: 100, proteinG: 10, carbsG: 10, fatG: 5 };
    const rounded = roundNutrientsForDisplay(raw);
    expect(rounded.fiberG).toBeUndefined();
    expect(rounded.sodiumMg).toBeUndefined();
  });

  it('motor hesabı yuvarlama olmadan tam hassasiyette kalır', () => {
    // roundNutrientsForDisplay çağrılmadığı sürece ara sonuçlar tam kalır.
    const result = nutrientsForGrams(chicken100g, 33);
    expect(result.energyKcal).toBe(165 * 0.33);
    expect(Number.isInteger(result.energyKcal)).toBe(false);
  });
});
