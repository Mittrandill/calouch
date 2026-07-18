import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

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

/**
 * §9 (MVP-11) "Yerleşim tercihi ... offline okunur." TanStack Query'nin
 * varsayılan çevrimiçi algısı RN'de her zaman "online" varsayar — gerçek ağ
 * durumunu bilmesi için NetInfo'ya bağlanması gerekir (kütüphanenin resmi RN
 * entegrasyon deseni). Bu, yalnız Bugün ekranını değil profil/su/öğün/ölçü
 * sorgularının tümünü "offline" durumunu doğru raporlar hâle getirir.
 */
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? false);
  });
});

/**
 * Sorgu cache'ini cihaz diskine yazar — uygulama kapatılıp açıldığında veya
 * ağ yokken son bilinen veri (profil, günlük özet, su, ölçü trendi vb.)
 * anında görünür. `buster` şema uyumsuz bir cache'i sessizce atmak için;
 * `Database` şeması geriye dönük uyumsuz değişince artırılmalı.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'calouch.query-cache',
});
