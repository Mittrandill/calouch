/**
 * §17: "iOS/Android adaptörleri aynı normalize domain tipini döndürür."
 * Bu dosya o normalize tipleri taşır — RN/native modül importu YASAK
 * (bkz. eslint.config.mjs, nutrition-engine ile aynı kısıt). Gerçek
 * HealthKit/Health Connect çağrıları `apps/mobile/src/health/`'te yaşar.
 */
export type HealthSource = 'apple_health' | 'health_connect';

export type HealthConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'denied';

/**
 * Native adaptörden okunan ham günlük örnek — henüz DB satırına çevrilmemiş.
 * `date` cihazın yerel takvim gününü taşır (§17 "timezone ve gün sınırı
 * açıkça modellenir").
 */
export type RawDailyActivitySample = {
  date: string;
  steps: number | null;
  activeEnergyKcal: number | null;
  source: HealthSource;
  /** §17 "her kaynak kayıt platform record ID ... taşır." */
  platformRecordId: string | null;
};
