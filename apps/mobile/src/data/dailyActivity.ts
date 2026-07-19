import type { DailyActivitySummaryRow } from '@calouch/types';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/auth/supabase';

/**
 * Günlük adım/aktif enerji özeti (§17, MVP-12). `daily_water_summary` ile
 * aynı desen — yazma yolu bu dosyada değil, `useHealthConnection().syncToday()`
 * içinde (native oku → `daily_activity_metrics` upsert).
 */

/** `YYYY-MM-DD` — Postgres `date` parametresi için. */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type DailyActivitySummary = {
  steps: number | null;
  activeEnergyKcal: number | null;
  source: string | null;
  syncedAt: string | null;
};

export function useDailyActivitySummary(date: Date) {
  const dateParam = toDateParam(date);

  return useQuery({
    queryKey: ['daily-activity', dateParam],
    queryFn: async (): Promise<DailyActivitySummary> => {
      const { data, error } = await supabase.rpc('daily_activity_summary', {
        target_date: dateParam,
      });
      if (error) throw error;
      const row: DailyActivitySummaryRow | undefined = data[0];
      return {
        steps: row?.steps ?? null,
        activeEnergyKcal: row?.active_energy_kcal ?? null,
        source: row?.source ?? null,
        syncedAt: row?.synced_at ?? null,
      };
    },
  });
}
