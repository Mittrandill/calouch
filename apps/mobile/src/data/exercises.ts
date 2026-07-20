import type { ExerciseDetail, ExerciseSearchResult } from '@calouch/types';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/auth/supabase';

/**
 * Egzersiz kataloğu veri katmanı. `meals.ts`'teki `useFoodSearch`/
 * `useFoodDetail` ile aynı iskelet — bkz.
 * supabase/migrations/20260720160000_exercise_catalog.sql.
 */

export type ExerciseSearchFilters = {
  muscleGroup?: string;
  equipment?: string;
};

export function useExerciseSearch(
  query: string,
  locale: 'tr' | 'en',
  filters: ExerciseSearchFilters = {},
) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['exercise-search', trimmed, locale, filters.muscleGroup ?? '', filters.equipment ?? ''],
    queryFn: async (): Promise<ExerciseSearchResult[]> => {
      const { data, error } = await supabase.rpc('search_exercises', {
        query: trimmed,
        only_locale: locale,
        muscle_group: filters.muscleGroup,
        equipment_filter: filters.equipment,
        limit_count: 50,
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useExerciseDetail(exerciseId: string | undefined, locale: 'tr' | 'en') {
  return useQuery({
    queryKey: ['exercise-detail', exerciseId ?? '', locale],
    queryFn: async (): Promise<ExerciseDetail> => {
      const { data, error } = await supabase.rpc('exercise_detail', {
        target_exercise_id: exerciseId!,
        preferred_locale: locale,
      });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Egzersiz bulunamadı');
      return row;
    },
    enabled: exerciseId !== undefined,
  });
}
