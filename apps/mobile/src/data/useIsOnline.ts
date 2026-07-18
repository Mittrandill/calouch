import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Bugün ekranının "offline" durumunu "hata" durumundan ayırmak için (§9,
 * MVP-11 kabul kriteri). `queryClient.ts`'teki `onlineManager` sorgu
 * davranışını (retry/refetch) yönetir; bu hook aynı sinyali UI'da banner
 * göstermek için okur.
 */
export function useIsOnline(): boolean {
  const netInfo = useNetInfo();
  // `isConnected` ilk render'da `null` olabilir (henüz ölçülmedi) — o anda
  // "offline" banner'ı yanlışlıkla yanıp sönmesin diye `true` varsayılır.
  return netInfo.isConnected ?? true;
}
