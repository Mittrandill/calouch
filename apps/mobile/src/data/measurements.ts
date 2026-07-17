import { calculateGoals, type ActivityLevel, type BiologicalSex, type PrimaryGoal } from '@calouch/nutrition-engine';
import type { BodyMeasurement, WeightTrendRow } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/auth/supabase';
import { useProfile, useUpdateProfile } from '@/data/profile';
import { useCurrentYear } from '@/onboarding/useCurrentYear';

/**
 * Vücut ölçümü veri katmanı. §05 "Vücut ölçüleri". `water_logs` ile aynı
 * desen — client `body_measurements` üzerinde doğrudan INSERT yapar
 * (bkz. supabase/migrations/20260716210454_body_measurements.sql).
 */
export function useMeasurements(limit = 30) {
  return useQuery({
    queryKey: ['body-measurements', limit],
    queryFn: async (): Promise<BodyMeasurement[]> => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .is('deleted_at', null)
        .order('measured_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useWeightTrend() {
  return useQuery({
    queryKey: ['weight-trend'],
    queryFn: async (): Promise<WeightTrendRow[]> => {
      const { data, error } = await supabase.rpc('weight_trend', {});
      if (error) throw error;
      return data;
    },
  });
}

export type LogMeasurementInput = {
  measuredAt?: Date;
  weightKg?: number;
  heightCm?: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  neckCm?: number;
  shoulderCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  armRightCm?: number;
  armLeftCm?: number;
  forearmRightCm?: number;
  forearmLeftCm?: number;
  thighRightCm?: number;
  thighLeftCm?: number;
  calfRightCm?: number;
  calfLeftCm?: number;
  notes?: string;
};

export function useLogMeasurement() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const currentYear = useCurrentYear();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogMeasurementInput): Promise<void> => {
      if (userId === undefined) {
        throw new Error('useLogMeasurement: oturum yok');
      }

      // §03/§05 "tekrar gönderim çift kayıt üretmez" — water_logs'taki
      // aynı desen: UNIQUE(operation_id), 23505 başarı sayılır.
      const operationId = Crypto.randomUUID();
      const { error } = await supabase.from('body_measurements').insert({
        user_id: userId,
        operation_id: operationId,
        measured_at: (input.measuredAt ?? new Date()).toISOString(),
        source: 'manual',
        weight_kg: input.weightKg,
        height_cm: input.heightCm,
        body_fat_pct: input.bodyFatPct,
        muscle_mass_kg: input.muscleMassKg,
        neck_cm: input.neckCm,
        shoulder_cm: input.shoulderCm,
        chest_cm: input.chestCm,
        waist_cm: input.waistCm,
        hip_cm: input.hipCm,
        arm_right_cm: input.armRightCm,
        arm_left_cm: input.armLeftCm,
        forearm_right_cm: input.forearmRightCm,
        forearm_left_cm: input.forearmLeftCm,
        thigh_right_cm: input.thighRightCm,
        thigh_left_cm: input.thighLeftCm,
        calf_right_cm: input.calfRightCm,
        calf_left_cm: input.calfLeftCm,
        notes: input.notes,
      });
      if (error && error.code !== '23505') throw error;

      // §05/MVP-02 "kilo/hedef değişince yeniden hesaplama tetiği": yeni
      // kilo girildiyse profildeki güncel kilo VE hedefler tazelenir.
      // Formül nutrition-engine'de (saf TS) yaşar — burada TEKRARLANMAZ,
      // yalnız çağrılır (onboarding.tsx ile AYNI çağrı deseni).
      if (input.weightKg !== undefined && profile.data !== undefined) {
        const p = profile.data;
        const canRecalculate =
          p.birth_year !== null &&
          p.height_cm !== null &&
          p.target_weight_kg !== null &&
          p.activity_level !== null &&
          p.primary_goal !== null;

        if (canRecalculate) {
          try {
            const goals = calculateGoals({
              birthYear: p.birth_year!,
              heightCm: p.height_cm!,
              weightKg: input.weightKg,
              targetWeightKg: p.target_weight_kg!,
              sex: p.biological_sex as BiologicalSex,
              activityLevel: p.activity_level as ActivityLevel,
              primaryGoal: p.primary_goal as PrimaryGoal,
              weeklyChangeKg: p.weekly_change_kg ?? 0,
              currentYear,
            });
            await updateProfile.mutateAsync({
              weight_kg: input.weightKg,
              bmr_kcal: goals.bmr,
              tdee_kcal: goals.tdee,
              target_calories_kcal: goals.targetCalories,
              protein_g: goals.macros.proteinG,
              carbs_g: goals.macros.carbsG,
              fat_g: goals.macros.fatG,
              fiber_g: goals.macros.fiberG,
              water_ml: goals.waterMl,
              goal_formula_version: goals.formulaVersion,
              goals_confidence: goals.confidence,
              goal_warnings: goals.warnings,
              goals_calculated_at: new Date().toISOString(),
            });
          } catch {
            // GoalInputError ihtimali düşük (profil onboarding'de zaten
            // doğrulandı) — yine de olursa ölçüm KAYDI başarısız SAYILMAZ,
            // hedef yeniden hesabı ikincil bir etkidir.
          }
        } else {
          await updateProfile.mutateAsync({ weight_kg: input.weightKg });
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-measurements'] });
      void queryClient.invalidateQueries({ queryKey: ['weight-trend'] });
    },
  });
}
