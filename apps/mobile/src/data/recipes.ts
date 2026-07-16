import type { RecipeDetail, RecipeSummary } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/auth/supabase';

/**
 * Tarif veri katmanı. §03 "Tarifler". Yazma yolu `public.save_recipe`
 * RPC'sidir (§09 atomiklik) — bkz.
 * supabase/migrations/20260716194900_recipe_functions.sql.
 */

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async (): Promise<RecipeSummary[]> => {
      const { data, error } = await supabase.rpc('list_recipes');
      if (error) throw error;
      return data;
    },
  });
}

export function useRecipeDetail(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe-detail', recipeId ?? ''],
    queryFn: async (): Promise<RecipeDetail> => {
      const { data, error } = await supabase.rpc('recipe_detail', { target_recipe_id: recipeId! });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Tarif bulunamadı');
      return row;
    },
    enabled: recipeId !== undefined,
  });
}

export type SaveRecipeItem = { foodId: string; quantityGrams: number };

export type SaveRecipeInput = {
  /** Doluysa var olan (sahip olunan) tarife yeni sürüm eklenir. */
  recipeId?: string;
  name: string;
  servings: number;
  items: SaveRecipeItem[];
};

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveRecipeInput): Promise<string> => {
      // §03 "tekrar gönderim çift kayıt üretmez" — bkz. recipe_functions.sql.
      const operationId = Crypto.randomUUID();

      const { data, error } = await supabase.rpc('save_recipe', {
        p_operation_id: operationId,
        p_name: input.name,
        p_servings: input.servings,
        p_items: input.items.map((item) => ({
          foodId: item.foodId,
          quantityGrams: item.quantityGrams,
        })),
        p_recipe_id: input.recipeId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (recipeId) => {
      void queryClient.invalidateQueries({ queryKey: ['recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] });
    },
  });
}
