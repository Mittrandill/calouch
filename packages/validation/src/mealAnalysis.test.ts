import { describe, expect, it } from 'vitest';

import { catalogFoodMatchSchema, mealAnalysisSchema, mealDraftSchema } from './mealAnalysis';

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

describe('catalogFoodMatchSchema (regresyon)', () => {
  const validMatch = {
    // MVP-10 E2E doğrulaması sırasında ampirik olarak bulunan hata: bu id
    // `supabase/seed/catalog_starter_foods.sql`'deki gerçek bir "vanity" id
    // ile birebir aynı biçimde — RFC 4122 versiyon/varyant hanelerine
    // uymuyor (13. hane [1-8] değil, 17. hane [89ab] değil) ama geçerli bir
    // Postgres uuid'dir. `match_ai_food()` gerçek bir katalog eşleşmesi
    // döndürdüğünde bu ŞEKİL üretilir; `.uuid()` bunu reddedip her başarılı
    // eşleşmeyi `mealDraftSchema` aşamasında çökertiyordu (job invalid_response
    // ile failed oluyordu) — bkz. `.guid()`'e geçiş.
    foodId: '10000000-0000-0000-0000-000000000012',
    foodVersionId: '20000000-0000-0000-0000-000000000012',
    matchedName: 'Bulgur pilavı',
    matchedCandidate: 'Bulgur pilavı',
    matchedLocale: 'tr',
    matchScore: 1,
    source: { key: 'turkish_dishes', displayName: 'Türk yemekleri' },
    per100g: {
      energyKcal: 150, proteinG: 4.5, carbsG: 28, sugarG: null,
      fatG: 3, saturatedFatG: null, fiberG: 4, sodiumMg: 200,
    },
  };

  it('RFC 4122 versiyon/varyant biçimine uymayan gerçek katalog id\'lerini kabul eder', () => {
    const result = catalogFoodMatchSchema.safeParse(validMatch);
    expect(result.success).toBe(true);
  });

  it('mealDraftSchema, bu id biçimiyle eşleşen bir kalemi reddetmez', () => {
    const draft = {
      analysisVersion: 'meal-draft-v1',
      providerAnalysisVersion: 'meal-analysis-v1',
      mealTitle: 'Adana kebap tabağı',
      overallConfidence: 'high',
      requiresUserConfirmation: true,
      unmatchedItemCount: 0,
      items: [
        {
          candidateNames: ['Bulgur pilavı'],
          estimatedGrams: 120, minGrams: 90, maxGrams: 150,
          portionType: 'tabak', cookingMethod: 'haşlama',
          visibleIngredients: ['bulgur'], possibleHiddenIngredients: [],
          confidence: 'medium',
          catalogMatch: validMatch,
          nutrients: {
            estimated: { energyKcal: 180, proteinG: 5.4, carbsG: 33.6, sugarG: null, fatG: 3.6, saturatedFatG: null, fiberG: 4.8, sodiumMg: 240 },
            minimum: { energyKcal: 135, proteinG: 4.05, carbsG: 25.2, sugarG: null, fatG: 2.7, saturatedFatG: null, fiberG: 3.6, sodiumMg: 180 },
            maximum: { energyKcal: 225, proteinG: 6.75, carbsG: 42, sugarG: null, fatG: 4.5, saturatedFatG: null, fiberG: 6, sodiumMg: 300 },
          },
        },
      ],
      totals: null,
    };
    const result = mealDraftSchema.safeParse(draft);
    expect(result.success).toBe(true);
  });
});
