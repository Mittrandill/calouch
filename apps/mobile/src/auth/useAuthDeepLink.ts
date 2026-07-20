import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';

import { supabase } from './supabase';

/**
 * Magic link ve şifre sıfırlama AYNI mekanizmayı kullanır: kullanıcı
 * e-postadaki linke basar → `calouch://...?code=xxx&type=recovery` derin
 * bağlantısıyla uygulama açılır. `supabase.ts`'te `detectSessionInUrl:
 * false` (RN'de adres çubuğu yok) — yani PKCE kod değişimini burada ELLE
 * yapıyoruz, supabase-js otomatik yapmıyor.
 *
 * `app/_layout.tsx`'te BİR KERE çağrılır.
 */
export function useAuthDeepLink() {
  // Aynı kodun iki kez işlenmesini engeller (StrictMode çift efekt / aynı
  // URL için birden fazla event — kodlar tek kullanımlık, ikinci deneme
  // sunucudan hata döner).
  const processedCodes = useRef(new Set<string>());

  useEffect(() => {
    const handleUrl = (url: string) => {
      const { queryParams } = Linking.parse(url);
      const code = queryParams?.code;
      const type = queryParams?.type;
      if (typeof code !== 'string' || processedCodes.current.has(code)) return;
      processedCodes.current.add(code);

      void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        // Magic link durumunda ekstra navigasyon gerekmez —
        // AuthProvider'daki onAuthStateChange yeni oturumu yakalar,
        // (auth)/_layout.tsx'in mevcut redirect'i kullanıcıyı (tabs)'a
        // taşır. Recovery'de kullanıcıyı doğrudan yeni şifre ekranına
        // götürüyoruz.
        if (!error && type === 'recovery') {
          router.replace('/reset-password');
        }
      });
    };

    void Linking.getInitialURL().then((url) => {
      if (url !== null) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);
}
