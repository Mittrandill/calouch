import type { DailyActivityMetricInsert } from '@calouch/types';

import type { RawDailyActivitySample } from './types';

export class InvalidActivitySampleError extends Error {}

// migration 20260718120000'deki CHECK aralıklarıyla AYNI — motorun
// reddettiği bir satır veritabanına gitmeden önce burada yakalanır.
const MAX_STEPS = 200_000;
const MAX_ENERGY_KCAL = 20_000;

/**
 * Native adaptörden gelen ham örneği `daily_activity_metrics` upsert
 * satırına çevirir. `synced_at` burada üretilir (çağrı anı), yeniden sync
 * `daily_activity_summary`nin çoklu-kaynak çözümünde bunu kullanır.
 */
export function buildDailyActivityUpsertPayload(
  sample: RawDailyActivitySample,
  userId: string,
): DailyActivityMetricInsert {
  if (sample.steps === null && sample.activeEnergyKcal === null) {
    throw new InvalidActivitySampleError('Adım ve aktif enerji ikisi de boş olamaz');
  }
  if (sample.steps !== null && (sample.steps < 0 || sample.steps > MAX_STEPS)) {
    throw new InvalidActivitySampleError(`steps aralık dışı: ${sample.steps}`);
  }
  if (
    sample.activeEnergyKcal !== null &&
    (sample.activeEnergyKcal < 0 || sample.activeEnergyKcal > MAX_ENERGY_KCAL)
  ) {
    throw new InvalidActivitySampleError(`activeEnergyKcal aralık dışı: ${sample.activeEnergyKcal}`);
  }

  return {
    user_id: userId,
    activity_date: sample.date,
    source: sample.source,
    steps: sample.steps,
    active_energy_kcal: sample.activeEnergyKcal,
    platform_record_id: sample.platformRecordId,
    synced_at: new Date().toISOString(),
  };
}
