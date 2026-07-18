import type { CatalogFoodMatch, MealAnalysis } from '@calouch/types';
import { describe, expect, it } from 'vitest';

import { buildAiMealDraft } from './aiMealDraft';

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
