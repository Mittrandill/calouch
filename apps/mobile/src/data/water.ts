import type { DailyWaterSummaryRow } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';

/**
 * Su takibi veri katmanı. §03 "Su takibi": tek dokunuş, özel miktar, son
 * kullanılan miktar. `meals.ts`'in aksine tek tablo — client doğrudan
 * INSERT yapar (bkz. supabase/migrations/20260716194015_water_logs.sql).
 */

/** `YYYY-MM-DD` — Postgres `date` parametresi için. */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type DailyWaterSummary = {
  totalMl: number;
  logCount: number;
  /** §03 "son kullanılan miktar" — tek dokunuş varsayılanı. Herhangi bir
   * güne bağlı değildir, kullanıcının en son girdiği miktardır. */
  lastAmountMl: number | null;
};

export function useDailyWaterSummary(date: Date) {
  const dateParam = toDateParam(date);

  return useQuery({
    queryKey: ['daily-water', dateParam],
    queryFn: async (): Promise<DailyWaterSummary> => {
      const { data, error } = await supabase.rpc('daily_water_summary', {
        target_date: dateParam,
      });
      if (error) throw error;
      const row: DailyWaterSummaryRow | undefined = data[0];
      return {
        totalMl: row?.total_ml ?? 0,
        logCount: row?.log_count ?? 0,
        lastAmountMl: row?.last_amount_ml ?? null,
      };
    },
  });
}

export function useLogWater() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amountMl: number): Promise<void> => {
      if (userId === undefined) {
        throw new Error('useLogWater: oturum yok');
      }

      // §03 "tekrar gönderim çift su üretmez". water_logs tek tablo
      // olduğu için log_meal()'deki gibi bir "önce bak, varsa dön" RPC
      // yerine UNIQUE(operation_id) kullanılır — 23505 (unique_violation)
      // "zaten kaydedildi" anlamına gelir ve başarı sayılır (bkz.
      // migration'daki NOT).
      const operationId = Crypto.randomUUID();
      const { error } = await supabase.from('water_logs').insert({
        user_id: userId,
        amount_ml: amountMl,
        operation_id: operationId,
      });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['daily-water'] });
    },
  });
}
