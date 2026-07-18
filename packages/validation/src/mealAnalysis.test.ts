import { describe, expect, it } from 'vitest';

import { mealAnalysisSchema } from './mealAnalysis';

const validFood = {
  isFood: true,
  analysisVersion: 'meal-analysis-v1',
  mealTitle: 'Tavuklu salata',
  overallConfidence: 'medium',
  requiresUserConfirmation: true,
  items: [
    {
      candidateNames: ['ızgara tavuk göğsü', 'tavuk fileto'],
      estimatedGrams: 150,
      minGrams: 100,
      maxGrams: 200,
      portionType: 'plate',
      cookingMethod: 'grilled',
      visibleIngredients: ['tavuk', 'marul', 'domates'],
      possibleHiddenIngredients: ['zeytinyağı'],
      confidence: 'medium',
    },
  ],
};

const validRejection = {
  isFood: false,
  analysisVersion: 'meal-analysis-v1',
  rejectionReason: 'Fotoğrafta yemek tespit edilemedi',
};

describe('mealAnalysisSchema', () => {
  it('geçerli bir yemek analizini kabul eder', () => {
    const result = mealAnalysisSchema.safeParse(validFood);
    expect(result.success).toBe(true);
  });

  it('geçerli bir "yemek değil" reddini kabul eder', () => {
    const result = mealAnalysisSchema.safeParse(validRejection);
    expect(result.success).toBe(true);
  });

  it('boş items dizisini reddeder (§04: en az bir kalem)', () => {
    const result = mealAnalysisSchema.safeParse({ ...validFood, items: [] });
    expect(result.success).toBe(false);
  });

  it('geçersiz confidence enum değerini reddeder', () => {
    const result = mealAnalysisSchema.safeParse({
      ...validFood,
      items: [{ ...validFood.items[0], confidence: 'very-high' }],
    });
    expect(result.success).toBe(false);
  });

  it('requiresUserConfirmation: false değerini reddeder (değişmez kural)', () => {
    const result = mealAnalysisSchema.safeParse({ ...validFood, requiresUserConfirmation: false });
    expect(result.success).toBe(false);
  });

  it('eksik zorunlu alanı reddeder', () => {
    const { mealTitle: _mealTitle, ...withoutTitle } = validFood;
    const result = mealAnalysisSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });

  it('negatif gram değerini reddeder', () => {
    const result = mealAnalysisSchema.safeParse({
      ...validFood,
      items: [{ ...validFood.items[0], estimatedGrams: -10 }],
    });
    expect(result.success).toBe(false);
  });

  it('isFood dışında bilinmeyen bir birleşim dalını reddeder', () => {
    const result = mealAnalysisSchema.safeParse({ isFood: 'maybe', analysisVersion: 'v1' });
    expect(result.success).toBe(false);
  });
});
