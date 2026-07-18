import type {
  AIJob,
  CatalogFoodMatch,
  CatalogNutrientSnapshot,
  MealAnalysis,
  MealAnalysisItem,
  MealDraft,
  MealDraftItem,
  NutrientEstimateRange,
} from '@calouch/types';
import { z } from 'zod';

/**
 * Gemini yanıtının çalışma zamanı doğrulaması. §04 "Şema dışı yanıt son
 * kullanıcıya gösterilmez" kabul kriterinin taşıyıcısı budur.
 *
 * `packages/types/src/ai.ts`'teki düz TS tipleriyle `satisfies` üzerinden
 * eşleştirilir — biri değişip diğeri unutulursa derleme burada patlar.
 */

export const confidenceLevelSchema = z.enum(['low', 'medium', 'high']);

export const mealAnalysisItemSchema = z.object({
  candidateNames: z.array(z.string().trim().min(1).max(120)).min(1).max(3),
  estimatedGrams: z.number().positive(),
  minGrams: z.number().positive(),
  maxGrams: z.number().positive(),
  portionType: z.string(),
  cookingMethod: z.string().nullable(),
  visibleIngredients: z.array(z.string()),
  possibleHiddenIngredients: z.array(z.string()),
  confidence: confidenceLevelSchema,
}).refine((item) => item.minGrams <= item.estimatedGrams && item.estimatedGrams <= item.maxGrams, {
  message: 'Gram aralığı min <= estimated <= max olmalı',
}) satisfies z.ZodType<MealAnalysisItem>;

const mealAnalysisFoodSchema = z.object({
  isFood: z.literal(true),
  analysisVersion: z.string(),
  mealTitle: z.string(),
  items: z.array(mealAnalysisItemSchema).min(1).max(12),
  overallConfidence: confidenceLevelSchema,
  requiresUserConfirmation: z.literal(true),
});

const mealAnalysisRejectedSchema = z.object({
  isFood: z.literal(false),
  analysisVersion: z.string(),
  rejectionReason: z.string(),
});

export const mealAnalysisSchema = z.discriminatedUnion('isFood', [
  mealAnalysisFoodSchema,
  mealAnalysisRejectedSchema,
]) satisfies z.ZodType<MealAnalysis>;

/**
 * §04 "analysisVersion ... kaydedilir" — motorun kendisi değil ama şemanın
 * hangi sürümden geçtiğini işaretler. `nutrition-engine`'deki
 * `GOAL_FORMULA_VERSION` deseniyle aynı gerekçe: şema genişlerse eski
 * job'lar hangi sürümle doğrulandığını kaybetmez.
 */
export const MEAL_ANALYSIS_SCHEMA_VERSION = 'meal-analysis-v1';
export const MEAL_DRAFT_SCHEMA_VERSION = 'meal-draft-v1' as const;

export const catalogNutrientSnapshotSchema = z.object({
  energyKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  sugarG: z.number().nonnegative().nullable(),
  fatG: z.number().nonnegative(),
  saturatedFatG: z.number().nonnegative().nullable(),
  fiberG: z.number().nonnegative().nullable(),
  sodiumMg: z.number().nonnegative().nullable(),
}) satisfies z.ZodType<CatalogNutrientSnapshot>;

export const catalogFoodMatchSchema = z.object({
  foodId: z.string().uuid(),
  foodVersionId: z.string().uuid(),
  matchedName: z.string().min(1),
  matchedCandidate: z.string().min(1),
  matchedLocale: z.enum(['tr', 'en']),
  matchScore: z.number().min(0).max(1),
  source: z.object({ key: z.string().min(1), displayName: z.string().min(1) }),
  per100g: catalogNutrientSnapshotSchema,
}) satisfies z.ZodType<CatalogFoodMatch>;

export const nutrientEstimateRangeSchema = z.object({
  estimated: catalogNutrientSnapshotSchema,
  minimum: catalogNutrientSnapshotSchema,
  maximum: catalogNutrientSnapshotSchema,
}) satisfies z.ZodType<NutrientEstimateRange>;

export const mealDraftItemSchema = mealAnalysisItemSchema.and(
  z.object({
    catalogMatch: catalogFoodMatchSchema.nullable(),
    nutrients: nutrientEstimateRangeSchema.nullable(),
  }),
) satisfies z.ZodType<MealDraftItem>;

export const mealDraftSchema = z.object({
  analysisVersion: z.literal(MEAL_DRAFT_SCHEMA_VERSION),
  providerAnalysisVersion: z.string().min(1),
  mealTitle: z.string().min(1),
  items: z.array(mealDraftItemSchema).min(1).max(12),
  overallConfidence: confidenceLevelSchema,
  requiresUserConfirmation: z.literal(true),
  unmatchedItemCount: z.number().int().min(0),
  totals: nutrientEstimateRangeSchema.nullable(),
}) satisfies z.ZodType<MealDraft>;

export const aiJobStatusSchema = z.enum([
  'created',
  'processing',
  'needs_confirmation',
  'failed',
  'expired',
]);

export const aiJobSchema = z.object({
  jobId: z.string().uuid(),
  status: aiJobStatusSchema,
  result: mealDraftSchema.nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  correlationId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<AIJob>;

/**
 * Gemini'ye `generationConfig.responseSchema` olarak verilen OpenAPI alt
 * kümesi — modelin çıktısını doğrudan bu şekle zorlar. Zod doğrulaması
 * (yukarıdaki) yine de çalışır (defense-in-depth: model şemayı görmezden
 * gelebilir/hatalı sürüm çalıştırılabilir).
 *
 * Edge Function (Deno, ayrı deploy birimi) bu objenin BİREBİR kopyasını
 * taşır — bkz. supabase/functions/analyze-meal-photo/index.ts üstündeki
 * senkronizasyon notu.
 */
export const MEAL_ANALYSIS_GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean' },
    analysisVersion: { type: 'string' },
    mealTitle: { type: 'string' },
    rejectionReason: { type: 'string' },
    overallConfidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    requiresUserConfirmation: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          candidateNames: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
          estimatedGrams: { type: 'number' },
          minGrams: { type: 'number' },
          maxGrams: { type: 'number' },
          portionType: { type: 'string' },
          cookingMethod: { type: 'string', nullable: true },
          visibleIngredients: { type: 'array', items: { type: 'string' } },
          possibleHiddenIngredients: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: [
          'candidateNames',
          'estimatedGrams',
          'minGrams',
          'maxGrams',
          'portionType',
          'cookingMethod',
          'visibleIngredients',
          'possibleHiddenIngredients',
          'confidence',
        ],
      },
      maxItems: 12,
    },
  },
  required: ['isFood', 'analysisVersion'],
} as const;
