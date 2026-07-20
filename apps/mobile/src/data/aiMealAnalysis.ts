import type { AIJob, MealDraft } from '@calouch/types';
import { aiJobSchema, mealDraftSchema } from '@calouch/validation';
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';
import { env } from '@/env';

/**
 * MVP-09 AI job istemcisi. POST işi kuyruğa alır; GET job endpoint'i terminal
 * duruma kadar poll edilir. Aynı operationId ile tek ağ retry'ı, POST cevabı
 * kaybolsa bile idempotency üzerinden aynı job'ı bulur ve ikinci provider
 * çağrısı üretmez.
 */

const BUCKET = 'ai-meal-photos';
const MAX_DIMENSION = 1280;
const JPEG_COMPRESSION = 0.8;
const POLL_INTERVAL_MS = 1_000;
const MAX_POLL_ATTEMPTS = 60;

export type AnalyzeMealPhotoResult =
  | { ok: true; jobId: string; status: 'needs_confirmation'; result: MealDraft; storagePath: string }
  | { ok: false; code: string; message: string };

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function getAiJob(jobId: string, accessToken: string): Promise<AIJob> {
  const response = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-jobs/${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!response.ok) throw new Error(`AI job okunamadı: ${response.status}`);

  const payload: unknown = await response.json();
  const validation = aiJobSchema.safeParse(
    typeof payload === 'object' && payload !== null && 'job' in payload
      ? (payload as { job: unknown }).job
      : undefined,
  );
  if (!validation.success) throw new Error('Sunucudan geçersiz AI job yanıtı geldi');
  return validation.data;
}

async function waitForAiJob(
  jobId: string,
  accessToken: string,
  storagePath: string,
): Promise<AnalyzeMealPhotoResult> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const job = await getAiJob(jobId, accessToken);
    if (job.status === 'failed' || job.status === 'expired') {
      return {
        ok: false,
        code: job.errorCode ?? 'processing_error',
        message: job.errorMessage ?? 'Analiz tamamlanamadı',
      };
    }
    if (job.status === 'needs_confirmation') {
      const result = mealDraftSchema.safeParse(job.result);
      if (!result.success) throw new Error('Sunucudan geçersiz analiz taslağı geldi');
      return { ok: true, jobId, status: 'needs_confirmation', result: result.data, storagePath };
    }
    await delay(POLL_INTERVAL_MS);
  }
  return { ok: false, code: 'processing_error', message: 'Analiz zaman aşımına uğradı' };
}

export function useAnalyzeMealPhoto() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: async ({ uri }: { uri: string }): Promise<AnalyzeMealPhotoResult> => {
      if (userId === undefined || accessToken === undefined) {
        throw new Error('useAnalyzeMealPhoto: oturum yok');
      }

      // Re-encode EXIF/GPS'i taşımaz; resize provider maliyetini ve upload
      // süresini sınırlar.
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_DIMENSION } }],
        { compress: JPEG_COMPRESSION, format: ImageManipulator.SaveFormat.JPEG },
      );
      const storagePath = `${userId}/${Crypto.randomUUID()}.jpg`;
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const operationId = Crypto.randomUUID();
      let data: unknown;
      let lastInvokeError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const invocation = await supabase.functions.invoke('analyze-meal-photo', {
          body: { operationId, storagePath },
        });
        if (invocation.error === null) {
          data = invocation.data;
          lastInvokeError = undefined;
          break;
        }
        lastInvokeError = invocation.error;
      }
      if (lastInvokeError !== undefined) throw lastInvokeError;

      if (typeof data !== 'object' || data === null) {
        throw new Error('Sunucudan geçersiz job kabul yanıtı geldi');
      }
      const accepted = data as {
        ok?: boolean;
        code?: string;
        message?: string;
        jobId?: string;
        status?: string;
        result?: unknown;
        errorCode?: string | null;
        errorMessage?: string | null;
      };
      if (!accepted.ok) {
        return {
          ok: false,
          code: accepted.code ?? 'generic',
          message: accepted.message ?? 'Analiz başlatılamadı',
        };
      }
      if (typeof accepted.jobId !== 'string') throw new Error('Job kimliği eksik');

      // İdempotent retry sırasında ilk çağrının job'ı bitmiş olabilir.
      if (accepted.status === 'needs_confirmation') {
        const result = mealDraftSchema.safeParse(accepted.result);
        if (!result.success) throw new Error('Sunucudan geçersiz analiz taslağı geldi');
        return {
          ok: true,
          jobId: accepted.jobId,
          status: 'needs_confirmation',
          result: result.data,
          storagePath,
        };
      }
      if (accepted.status === 'failed') {
        return {
          ok: false,
          code: accepted.errorCode ?? 'processing_error',
          message: accepted.errorMessage ?? 'Analiz tamamlanamadı',
        };
      }
      return waitForAiJob(accepted.jobId, accessToken, storagePath);
    },
  });
}
