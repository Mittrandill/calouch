import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '../env';
import { largeSecureStore } from './secureStorage';

/**
 * Supabase istemcisi.
 *
 * Yalnız publishable/anon anahtar kullanır — bu anahtar public'tir ve satır
 * erişimini RLS belirler (§09). Service-role anahtarı bu dosyaya giremez.
 */
export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      // §09: token şifreli depoda.
      storage: largeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      // Derin bağlantıyı expo-router yönetir; URL'den oturum çıkarmak
      // React Native'de anlamlı değil (tarayıcı adres çubuğu yok).
      detectSessionInUrl: false,
    },
  },
);

/**
 * Uygulama ön planda değilken token yenileme zamanlayıcısı boşuna çalışır ve
 * arka planda ağ isteği üretir. Ön plana dönüşte yenilemeyi tekrar başlatmak,
 * cold start sonrası oturumun süresi dolmuş token'la açılmasını engeller.
 */
export function registerAuthAutoRefresh(): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });

  return () => subscription.remove();
}
