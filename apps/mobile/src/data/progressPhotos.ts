import type { ProgressPhoto } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

/**
 * İlerleme fotoğrafı veri katmanı. §05: "private bucket'ta tutulur; public
 * URL yoktur, görüntüleme signed URL kullanır." İkili veri
 * `progress-photos` bucket'ında, bu dosya yalnız metadata + signed URL
 * üretimini yönetir (bkz. supabase/migrations/20260716211032_progress_photos.sql).
 */

const BUCKET = 'progress-photos';
const SIGNED_URL_TTL_SECONDS = 600;

export type PhotoAngle = 'front' | 'side' | 'back';

export type ProgressPhotoWithUrl = ProgressPhoto & { signedUrl: string };

export function useProgressPhotos() {
  return useQuery({
    queryKey: ['progress-photos'],
    queryFn: async (): Promise<ProgressPhotoWithUrl[]> => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .is('deleted_at', null)
        .order('taken_at', { ascending: false });
      if (error) throw error;

      return Promise.all(
        data.map(async (photo) => {
          const { data: signed, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);
          if (signError) throw signError;
          return { ...photo, signedUrl: signed.signedUrl };
        }),
      );
    },
  });
}

export function useUploadProgressPhoto() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, angle }: { uri: string; angle: PhotoAngle }): Promise<void> => {
      if (userId === undefined) {
        throw new Error('useUploadProgressPhoto: oturum yok');
      }

      // §09 yol sözleşmesi: {user_id}/{photo_id}.jpg — storage RLS bu
      // öneki kaynak olarak kullanır (bkz. migration'daki foldername
      // kuralı).
      const storagePath = `${userId}/${Crypto.randomUUID()}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({ user_id: userId, storage_path: storagePath, angle });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
    },
  });
}

export function useDeleteProgressPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: ProgressPhoto): Promise<void> => {
      // İkili veri gerçekten silinir (soft-delete yok) — özel içerik,
      // saklanacak bir denetim/geri alma değeri yok. Metadata satırı
      // `progress_photos`'ta DELETE grant'i olmadığı için (§09 immutable
      // liste deseni) soft-delete edilir.
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase
        .from('progress_photos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
    },
  });
}
