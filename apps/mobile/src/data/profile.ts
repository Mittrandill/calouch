import type { Profile, ProfileUpdate } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

/**
 * Profil veri erişimi.
 *
 * §01: "Server state: TanStack Query ... profil." Bu dosya apps/mobile
 * içindedir, bir domain paketi değil — burada Supabase importu serbesttir
 * (ESLint kısıtlaması yalnız packages/nutrition-engine gibi saf domain
 * paketlerini kapsar).
 */
export const profileQueryKey = (userId: string) => ['profile', userId] as const;

/**
 * Oturum açmış kullanıcının profilini getirir.
 *
 * Satır her zaman vardır: `on_auth_user_created` trigger'ı kayıt anında
 * oluşturur (bkz. supabase/migrations). `enabled: false` yalnız oturum
 * henüz geri yüklenmemişken sorguyu erteler — "profil yok" anlamına gelmez.
 */
export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: profileQueryKey(userId ?? ''),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: userId !== undefined,
  });
}

/**
 * Profili günceller.
 *
 * Onboarding wizard'ı ve profil düzenleme ekranları bunu kullanır. Başarı
 * sonrası cache invalidation yerine doğrudan `setQueryData` kullanılır:
 * güncellenen satır zaten elimizde, gereksiz bir round-trip yaratmaz ve
 * onboarding gate'inin (tabs layout) bir sonraki render'da güncel veriyi
 * anında görmesini sağlar.
 */
export function useUpdateProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: ProfileUpdate): Promise<Profile> => {
      if (userId === undefined) {
        throw new Error('useUpdateProfile: oturum yok');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (userId !== undefined) {
        queryClient.setQueryData(profileQueryKey(userId), data);
      }
    },
  });
}
