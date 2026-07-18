import type { CatalogFoodMatch, CatalogNutrientSnapshot, MealAnalysis } from '@calouch/types';
import { describe, expect, it } from 'vitest';

import { buildAiMealDraft, scaleCatalogNutrients, sumCatalogNutrients } from './aiMealDraft';

const rawAnalysis = {
  isFood: true,
  analysisVersion: 'meal-analysis-v1',
  mealTitle: 'Kuru fasulye ve pilav',
  items: [
    {
      candidateNames: ['Kuru fasulye'], estimatedGrams: 150, minGrams: 100, maxGrams: 200,
      portionType: 'tabak', cookingMethod: 'haşlama', visibleIngredients: ['fasulye'],
      possibleHiddenIngredients: ['yağ'], confidence: 'high',
    },
    {
      candidateNames: ['Pirinç pilavı'], estimatedGrams: 100, minGrams: 80, maxGrams: 120,
      portionType: 'tabak', cookingMethod: null, visibleIngredients: ['pirinç'],
      possibleHiddenIngredients: [], confidence: 'medium',
    },
  ],
  overallConfidence: 'medium',
  requiresUserConfirmation: true,
} satisfies MealAnalysis;

function match(overrides: Partial<CatalogFoodMatch> = {}): CatalogFoodMatch {
  return {
    foodId: '11111111-1111-4111-8111-111111111111',
    foodVersionId: '22222222-2222-4222-8222-222222222222',
    matchedName: 'Kuru fasulye', matchedCandidate: 'Kuru fasulye', matchedLocale: 'tr',
    matchScore: 1,
    source: { key: 'turkish_dishes', displayName: 'Türk yemekleri' },
    per100g: {
      energyKcal: 100, proteinG: 10, carbsG: 20, sugarG: 2, fatG: 4,
      saturatedFatG: null, fiberG: 5, sodiumMg: 50,
    },
    ...overrides,
  };
}

describe('buildAiMealDraft', () => {
  it('kalori ve makroları yalnız katalogdaki 100 g snapshotından hesaplar', () => {
    const draft = buildAiMealDraft(rawAnalysis, [match(), match()]);
    expect(draft.items[0]?.nutrients?.estimated.energyKcal).toBe(150);
    expect(draft.items[0]?.nutrients?.minimum.proteinG).toBe(10);
    expect(draft.items[0]?.nutrients?.maximum.carbsG).toBe(40);
    expect(draft.totals?.estimated).toMatchObject({
      energyKcal: 250, proteinG: 25, carbsG: 50, fatG: 10,
    });
  });

  it('bilinmeyen opsiyonel nutrientı sıfıra dönüştürmez', () => {
    const second = match({ per100g: { ...match().per100g, fiberG: null } });
    const draft = buildAiMealDraft(rawAnalysis, [match(), second]);
    expect(draft.totals?.estimated.fiberG).toBeNull();
    expect(draft.totals?.estimated.sugarG).toBe(5);
  });

  it('bir kalem eşleşmezse eksik toplam sunmaz', () => {
    const draft = buildAiMealDraft(rawAnalysis, [match(), null]);
    expect(draft.unmatchedItemCount).toBe(1);
    expect(draft.items[1]?.nutrients).toBeNull();
    expect(draft.totals).toBeNull();
  });

  it('kalem ve eşleşme sayısı farklıysa açıkça reddeder', () => {
    expect(() => buildAiMealDraft(rawAnalysis, [match()])).toThrow(/Her analiz kalemi/);
  });
});

describe('scaleCatalogNutrients', () => {
  const per100g: CatalogNutrientSnapshot = {
    energyKcal: 100, proteinG: 10, carbsG: 20, sugarG: 2, fatG: 4,
    saturatedFatG: null, fiberG: 5, sodiumMg: 50,
  };

  it('grama orantılı ölçekler', () => {
    const result = scaleCatalogNutrients(per100g, 150);
    expect(result).toMatchObject({ energyKcal: 150, proteinG: 15, carbsG: 30, fatG: 6, fiberG: 7.5 });
  });

  it('null opsiyonel alanı sıfıra çevirmez', () => {
    expect(scaleCatalogNutrients(per100g, 150).saturatedFatG).toBeNull();
  });
});

describe('sumCatalogNutrients', () => {
  it('zorunlu alanları her zaman toplar', () => {
    const sum = sumCatalogNutrients([
      { energyKcal: 100, proteinG: 10, carbsG: 20, sugarG: 2, fatG: 4, saturatedFatG: 1, fiberG: 5, sodiumMg: 50 },
      { energyKcal: 50, proteinG: 5, carbsG: 10, sugarG: 1, fatG: 2, saturatedFatG: 0.5, fiberG: 2, sodiumMg: 25 },
    ]);
    expect(sum).toMatchObject({ energyKcal: 150, proteinG: 15, carbsG: 30, fatG: 6 });
  });

  it('bir kalemde eksik opsiyonel alan varsa toplamı sessizce sıfırlamaz, null bırakır', () => {
    const sum = sumCatalogNutrients([
      { energyKcal: 100, proteinG: 10, carbsG: 20, sugarG: 2, fatG: 4, saturatedFatG: null, fiberG: 5, sodiumMg: 50 },
      { energyKcal: 50, proteinG: 5, carbsG: 10, sugarG: 1, fatG: 2, saturatedFatG: 0.5, fiberG: null, sodiumMg: 25 },
    ]);
    expect(sum.saturatedFatG).toBeNull();
    expect(sum.fiberG).toBeNull();
    expect(sum.sugarG).toBe(3);
  });
});
