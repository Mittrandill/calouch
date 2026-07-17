import type { MealAnalysis } from '@calouch/types';
import { mealAnalysisSchema } from '@calouch/validation';
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

/**
 * AI fotoğraf analizi veri katmanı. §04 kullanıcı akışı adım 1-9 — yalnız
 * MVP-08 dilimi: Gemini'den doğrulanmış HAM aday listesi döner. Katalog
 * eşleştirme/kalori hesabı YOK (MVP-09'un işi, bkz.
 * supabase/functions/analyze-meal-photo/index.ts üstündeki not).
 */

const BUCKET = 'ai-meal-photos';
// §04 "Cihaz görüntüyü yeniden boyutlandırır; EXIF ve konumu temizler" —
// manipulateAsync re-encode ürettiği için EXIF/GPS zaten taşınmaz, resize
// ayrıca yükleme boyutunu/Gemini maliyetini düşürür.
const MAX_DIMENSION = 1280;
const JPEG_COMPRESSION = 0.8;

export type AnalyzeMealPhotoResult =
  | { ok: true; jobId: string; status: string; result: MealAnalysis }
  | { ok: false; code: string; message: string };

export function useAnalyzeMealPhoto() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ uri }: { uri: string }): Promise<AnalyzeMealPhotoResult> => {
      if (userId === undefined) {
        throw new Error('useAnalyzeMealPhoto: oturum yok');
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_DIMENSION } }],
        { compress: JPEG_COMPRESSION, format: ImageManipulator.SaveFormat.JPEG },
      );

      // §09 yol sözleşmesi: {user_id}/{uuid}.jpg — ai-meal-photos storage
      // RLS'i (progress-photos ile birebir aynı desen) bu öneki kaynak alır.
      const storagePath = `${userId}/${Crypto.randomUUID()}.jpg`;

      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const operationId = Crypto.randomUUID();
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-meal-photo', {
        body: { operationId, storagePath },
      });
      // §04 "beklenmeyen" durumlar (auth/geçersiz istek/dahili hata) — Edge
      // Function iş mantığı sonuçlarını (kill switch/rate limit/non-food/
      // provider hatası) HTTP 200 ile döner (bkz. index.ts üstündeki not),
      // yani buraya yalnız gerçekten beklenmeyen ağ/sunucu hataları düşer.
      if (invokeError) throw invokeError;

      if (!data.ok) {
        return { ok: false, code: data.code, message: data.message };
      }

      // İstemci tarafı Zod doğrulaması da yapılır: Edge Function zaten
      // doğruladı, ama bozuk/beklenmeyen bir yanıtı kullanıcıya YANLIŞ
      // biçimlendirilmiş göstermek yerine burada da yakalanır (§04 "şema
      // dışı yanıt son kullanıcıya gösterilmez" — çift katman).
      const validation = mealAnalysisSchema.safeParse(data.result);
      if (!validation.success) {
        throw new Error('Sunucudan geçersiz analiz yanıtı geldi');
      }

      return { ok: true, jobId: data.jobId, status: data.status, result: validation.data };
    },
  });
}
