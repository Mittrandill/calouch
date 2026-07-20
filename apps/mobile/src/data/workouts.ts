import type {
  ActiveWorkoutSession,
  FinishWorkoutSessionResult,
  WorkoutSessionDetail,
  WorkoutSessionSummary,
} from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/auth/supabase';

/**
 * Canlı antrenman veri katmanı. `meals.ts`'teki RPC-only + `operation_id`
 * idempotent yazma deseniyle aynı — bkz.
 * supabase/migrations/20260720162500_workout_functions.sql.
 */

export function useActiveWorkoutSession() {
  return useQuery({
    queryKey: ['active-workout-session'],
    queryFn: async (): Promise<ActiveWorkoutSession | null> => {
      const { data, error } = await supabase.rpc('active_workout_session');
      if (error) throw error;
      return data[0] ?? null;
    },
  });
}

export function useWorkoutHistory(limitCount = 50) {
  return useQuery({
    queryKey: ['workout-history', limitCount],
    queryFn: async (): Promise<WorkoutSessionSummary[]> => {
      const { data, error } = await supabase.rpc('list_workout_sessions', { limit_count: limitCount });
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkoutSessionDetail(sessionId: string | undefined, locale: 'tr' | 'en') {
  return useQuery({
    queryKey: ['workout-session-detail', sessionId ?? '', locale],
    queryFn: async (): Promise<WorkoutSessionDetail> => {
      const { data, error } = await supabase.rpc('workout_session_detail', {
        target_session_id: sessionId!,
        preferred_locale: locale,
      });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Antrenman bulunamadı');
      return row;
    },
    enabled: sessionId !== undefined,
  });
}

export function useStartWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: { programVersionId?: string; programDayId?: string } = {},
    ): Promise<string> => {
      const operationId = Crypto.randomUUID();
      const { data, error } = await supabase.rpc('start_workout_session', {
        p_operation_id: operationId,
        p_program_version_id: input.programVersionId,
        p_program_day_id: input.programDayId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-workout-session'] });
    },
  });
}

export type CompleteSetInput = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  orderIndex: number;
  reps?: number | null;
  weightKg?: number | null;
  isBodyweight?: boolean;
  isWarmup?: boolean;
  isDropset?: boolean;
  rpe?: number | null;
  rir?: number | null;
};

export function useCompleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteSetInput): Promise<string> => {
      const operationId = Crypto.randomUUID();
      const { data, error } = await supabase.rpc('complete_set', {
        p_operation_id: operationId,
        p_session_id: input.sessionId,
        p_exercise_id: input.exerciseId,
        p_set_number: input.setNumber,
        p_order_index: input.orderIndex,
        p_reps: input.reps ?? undefined,
        p_weight_kg: input.weightKg ?? undefined,
        p_is_bodyweight: input.isBodyweight ?? false,
        p_is_warmup: input.isWarmup ?? false,
        p_is_dropset: input.isDropset ?? false,
        p_rpe: input.rpe ?? undefined,
        p_rir: input.rir ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['workout-session-detail', variables.sessionId] });
    },
  });
}

export type UpdateSetInput = {
  setId: string;
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
  rir?: number | null;
};

export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSetInput) => {
      const { error } = await supabase.rpc('update_set', {
        p_set_id: input.setId,
        p_reps: input.reps ?? undefined,
        p_weight_kg: input.weightKg ?? undefined,
        p_rpe: input.rpe ?? undefined,
        p_rir: input.rir ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workout-session-detail'] });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase.rpc('delete_set', { p_set_id: setId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workout-session-detail'] });
    },
  });
}

export function useFinishWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<FinishWorkoutSessionResult> => {
      const { data, error } = await supabase.rpc('finish_workout_session', { p_session_id: sessionId });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Antrenman bitirilemedi');
      return row;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-workout-session'] });
      void queryClient.invalidateQueries({ queryKey: ['workout-history'] });
    },
  });
}

export function useAbandonWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc('abandon_workout_session', { p_session_id: sessionId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-workout-session'] });
      void queryClient.invalidateQueries({ queryKey: ['workout-history'] });
    },
  });
}
