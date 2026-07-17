import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { webDevStorage } from '@/auth/webDevStorage';
import { useTranslations } from '@/i18n/LocaleProvider';

/**
 * §05 "Opsiyonel biyometrik kilit uygulanabilir" — ilerleme fotoğrafları
 * için. Tercih küçük bir bayrak olduğu için SecureStore'da doğrudan tutulur
 * (auth/secureStorage.ts'teki parçalama yalnız 2048 baytı aşan oturum
 * verisi için gerekli, burada gerek yok).
 *
 * `expo-secure-store`'un web karşılığı yok (authStorage.ts'teki AYNI
 * sınırlama) — web'de `webDevStorage`'a düşer, yalnız dev-browsing içindir.
 */
const PREFERENCE_KEY = 'progress_photos_biometric_lock';

const preferenceStore =
  Platform.OS === 'web'
    ? {
        getItemAsync: async (key: string) => webDevStorage.getItem(key),
        setItemAsync: async (key: string, value: string) => webDevStorage.setItem(key, value),
      }
    : SecureStore;

export function useBiometricLockPreference() {
  const [enabled, setEnabled] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    void preferenceStore.getItemAsync(PREFERENCE_KEY).then((value) => {
      setEnabled(value === 'true');
      setIsRestoring(false);
    });
  }, []);

  const setPreference = useCallback(async (value: boolean) => {
    setEnabled(value);
    await preferenceStore.setItemAsync(PREFERENCE_KEY, value ? 'true' : 'false');
  }, []);

  return { enabled, isRestoring, setPreference };
}

/**
 * Kilit açıksa girişte doğrulama ister; kapalıysa doğrudan açık sayılır.
 * Cihazda biyometri yoksa (donanım/kayıt eksik) kilit sessizce devre dışı
 * kalır — §00 "veri/izin reddedilse de temel kullanım çalışır" ilkesi
 * burada da geçerli, kullanıcı fotoğraflarından kilitlenip kalmaz.
 */
export function useBiometricGate(lockEnabled: boolean) {
  const t = useTranslations();
  const [isUnlocked, setIsUnlocked] = useState(!lockEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticate = useCallback(async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // Donanım/kayıt yoksa kilidi zorlamak kullanıcıyı içeriğinden
        // mahrum bırakırdı — kilit devre dışı gibi davranılır.
        setIsUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.progressPhotos.lock.unlockPrompt,
      });
      if (result.success) {
        setIsUnlocked(true);
      } else {
        setError(t.progressPhotos.lock.failed);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [t]);

  useEffect(() => {
    // authenticate()'in gövdesi setError/setIsAuthenticating ile BAŞLAR —
    // efekt içinde doğrudan çağrılırsa senkron setState sayılır. Bir
    // mikro-görev arkasına ertelemek (AuthProvider.tsx'teki .then()
    // deseniyle aynı fikir) bunu efekt gövdesinin DIŞINA taşır.
    if (lockEnabled && !isUnlocked) {
      void Promise.resolve().then(() => authenticate());
    }
  }, [lockEnabled, isUnlocked, authenticate]);

  return { isUnlocked, error, isAuthenticating, retry: authenticate };
}
