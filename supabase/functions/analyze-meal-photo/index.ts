// Implements: MVP-08
// PRD: §10-11 (04-ai-meal-analysis.md), §09
//
// Fotoğraf → Gemini → doğrulanmış HAM aday listesi. Katalog eşleştirme ve
// kalori/makro hesabı BU FONKSİYONDA YOK (MVP-09'un işi).
//
// GÜVENLİK: bu fonksiyon servis rolü ANAHTARI KULLANMAZ. `verify_jwt: true`
// (deploy parametresi) + kullanıcının kendi JWT'siyle oluşturulan
// Supabase client — storage indirme/silme ve `create_ai_job`/
// `complete_ai_job`/`fail_ai_job` RPC'leri kullanıcının kendi RLS/SECURITY
// DEFINER auth.uid() kontrolüyle çalışır (bkz. migration
// 20260717175427_ai_jobs.sql üstündeki mimari not). Yalnız GEMINI_API_KEY
// sunucu secret'ıdır (§04 "Gemini key yalnızca server secret store'da").
//
// LOG DİSİPLİNİ (§09): yalnız correlation_id/job_id/durum/gecikme loglanır.
// Görsel, prompt metni ve Gemini'nin tam yanıtı ASLA console.log'a girmez.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

// ---------------------------------------------------------------------------
// Zod şeması — packages/validation/src/mealAnalysis.ts ile BİREBİR SENKRON
// tutulur (Deno ayrı bir deploy birimi, pnpm workspace'ten gerçek bundling
// yok). Biri değişirse diğeri elle güncellenir.
// ---------------------------------------------------------------------------
const confidenceLevelSchema = z.enum(['low', 'medium', 'high']);

const mealAnalysisItemSchema = z.object({
  candidateNames: z.array(z.string()).min(1),
  estimatedGrams: z.number().positive(),
  minGrams: z.number().positive(),
  maxGrams: z.number().positive(),
  portionType: z.string(),
  cookingMethod: z.string().nullable(),
  visibleIngredients: z.array(z.string()),
  possibleHiddenIngredients: z.array(z.string()),
  confidence: confidenceLevelSchema,
});

const mealAnalysisSchema = z.discriminatedUnion('isFood', [
  z.object({
    isFood: z.literal(true),
    analysisVersion: z.string(),
    mealTitle: z.string(),
    items: z.array(mealAnalysisItemSchema).min(1),
    overallConfidence: confidenceLevelSchema,
    requiresUserConfirmation: z.literal(true),
  }),
  z.object({
    isFood: z.literal(false),
    analysisVersion: z.string(),
    rejectionReason: z.string(),
  }),
]);

const MEAL_ANALYSIS_SCHEMA_VERSION = 'meal-analysis-v1';
const GEMINI_MODEL = 'gemini-2.5-flash';

// packages/validation/src/mealAnalysis.ts MEAL_ANALYSIS_GEMINI_RESPONSE_SCHEMA
// ile senkron.
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
};

const PROMPT = `Bu fotoğrafı bir yemek/beslenme analiz asistanı olarak incele.

Fotoğrafta yiyecek YOKSA: isFood: false ve rejectionReason ile kısa bir açıklama döndür.

Fotoğrafta yiyecek VARSA: isFood: true ve her ayrı yemek/malzeme grubu için bir "items" kalemi döndür.
Her kalemde:
- candidateNames: en olası 1-3 isim adayı (Türkçe, en spesifikten en genele)
- estimatedGrams/minGrams/maxGrams: gerçekçi bir porsiyon tahmini ve makul aralık
- portionType: tabak/kase/bardak/parça gibi porsiyon türü
- cookingMethod: pişirme yöntemi (ızgara, kızartma, haşlama, çiğ, vb.) bilinmiyorsa null
- visibleIngredients: görünen malzemeler
- possibleHiddenIngredients: muhtemel ama görünmeyen malzemeler (yağ, sos, tuz vb.)
- confidence: "low"/"medium"/"high"

Genel analysisVersion: "${MEAL_ANALYSIS_SCHEMA_VERSION}", overallConfidence ve requiresUserConfirmation: true de döndür.
Kesin dil kullanma — bu bir tahmindir, kullanıcı onaylayacaktır.`;

// §04 "Kota ve maliyet" — gemini-2.5-flash için yaklaşık yayınlanmış
// birim fiyat (bu yazının tarihinde). Gerçek billing sistemi (MVP-14/15)
// gelince güncellenmeli/kaldırılmalı — bkz. 14-open-decisions.md.
const INPUT_COST_PER_MILLION_USD = 0.075;
const OUTPUT_COST_PER_MILLION_USD = 0.3;

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION_USD +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION_USD
  );
}

// Native (iOS/Android) fetch CORS'a tabi değildir, ama Expo web (react-native-web,
// §01'de ikincil ama gerçek bir hedef) bir tarayıcıdır — CORS başlıkları
// olmadan preflight/asıl istek engellenir.
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

/**
 * İş mantığı sonuçları (kill switch, rate limit, provider hatası, geçersiz
 * yanıt, "yemek değil") hepsi HTTP 200 ile döner — `supabase-js`
 * `functions.invoke()` non-2xx durumda `data`'yı null bırakıp hatayı
 * `FunctionsHttpError.context` (ham Response) içine gizliyor, bu da
 * istemci tarafında gereksiz bir unwrap adımı gerektirirdi. Yalnız
 * GERÇEKTEN beklenmeyen durumlar (400/401/405/500) non-2xx kalır —
 * istemci bunları genel bir hata mesajıyla karşılar.
 */
function okResponse(body: Record<string, unknown>): Response {
  return jsonResponse({ ok: true, ...body }, 200);
}

function errResponse(code: string, message: string, correlationId: string, extra?: Record<string, unknown>): Response {
  return jsonResponse({ ok: false, code, message, correlationId, ...extra }, 200);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const correlationId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed', correlationId }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader === null) {
      return jsonResponse({ error: 'unauthorized', correlationId }, 401);
    }

    const { operationId, storagePath } = await req.json();
    if (typeof operationId !== 'string' || typeof storagePath !== 'string') {
      return jsonResponse({ error: 'invalid_request', correlationId }, 400);
    }

    // Kullanıcının KENDİ JWT'siyle client — servis rolü YOK (bkz. dosya üstü not).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: jobRows, error: jobError } = await supabase.rpc('create_ai_job', {
      p_operation_id: operationId,
      p_storage_path: storagePath,
    });

    if (jobError !== null) {
      console.log(
        JSON.stringify({ correlationId, event: 'create_ai_job_failed', code: jobError.code }),
      );
      const code =
        jobError.code === '55000' ? 'kill_switch' : jobError.code === '55001' ? 'rate_limited' : 'job_error';
      return errResponse(code, jobError.message, correlationId);
    }

    const job = jobRows?.[0];
    if (job === undefined) {
      return errResponse('job_creation_failed', 'Job oluşturulamadı', correlationId);
    }

    // İDEMPOTENCY: bu operation_id daha önce işlendiyse Gemini'ye TEKRAR
    // gitmeden mevcut sonucu döneriz. Orijinal iş başarısız olduysa (tam
    // hata mesajı create_ai_job'ın dönüşünde YOK, yalnız durum var) genel
    // bir mesajla errResponse döner — kullanıcı yeni bir fotoğrafla tekrar
    // dener.
    if (!job.is_new) {
      console.log(
        JSON.stringify({ correlationId, jobId: job.job_id, event: 'idempotent_replay' }),
      );
      if (job.status === 'failed') {
        return errResponse(
          'previously_failed',
          'Bu istek daha önce başarısız oldu, yeni bir fotoğrafla tekrar dene',
          correlationId,
          { jobId: job.job_id },
        );
      }
      return okResponse({ jobId: job.job_id, status: job.status, result: job.raw_response, correlationId });
    }

    console.log(JSON.stringify({ correlationId, jobId: job.job_id, event: 'job_created' }));

    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('ai-meal-photos')
      .download(storagePath);

    if (downloadError !== null || imageBlob === null) {
      await supabase.rpc('fail_ai_job', {
        p_job_id: job.job_id,
        p_error_message: 'storage_download_failed',
        p_model: GEMINI_MODEL,
        p_input_tokens: null,
        p_output_tokens: null,
        p_estimated_cost_usd: null,
      });
      console.log(JSON.stringify({ correlationId, jobId: job.job_id, event: 'download_failed' }));
      return errResponse('storage_error', 'Görsel indirilemedi', correlationId, { jobId: job.job_id });
    }

    const mimeType = imageBlob.type || 'image/jpeg';
    const imageBase64 = btoa(
      new Uint8Array(await imageBlob.arrayBuffer()).reduce(
        (acc, byte) => acc + String.fromCharCode(byte),
        '',
      ),
    );

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (geminiApiKey === undefined) {
      await supabase.rpc('fail_ai_job', {
        p_job_id: job.job_id,
        p_error_message: 'provider_not_configured',
        p_model: GEMINI_MODEL,
        p_input_tokens: null,
        p_output_tokens: null,
        p_estimated_cost_usd: null,
      });
      return errResponse('provider_not_configured', 'AI sağlayıcısı yapılandırılmamış', correlationId, {
        jobId: job.job_id,
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: GEMINI_RESPONSE_SCHEMA,
          },
        }),
      },
    );

    // Görsel storage'dan burada silinir — §04/§09 varsayılan: saklama
    // tercihi yoksa görsel süre sonunda silinir (bu dilimde saklama tercihi
    // UI'ı yok, yani varsayılan HER ZAMAN geçerli).
    await supabase.storage.from('ai-meal-photos').remove([storagePath]);

    if (!geminiResponse.ok) {
      console.log(
        JSON.stringify({ correlationId, jobId: job.job_id, event: 'gemini_error', httpStatus: geminiResponse.status }),
      );
      await supabase.rpc('fail_ai_job', {
        p_job_id: job.job_id,
        p_error_message: 'provider_error',
        p_model: GEMINI_MODEL,
        p_input_tokens: null,
        p_output_tokens: null,
        p_estimated_cost_usd: null,
      });
      return errResponse('provider_error', 'AI sağlayıcısından yanıt alınamadı', correlationId, {
        jobId: job.job_id,
      });
    }

    const geminiJson = await geminiResponse.json();
    const inputTokens: number = geminiJson.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens: number = geminiJson.usageMetadata?.candidatesTokenCount ?? 0;
    const estimatedCostUsd = estimateCostUsd(inputTokens, outputTokens);

    const rawText: string | undefined = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsedCandidate: unknown;
    try {
      parsedCandidate = rawText === undefined ? undefined : JSON.parse(rawText);
    } catch {
      parsedCandidate = undefined;
    }

    const validation = mealAnalysisSchema.safeParse(parsedCandidate);

    if (!validation.success) {
      console.log(
        JSON.stringify({ correlationId, jobId: job.job_id, event: 'schema_validation_failed' }),
      );
      await supabase.rpc('fail_ai_job', {
        p_job_id: job.job_id,
        p_error_message: 'invalid_provider_response',
        p_model: GEMINI_MODEL,
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        p_estimated_cost_usd: estimatedCostUsd,
      });
      return errResponse('invalid_response', 'AI yanıtı beklenen şemaya uymuyor', correlationId, {
        jobId: job.job_id,
      });
    }

    // §04 "Yemek olmayan fotoğraf açıkça reddedilir" — doğrulama geçti ama
    // model "bu yemek değil" dedi. Bu da bir "failed" durumudur (kullanıcı
    // onaylayacağı bir aday listesi yok), ama kullanıcıya gösterilecek
    // net bir sebep taşır.
    if (!validation.data.isFood) {
      await supabase.rpc('fail_ai_job', {
        p_job_id: job.job_id,
        p_error_message: validation.data.rejectionReason,
        p_model: GEMINI_MODEL,
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        p_estimated_cost_usd: estimatedCostUsd,
      });
      console.log(JSON.stringify({ correlationId, jobId: job.job_id, event: 'rejected_non_food' }));
      return errResponse('not_food', validation.data.rejectionReason, correlationId, { jobId: job.job_id });
    }

    await supabase.rpc('complete_ai_job', {
      p_job_id: job.job_id,
      p_raw_response: validation.data,
      p_model: GEMINI_MODEL,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_estimated_cost_usd: estimatedCostUsd,
    });

    console.log(
      JSON.stringify({
        correlationId,
        jobId: job.job_id,
        event: 'completed',
        latencyMs: Date.now() - startedAt,
      }),
    );

    return okResponse({
      jobId: job.job_id,
      status: 'needs_confirmation',
      result: validation.data,
      correlationId,
    });
  } catch (err) {
    console.log(JSON.stringify({ correlationId, event: 'unhandled_error', message: String(err) }));
    return jsonResponse({ error: 'internal_error', correlationId }, 500);
  }
});
