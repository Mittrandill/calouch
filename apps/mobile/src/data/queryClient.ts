import { QueryClient } from '@tanstack/react-query';

/**
 * §01: "Server state: TanStack Query." Tekil client — birden fazla
 * QueryClient yaratmak cache'i bölerdi.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobilde ağ değişkendir; başarısız sorgu sessizce sonsuz beklemesin
      // ama tek seferde de vazgeçmesin.
      retry: 2,
      // Profil gibi düşük sıklıkla değişen veri için gereksiz refetch'i önler.
      staleTime: 30_000,
    },
  },
});
