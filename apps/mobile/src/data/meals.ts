import type { FoodDetail, FoodSearchResult } from '@calouch/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/auth/supabase';

/**
 * Öğün veri katmanı. §01: "Server state: TanStack Query."
 * Bu dosya apps/mobile içindedir (domain paketi değil) — Supabase erişimi
 * burada serbesttir.
 */

// ---------------------------------------------------------------------------
// Arama
// ---------------------------------------------------------------------------
export function useFoodSearch(query: string, locale: 'tr' | 'en') {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['food-search', trimmed, locale],
    queryFn: async (): Promise<FoodSearchResult[]> => {
      const { data, error } = await supabase.rpc('search_foods', {
        query: trimmed,
        only_locale: locale,
        limit_count: 20,
      });
      if (error) throw error;
      return data;
    },
    // Boş/çok kısa sorguda arama tetiklenmez — her tuşta gereksiz istek atmaz.
    enabled: trimmed.length >= 2,
  });
}

export function useFoodDetail(foodId: string | undefined) {
  return useQuery({
    queryKey: ['food-detail', foodId ?? ''],
    queryFn: async (): Promise<FoodDetail> => {
      const { data, error } = await supabase.rpc('food_detail', { target_food_id: foodId! });
      if (error) throw error;
      const row = data[0];
      if (row === undefined) throw new Error('Besin bulunamadı');
      return row;
    },
    enabled: foodId !== undefined,
  });
}

// ---------------------------------------------------------------------------
// Öğün kaydı
// ---------------------------------------------------------------------------
export type MealType =
  | 'breakfast'
  | 'snack'
  | 'lunch'
  | 'dinner'
  | 'pre_workout'
  | 'post_workout'
  | 'night'
  | 'custom';

/** Saatin gününe göre akla yatkın bir varsayılan öğün türü. */
export function defaultMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  if (hour < 22) return 'dinner';
  return 'night';
}

export type LogMealItem =
  | { kind: 'food'; foodId: string; quantityGrams: number; portionLabel?: string }
  | { kind: 'recipe'; recipeId: string; servings: number };

export type LogMealInput = {
  mealType: MealType;
  loggedAt: Date;
  items: LogMealItem[];
  customLabel?: string;
  notes?: string;
  /** AI kamera akışından gelen öğünün kalıcı fotoğraf referansı (varsa). */
  photoStoragePath?: string;
};

export function useLogMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogMealInput): Promise<string> => {
      // §03 "tekrar gönderim çift öğün üretmez": her deneme aynı
      // operation_id'yi taşır ki ağ hatası sonrası retry aynı sonucu döner.
      // Mutation'ın kendisi tek seferlik olduğu için burada üretiliyor —
      // React Query bu mutation'ı retry ETMEZ (varsayılan), yani gerçek
      // "kullanıcı tekrar dener" senaryosu manuel yeniden tetiklemedir ve
      // her manuel deneme YENİ bir operation_id alır. Tam offline outbox
      // (aynı operation_id'yi cihazda saklayıp bağlantı dönünce tekrar
      // deneme) bu dalganın kapsamı dışıdır (14-open-decisions.md).
      const operationId = Crypto.randomUUID();

      const { data, error } = await supabase.rpc('log_meal', {
        p_operation_id: operationId,
        p_meal_type: input.mealType,
        p_logged_at: input.loggedAt.toISOString(),
        // log_meal() kalem türünü `kind` alanından ayırır — bkz.
        // supabase/migrations/20260716194929_log_meal_recipes.sql.
        p_items: input.items.map((item) =>
          item.kind === 'recipe'
            ? { kind: 'recipe', recipeId: item.recipeId, servings: item.servings }
            : {
                kind: 'food',
                foodId: item.foodId,
                quantityGrams: item.quantityGrams,
                portionLabel: item.portionLabel,
              },
        ),
        p_custom_label: input.customLabel,
        p_notes: input.notes,
        p_photo_storage_path: input.photoStoragePath,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['daily-nutrition'] });
      void queryClient.invalidateQueries({ queryKey: ['meal-entries'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Günün özeti ve öğün listesi
// ---------------------------------------------------------------------------
export type DailyNutritionSummary = {
  mealCount: number;
  totalEnergyKcal: number | null;
  totalProteinG: number | null;
  totalCarbsG: number | null;
  totalFatG: number | null;
  totalFiberG: number | null;
  totalSodiumMg: number | null;
};

/** `YYYY-MM-DD` — Postgres `date` parametresi için. */
function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyNutritionSummary(date: Date) {
  const dateParam = toDateParam(date);

  return useQuery({
    queryKey: ['daily-nutrition', dateParam],
    queryFn: async (): Promise<DailyNutritionSummary> => {
      const { data, error } = await supabase.rpc('daily_nutrition_summary', {
        target_date: dateParam,
      });
      if (error) throw error;
      const row = data[0];
      return {
        mealCount: row?.meal_count ?? 0,
        totalEnergyKcal: row?.total_energy_kcal ?? null,
        totalProteinG: row?.total_protein_g ?? null,
        totalCarbsG: row?.total_carbs_g ?? null,
        totalFatG: row?.total_fat_g ?? null,
        totalFiberG: row?.total_fiber_g ?? null,
        totalSodiumMg: row?.total_sodium_mg ?? null,
      };
    },
  });
}

export type LoggedMealItem = { id: string; energyKcal: number } & (
  | { kind: 'food'; foodId: string; quantityGrams: number; portionLabel: string | null }
  | { kind: 'recipe'; recipeId: string; recipeName: string; servings: number }
);

export type LoggedMeal = {
  id: string;
  mealType: MealType;
  customLabel: string | null;
  loggedAt: string;
  items: LoggedMealItem[];
  photoStoragePath: string | null;
};

export function useTodaysMeals(date: Date) {
  const dateParam = toDateParam(date);

  return useQuery({
    queryKey: ['meal-entries', dateParam],
    queryFn: async (): Promise<LoggedMeal[]> => {
      // Gün aralığı client'ın yerel saat dilimine göre hesaplanır;
      // logged_at UTC saklanır, karşılaştırma için gün başı/sonu üretilir.
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('meal_entries')
        .select(
          `id, meal_type, custom_label, logged_at, photo_storage_path,
           meal_entry_items (
             id, food_id, quantity_grams, portion_label,
             recipe_id, recipe_servings, recipes ( name ),
             meal_entry_snapshots ( energy_kcal )
           )`,
        )
        .is('deleted_at', null)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;

      return data.map((meal) => ({
        id: meal.id,
        mealType: meal.meal_type as MealType,
        customLabel: meal.custom_label,
        loggedAt: meal.logged_at,
        photoStoragePath: meal.photo_storage_path,
        items: meal.meal_entry_items.map((item): LoggedMealItem => {
          // isOneToOne ilişki: supabase-js bunu tekil (nullable) nesne
          // olarak tipler, dizi değil.
          const energyKcal = item.meal_entry_snapshots?.energy_kcal ?? 0;

          if (item.recipe_id !== null) {
            return {
              id: item.id,
              kind: 'recipe',
              recipeId: item.recipe_id,
              recipeName: item.recipes?.name ?? '',
              servings: Number(item.recipe_servings),
              energyKcal,
            };
          }

          return {
            id: item.id,
            kind: 'food',
            foodId: item.food_id!,
            quantityGrams: Number(item.quantity_grams),
            portionLabel: item.portion_label,
            energyKcal,
          };
        }),
      }));
    },
  });
}
