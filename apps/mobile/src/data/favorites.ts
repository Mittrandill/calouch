import type { FavoriteFoodSummary } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

/**
 * Favori besin veri katmanı. §03 kullanıcı içeriği: `favorite_foods`. Tek
 * satırlık yıldızlama — client `favorite_foods` üzerinde doğrudan
 * INSERT/DELETE yapar (bkz. supabase/migrations/20260716200459_favorite_foods.sql).
 */
export function useFavoriteFoods(locale: 'tr' | 'en') {
  return useQuery({
    queryKey: ['favorite-foods', locale],
    queryFn: async (): Promise<FavoriteFoodSummary[]> => {
      const { data, error } = await supabase.rpc('list_favorite_foods', { only_locale: locale });
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleFavorite() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ foodId, isFavorite }: { foodId: string; isFavorite: boolean }): Promise<void> => {
      if (userId === undefined) {
        throw new Error('useToggleFavorite: oturum yok');
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_foods')
          .delete()
          .eq('user_id', userId)
          .eq('food_id', foodId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorite_foods').insert({ user_id: userId, food_id: foodId });
        // 23505: aynı besin zaten favori (çift dokunma yarışı) — hata sayılmaz.
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorite-foods'] });
    },
  });
}
