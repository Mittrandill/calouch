import type { ProgramDetail, ProgramSummary } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/auth/supabase';

/**
 * Program veri katmanı. `recipes.ts` ile aynı iskelet (versiyonlu,
 * `operation_id` idempotent) — bkz.
 * supabase/migrations/20260720161500_program_functions.sql.
 */

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async (): Promise<ProgramSummary[]> => {
      const { data, error } = await supabase.rpc('list_programs');
      if (error) throw error;
      return data;
    },
  });
}

export function useProgramDetail(programId: string | undefined, locale: 'tr' | 'en') {
  return useQuery({
    queryKey: ['program-detail', programId ?? '', locale],
    queryFn: async (): Promise<ProgramDetail> => {
      const { data, error } = await supabase.rpc('program_detail', {
        target_program_id: programId!,
        preferred_locale: locale,
      });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Program bulunamadı');
      return row;
    },
    enabled: programId !== undefined,
  });
}

/** target_sets jsonb şekli — bkz. 20260720161000_programs.sql. */
export type SaveProgramTargetSet = {
  setNumber: number;
  targetReps: number | null;
  targetWeightKg: number | null;
  isWarmup: boolean;
  isDropset: boolean;
  restSeconds: number | null;
};

export type SaveProgramExercise = {
  exerciseId: string;
  orderIndex: number;
  supersetGroup?: number | null;
  notes?: string | null;
  targetSets: SaveProgramTargetSet[];
};

export type SaveProgramDay = {
  weekNumber: number;
  dayIndex: number;
  name: string;
  isDeload?: boolean;
  exercises: SaveProgramExercise[];
};

export type SaveProgramInput = {
  /** Doluysa var olan (sahip olunan) programa yeni sürüm eklenir. */
  programId?: string;
  name: string;
  weeks: number;
  days: SaveProgramDay[];
};

export function useSaveProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveProgramInput): Promise<string> => {
      const operationId = Crypto.randomUUID();

      const { data, error } = await supabase.rpc('save_program', {
        p_operation_id: operationId,
        p_name: input.name,
        p_weeks: input.weeks,
        p_days: input.days,
        p_program_id: input.programId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (programId) => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] });
      void queryClient.invalidateQueries({ queryKey: ['program-detail', programId] });
    },
  });
}

export function useCopyProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceProgramId: string): Promise<string> => {
      const operationId = Crypto.randomUUID();
      const { data, error } = await supabase.rpc('copy_program', {
        p_operation_id: operationId,
        p_source_program_id: sourceProgramId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
