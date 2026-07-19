import type { HealthConnectionStatus, HealthSource } from '@calouch/health-connectors';
import { buildDailyActivityUpsertPayload } from '@calouch/health-connectors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

import { isAppleHealthAvailable, readAppleHealthToday, requestAppleHealthPermission } from './appleHealthAdapter';
import {
  isHealthConnectAvailable,
  readHealthConnectToday,
  requestHealthConnectPermission,
} from './healthConnectAdapter';

const STORAGE_KEY = 'calouch.health-connection-status';

/**
 * HealthKit/Health Connect hiç web karşılığı yok (SecureStore'daki
 * `webDevStorage` takas deseninin AKSİNE) — web'de `source` `null`,
 * `connect()` no-op, ekran butonu devre dışı gösterir.
 */
const source: HealthSource | null =
  Platform.OS === 'ios' ? 'apple_health' : Platform.OS === 'android' ? 'health_connect' : null;

type HealthConnectionValue = {
  status: HealthConnectionStatus;
  isRestoring: boolean;
  isSyncing: boolean;
  error: 'not-available' | 'connect-failed' | 'sync-failed' | null;
  source: HealthSource | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncToday: () => Promise<void>;
};

const HealthConnectionContext = createContext<HealthConnectionValue | null>(null);

/**
 * §17'nin 6 adımlı bağlanma akışı + ön planda senkron (§01 native kapı:
 * background task AYRI gated bir yetenek, v1 kapsamı dışı — bkz.
 * 14-open-decisions.md). Bağlantı tercihi yalnız cihazda tutulur (hesaba
 * yazılmaz) — §00 "izin reddedilse de temel kullanım çalışır" ilkesi
 * gereği bu hiçbir ekranı bloklamaz, yalnız Bugün ekranındaki kartların
 * "Bağlan" CTA'sı mı gerçek veri mi göstereceğini belirler.
 *
 * KÖK NEDENLİ TASARIM: tek bir Provider olarak `_layout.tsx`'te bir kez
 * mount edilir (ThemeProvider/LocaleProvider ile AYNI desen). Expo
 * Router'ın sekmeleri arka planda MOUNTED tutması (tab switch'te
 * unmount/remount YOK) yüzünden, bu durum her ekranda ayrı `useState` ile
 * tutulsaydı health-connection.tsx'te bağlanıp Bugün sekmesine dönüldüğünde
 * o sekmenin zaten mount olmuş instance'ı bunu asla göremezdi — gerçek
 * cihaz testinde bulunan bir hata buydu.
 */
export function HealthConnectionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<HealthConnectionStatus>('disconnected');
  // Web'de kaydedilecek bir bağlantı tercihi yok (source === null) — geri
  // yükleme efekti hiç çalışmaz, bu yüzden başlangıç değeri buna göre.
  const [isRestoring, setIsRestoring] = useState(source !== null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<'not-available' | 'connect-failed' | 'sync-failed' | null>(null);

  useEffect(() => {
    if (source === null) return;
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!cancelled && value === 'connected') setStatus('connected');
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncToday = useCallback(async () => {
    if (userId === undefined || source === null) return;
    setIsSyncing(true);
    setError(null);
    try {
      const sample = source === 'apple_health' ? await readAppleHealthToday() : await readHealthConnectToday();
      const payload = buildDailyActivityUpsertPayload(sample, userId);
      const { error: upsertError } = await supabase
        .from('daily_activity_metrics')
        .upsert(payload, { onConflict: 'user_id,activity_date,source' });
      if (upsertError) throw upsertError;
      void queryClient.invalidateQueries({ queryKey: ['daily-activity'] });
    } catch {
      // §00: health senkron hatası uygulamanın geri kalanını bloklamaz —
      // kart "Bağlan"/eski değeri göstermeye devam eder, kullanıcı tekrar
      // dener.
      setError('sync-failed');
    } finally {
      setIsSyncing(false);
    }
  }, [userId, queryClient]);

  const connect = useCallback(async () => {
    if (source === null) return;
    setStatus('connecting');
    setError(null);
    try {
      const available = source === 'apple_health' ? await isAppleHealthAvailable() : await isHealthConnectAvailable();
      if (!available) {
        setStatus('denied');
        setError('not-available');
        return;
      }

      const granted =
        source === 'apple_health' ? await requestAppleHealthPermission() : await requestHealthConnectPermission();
      if (!granted) {
        setStatus('denied');
        return;
      }

      setStatus('connected');
      await AsyncStorage.setItem(STORAGE_KEY, 'connected');
      await syncToday();
    } catch {
      setStatus('denied');
      setError('connect-failed');
    }
  }, [syncToday]);

  const disconnect = useCallback(async () => {
    // §17 "kullanıcı bağlantıyı kesince ... kendi kayıtları politika gereği
    // korunur" — geçmiş `daily_activity_metrics` satırları SİLİNMEZ, yalnız
    // yerel bağlantı tercihi sıfırlanır.
    setStatus('disconnected');
    await AsyncStorage.setItem(STORAGE_KEY, 'disconnected');
  }, []);

  const value = useMemo<HealthConnectionValue>(
    () => ({
      status,
      isRestoring,
      isSyncing,
      error,
      source,
      isSupported: source !== null,
      connect,
      disconnect,
      syncToday,
    }),
    [status, isRestoring, isSyncing, error, connect, disconnect, syncToday],
  );

  return <HealthConnectionContext value={value}>{children}</HealthConnectionContext>;
}

export function useHealthConnection(): HealthConnectionValue {
  const context = use(HealthConnectionContext);
  if (context === null) {
    throw new Error('useHealthConnection, HealthConnectionProvider içinde çağrılmalı');
  }
  return context;
}
