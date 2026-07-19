import type { RawDailyActivitySample } from '@calouch/health-connectors';
import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

/**
 * Health Connect adaptörü (Android). §17: "Yalnızca gerekli türler istenir."
 * Health Connect Android 14 öncesinde ayrı bir uygulama gerektirir —
 * `isHealthConnectAvailable()` bunu `SDK_UNAVAILABLE` olarak ayırt eder
 * (izin reddi ile AYNI durum değil, ayrı bir bağlanma engeli).
 */

/** `YYYY-MM-DD` — `daily_activity_metrics.activity_date` için. */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function isHealthConnectAvailable(): Promise<boolean> {
  const status = await getSdkStatus();
  return status === SdkAvailabilityStatus.SDK_AVAILABLE;
}

export async function requestHealthConnectPermission(): Promise<boolean> {
  await initialize();
  const granted = await requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  ]);
  return granted.length > 0;
}

export async function readHealthConnectToday(): Promise<RawDailyActivitySample> {
  await initialize();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();

  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: startOfDay.toISOString(),
    endTime: endOfDay.toISOString(),
  };

  const [stepsResult, energyResult] = await Promise.all([
    aggregateRecord({ recordType: 'Steps', timeRangeFilter }),
    aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }),
  ]);

  return {
    date: toDateParam(startOfDay),
    steps: stepsResult.dataOrigins.length > 0 ? stepsResult.COUNT_TOTAL : null,
    activeEnergyKcal:
      energyResult.dataOrigins.length > 0
        ? Math.round(energyResult.ACTIVE_CALORIES_TOTAL.inKilocalories * 10) / 10
        : null,
    source: 'health_connect',
    platformRecordId: null,
  };
}
