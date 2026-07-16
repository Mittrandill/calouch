import type { Database } from '@calouch/types';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '../env';
import { authStorage } from './authStorage';

/**
 * Supabase istemcisi.
 *
 * Yalnız publishable/anon anahtar kullanır — bu anahtar public'tir ve satır
 * erişimini RLS belirler (§09). Service-role anahtarı bu dosyaya giremez.
 *
 * `<Database>` generic'i: sorgular gerçek şemayla derleme zamanında
 * doğrulanır. `packages/types`, migration eklendiğinde yeniden üretilir —
 * elle senkron tutulmaz.
 */
export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      // §09: mobilde token şifreli depoda. Web dalı yalnız geliştirme içindir
      // ve production'da yüklenmeyi reddeder — bkz. authStorage.ts.
      storage: authStorage,
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
