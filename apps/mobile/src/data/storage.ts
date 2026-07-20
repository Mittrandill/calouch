import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/auth/supabase';

const SIGNED_URL_TTL_SECONDS = 600;

/**
 * §09 "private bucket'ta tutulur; public URL yoktur, görüntüleme signed URL
 * kullanır" deseninin paylaşımlı çekirdeği — `progressPhotos.ts` ve
 * `LastMealCard`'daki öğün fotoğrafı aynı şekli üretir.
 */
export async function getSignedPhotoUrl(
  bucket: string,
  path: string,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export function useSignedPhotoUrl(bucket: string, path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-photo-url', bucket, path],
    queryFn: () => getSignedPhotoUrl(bucket, path!),
    enabled: path !== null && path !== undefined,
  });
}
