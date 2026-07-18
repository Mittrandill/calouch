// Implements: MVP-09
// PRD: §10-11 (04-ai-meal-analysis.md), §09
//
// POST /functions/v1/analyze-meal-photo
//   job oluşturur ve hemen `processing` döner. Gemini -> schema validation ->
//   katalog eşleştirme -> deterministik motor arka planda çalışır.
//
// Provider kalori/makro DÖNDÜREMEZ. Nutrient alanları yalnız
// `public.match_ai_food` RPC'sinin current catalog snapshot'ından gelir.
// Kullanıcı sonucu `ai-jobs/:id` üzerinden sorgular (MVP-10 öncesi mobil
// istemci bu endpoint'i poll eder).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

import {
  buildMealDraft,
  type CatalogMatch,
} from '../_shared/meal-draft.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const confidenceLevelSchema = z.enum(['low', 'medium', 'high']);
const mealAnalysisItemSchema = z.object({
  candidateNames: z.array(z.string().trim().min(1).max(120)).min(1).max(3),
  estimatedGrams: z.number().positive(),
  minGrams: z.number().positive(),
  maxGrams: z.number().positive(),
  portionType: z.string(),
  cookingMethod: z.string().nullable(),
  visibleIngredients: z.array(z.string()),
  possibleHiddenIngredients: z.array(z.string()),
  confidence: confidenceLevelSchema,
}).refine((item) => item.minGrams <= item.estimatedGrams && item.estimatedGrams <= item.maxGrams);

const mealAnalysisSchema = z.discriminatedUnion('isFood', [
  z.object({
    isFood: z.literal(true),
    analysisVersion: z.string(),
    mealTitle: z.string(),
    items: z.array(mealAnalysisItemSchema).min(1).max(12),
    overallConfidence: confidenceLevelSchema,
    requiresUserConfirmation: z.literal(true),
  }),
  z.object({
    isFood: z.literal(false),
    analysisVersion: z.string(),
    rejectionReason: z.string(),
  }),
]);

const nullableNutrientsSchema = z.object({
  energyKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  sugarG: z.number().nonnegative().nullable(),
  fatG: z.number().nonnegative(),
  saturatedFatG: z.number().nonnegative().nullable(),
  fiberG: z.number().nonnegative().nullable(),
  sodiumMg: z.number().nonnegative().nullable(),
});
const catalogMatchSchema = z.object({
  foodId: z.string().uuid(),
  foodVersionId: z.string().uuid(),
  matchedName: z.string(),
  matchedCandidate: z.string(),
  matchedLocale: z.enum(['tr', 'en']),
  matchScore: z.number().min(0).max(1),
  source: z.object({ key: z.string(), displayName: z.string() }),
  per100g: nullableNutrientsSchema,
});
const nutrientRangeSchema = z.object({
  estimated: nullableNutrientsSchema,
  minimum: nullableNutrientsSchema,
  maximum: nullableNutrientsSchema,
});
const mealDraftSchema = z.object({
  analysisVersion: z.literal('meal-draft-v1'),
  providerAnalysisVersion: z.string(),
  mealTitle: z.string(),
  items: z.array(mealAnalysisItemSchema.and(z.object({
    catalogMatch: catalogMatchSchema.nullable(),
    nutrients: nutrientRangeSchema.nullable(),
  }))).min(1).max(12),
  overallConfidence: confidenceLevelSchema,
  requiresUserConfirmation: z.literal(true),
  unmatchedItemCount: z.number().int().nonnegative(),
  totals: nutrientRangeSchema.nullable(),
});

const MEAL_ANALYSIS_SCHEMA_VERSION = 'meal-analysis-v1';
const GEMINI_MODEL = 'gemini-2.5-flash';
const PROVIDER_TIMEOUT_MS = 45_000;

const GEMINI_RESPONSE_SCHEMA = {
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
      maxItems: 12,
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
          'candidateNames', 'estimatedGrams', 'minGrams', 'maxGrams',
          'portionType', 'cookingMethod', 'visibleIngredients',
          'possibleHiddenIngredients', 'confidence',
        ],
      },
    },
  },
  required: ['isFood', 'analysisVersion'],
};

const PROMPT = `Bu fotoğrafı bir yemek/beslenme analiz asistanı olarak incele.

Fotoğrafta yiyecek YOKSA: isFood: false ve rejectionReason ile kısa bir açıklama döndür.

Fotoğrafta yiyecek VARSA: isFood: true ve her ayrı yemek/malzeme grubu için bir "items" kalemi döndür.
Her kalemde yalnız şu görsel tahminleri üret:
- candidateNames: en olası 1-3 isim adayı (Türkçe, en spesifikten en genele)
- estimatedGrams/minGrams/maxGrams: gerçekçi porsiyon tahmini ve makul aralık
- portionType: tabak/kase/bardak/parça gibi porsiyon türü
- cookingMethod: pişirme yöntemi, bilinmiyorsa null
- visibleIngredients ve possibleHiddenIngredients
- confidence: "low"/"medium"/"high"

Kalori, protein, karbonhidrat, yağ, lif veya başka besin değeri ÜRETME.
analysisVersion: "${MEAL_ANALYSIS_SCHEMA_VERSION}", overallConfidence ve requiresUserConfirmation: true döndür.`;

const INPUT_COST_PER_MILLION_USD = 0.075;
const OUTPUT_COST_PER_MILLION_USD = 0.3;

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION_USD +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION_USD
  );
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function okResponse(body: Record<string, unknown>): Response {
  return jsonResponse({ ok: true, ...body }, 200);
}

function errResponse(code: string, message: string, correlationId: string): Response {
  return jsonResponse({ ok: false, code, message, correlationId }, 200);
}

type UserClient = ReturnType<typeof createClient>;

async function failJob(
  supabase: UserClient,
  jobId: string,
  errorCode: string,
  errorMessage: string,
  inputTokens: number | null = null,
  outputTokens: number | null = null,
  estimatedCostUsd: number | null = null,
) {
  const { error } = await supabase.rpc('fail_ai_job_v2', {
    p_job_id: jobId,
    p_error_code: errorCode,
    p_error_message: errorMessage,
    p_model: GEMINI_MODEL,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_estimated_cost_usd: estimatedCostUsd,
  });
  if (error !== null) throw error;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error('catalog_numeric_value_invalid');
  }
  return numberValue;
}

function catalogMatchFromRow(row: Record<string, unknown>): CatalogMatch {
  const requiredNumber = (value: unknown) => {
    const numberValue = asNullableNumber(value);
    if (numberValue === null) throw new Error('catalog_required_nutrient_missing');
    return numberValue;
  };

  return {
    foodId: String(row.food_id),
    foodVersionId: String(row.food_version_id),
    matchedName: String(row.matched_name),
    matchedCandidate: String(row.matched_candidate),
    matchedLocale: row.matched_locale === 'en' ? 'en' : 'tr',
    matchScore: requiredNumber(row.match_score),
    source: { key: String(row.source_key), displayName: String(row.source_display_name) },
    per100g: {
      energyKcal: requiredNumber(row.energy_kcal),
      proteinG: requiredNumber(row.protein_g),
      carbsG: requiredNumber(row.carbs_g),
      sugarG: asNullableNumber(row.sugar_g),
      fatG: requiredNumber(row.fat_g),
      saturatedFatG: asNullableNumber(row.saturated_fat_g),
      fiberG: asNullableNumber(row.fiber_g),
      sodiumMg: asNullableNumber(row.sodium_mg),
    },
  };
}

async function matchCatalog(supabase: UserClient, candidateNames: string[]): Promise<CatalogMatch | null> {
  const { data, error } = await supabase.rpc('match_ai_food', {
    p_candidate_names: candidateNames,
    p_locale: 'tr',
  });
  if (error !== null) throw error;
  const row = data?.[0] as Record<string, unknown> | undefined;
  return row === undefined ? null : catalogMatchFromRow(row);
}

async function processJob(
  supabase: UserClient,
  jobId: string,
  storagePath: string,
  correlationId: string,
  startedAt: number,
) {
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let estimatedCostUsd: number | null = null;

  try {
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('ai-meal-photos')
      .download(storagePath);
    if (downloadError !== null || imageBlob === null) {
      await failJob(supabase, jobId, 'storage_error', 'Görsel indirilemedi');
      console.log(JSON.stringify({ correlationId, jobId, event: 'download_failed' }));
      return;
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (geminiApiKey === undefined) {
      await failJob(supabase, jobId, 'provider_not_configured', 'AI sağlayıcısı yapılandırılmamış');
      return;
    }

    const mimeType = imageBlob.type || 'image/jpeg';
    const imageBase64 = btoa(
      new Uint8Array(await imageBlob.arrayBuffer()).reduce(
        (acc, byte) => acc + String.fromCharCode(byte),
        '',
      ),
    );

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA },
        }),
      },
    );

    if (!geminiResponse.ok) {
      await failJob(supabase, jobId, 'provider_error', 'AI sağlayıcısından yanıt alınamadı');
      console.log(JSON.stringify({ correlationId, jobId, event: 'gemini_error', httpStatus: geminiResponse.status }));
      return;
    }

    const geminiJson = await geminiResponse.json();
    inputTokens = geminiJson.usageMetadata?.promptTokenCount ?? 0;
    outputTokens = geminiJson.usageMetadata?.candidatesTokenCount ?? 0;
    estimatedCostUsd = estimateCostUsd(inputTokens, outputTokens);

    const rawText: string | undefined = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsedCandidate: unknown;
    try {
      parsedCandidate = rawText === undefined ? undefined : JSON.parse(rawText);
    } catch {
      parsedCandidate = undefined;
    }

    const validation = mealAnalysisSchema.safeParse(parsedCandidate);
    if (!validation.success) {
      await failJob(
        supabase,
        jobId,
        'invalid_response',
        'AI yanıtı beklenen şemaya uymuyor',
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      );
      console.log(JSON.stringify({ correlationId, jobId, event: 'schema_validation_failed' }));
      return;
    }

    if (!validation.data.isFood) {
      await failJob(
        supabase,
        jobId,
        'not_food',
        validation.data.rejectionReason,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      );
      console.log(JSON.stringify({ correlationId, jobId, event: 'rejected_non_food' }));
      return;
    }

    const matches = await Promise.all(
      validation.data.items.map((item) => matchCatalog(supabase, item.candidateNames)),
    );
    const draft = buildMealDraft(validation.data, matches);
    const draftValidation = mealDraftSchema.safeParse(draft);
    if (!draftValidation.success) {
      await failJob(
        supabase,
        jobId,
        'invalid_response',
        'Deterministik analiz sonucu doğrulanamadı',
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      );
      console.log(JSON.stringify({ correlationId, jobId, event: 'draft_validation_failed' }));
      return;
    }

    const { error: completeError } = await supabase.rpc('complete_ai_job_v2', {
      p_job_id: jobId,
      p_raw_response: validation.data,
      p_result_response: draftValidation.data,
      p_model: GEMINI_MODEL,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_estimated_cost_usd: estimatedCostUsd,
    });
    if (completeError !== null) throw completeError;

    console.log(JSON.stringify({
      correlationId,
      jobId,
      event: 'completed',
      unmatchedItemCount: draft.unmatchedItemCount,
      latencyMs: Date.now() - startedAt,
    }));
  } catch (error) {
    console.log(JSON.stringify({ correlationId, jobId, event: 'background_error', message: String(error) }));
    try {
      await failJob(
        supabase,
        jobId,
        'processing_error',
        'Analiz tamamlanamadı',
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      );
    } catch (failError) {
      console.log(JSON.stringify({ correlationId, jobId, event: 'fail_job_error', message: String(failError) }));
    }
  } finally {
    const { error: removeError } = await supabase.storage.from('ai-meal-photos').remove([storagePath]);
    if (removeError !== null) {
      console.log(JSON.stringify({ correlationId, jobId, event: 'photo_cleanup_failed' }));
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const correlationId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed', correlationId }, 405);

    const authHeader = req.headers.get('Authorization');
    if (authHeader === null) return jsonResponse({ error: 'unauthorized', correlationId }, 401);

    const requestBody = await req.json();
    const requestValidation = z.object({
      operationId: z.string().uuid(),
      storagePath: z.string().min(1).max(300),
    }).safeParse(requestBody);
    if (!requestValidation.success) return jsonResponse({ error: 'invalid_request', correlationId }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: jobRows, error: jobError } = await supabase.rpc('create_ai_job', {
      p_operation_id: requestValidation.data.operationId,
      p_storage_path: requestValidation.data.storagePath,
    });
    if (jobError !== null) {
      const code = jobError.code === '55000' ? 'kill_switch' : jobError.code === '55001' ? 'rate_limited' : 'job_error';
      return errResponse(code, jobError.message, correlationId);
    }

    const job = jobRows?.[0];
    if (job === undefined) return errResponse('job_creation_failed', 'Job oluşturulamadı', correlationId);

    if (!job.is_new) {
      const { data: existingRows, error: getError } = await supabase.rpc('get_ai_job', { p_job_id: job.job_id });
      if (getError !== null || existingRows?.[0] === undefined) {
        return errResponse('job_error', 'Job durumu okunamadı', correlationId);
      }
      const existing = existingRows[0];
      return okResponse({
        jobId: existing.job_id,
        status: existing.status,
        result: existing.result_response,
        errorCode: existing.error_code,
        errorMessage: existing.error_message,
        correlationId: existing.correlation_id,
      });
    }

    console.log(JSON.stringify({ correlationId, jobId: job.job_id, event: 'job_queued' }));
    EdgeRuntime.waitUntil(processJob(
      supabase,
      job.job_id,
      requestValidation.data.storagePath,
      correlationId,
      startedAt,
    ));

    return okResponse({ jobId: job.job_id, status: 'processing', result: null, correlationId });
  } catch (error) {
    console.log(JSON.stringify({ correlationId, event: 'request_error', message: String(error) }));
    return jsonResponse({ error: 'internal_error', correlationId }, 500);
  }
});
