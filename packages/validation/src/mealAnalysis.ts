import type { MealAnalysis, MealAnalysisItem } from '@calouch/types';
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
  candidateNames: z.array(z.string()).min(1),
  estimatedGrams: z.number().positive(),
  minGrams: z.number().positive(),
  maxGrams: z.number().positive(),
  portionType: z.string(),
  cookingMethod: z.string().nullable(),
  visibleIngredients: z.array(z.string()),
  possibleHiddenIngredients: z.array(z.string()),
  confidence: confidenceLevelSchema,
}) satisfies z.ZodType<MealAnalysisItem>;

const mealAnalysisFoodSchema = z.object({
  isFood: z.literal(true),
  analysisVersion: z.string(),
  mealTitle: z.string(),
  items: z.array(mealAnalysisItemSchema).min(1),
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
          candidateNames: { type: 'array', items: { type: 'string' } },
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
    },
  },
  required: ['isFood', 'analysisVersion'],
} as const;
