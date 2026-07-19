import type { RawDailyActivitySample } from '@calouch/health-connectors';
import {
  isHealthDataAvailable,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

/**
 * HealthKit adaptörü (iOS). §17: "Yalnızca gerekli türler istenir." — bu app
 * yalnız adım ve aktif enerji OKUR, HealthKit'e hiçbir şey YAZMAZ
 * (`NSHealthUpdateUsageDescription` bu yüzden gerekmiyor, bkz. app.json).
 */
const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
] as const;

/** `YYYY-MM-DD` — `daily_activity_metrics.activity_date` için. */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function isAppleHealthAvailable(): Promise<boolean> {
  return isHealthDataAvailable();
}

export async function requestAppleHealthPermission(): Promise<boolean> {
  return requestAuthorization({ toRead: READ_TYPES });
}

export async function readAppleHealthToday(): Promise<RawDailyActivitySample> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();

  const [stepsResult, energyResult] = await Promise.all([
    queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
      filter: { date: { startDate: startOfDay, endDate: endOfDay } },
    }),
    queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], {
      filter: { date: { startDate: startOfDay, endDate: endOfDay } },
    }),
  ]);

  return {
    date: toDateParam(startOfDay),
    steps: stepsResult.sumQuantity ? Math.round(stepsResult.sumQuantity.quantity) : null,
    activeEnergyKcal: energyResult.sumQuantity
      ? Math.round(energyResult.sumQuantity.quantity * 10) / 10
      : null,
    source: 'apple_health',
    // Günlük TOPLAM tek bir HealthKit örneğine karşılık gelmez — dedup zaten
    // (user, date, source) UNIQUE'i ile sağlanıyor (bkz. migration).
    platformRecordId: null,
  };
}
