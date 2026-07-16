export type { Database, Json } from './database';

import type { Database } from './database';

/** `profiles` satırı — onboarding ve hedef alanları dahil. */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Katalog erişimi yalnız RPC üzerinden (`public.search_foods`,
 * `public.food_detail`) — `catalog` şeması bilinçli olarak Data API'ye
 * açık değil (bkz. supabase/migrations/20260716010000_catalog_foods.sql).
 */
export type FoodSearchResult =
  Database['public']['Functions']['search_foods']['Returns'][number];
export type FoodDetail = Database['public']['Functions']['food_detail']['Returns'][number];

/**
 * Öğün kaydı. Yazma yolu `public.log_meal` RPC'sidir (§09 atomiklik) —
 * `meal_entries`/`meal_entry_items`/`meal_entry_snapshots` üzerinde Insert
 * tipleri bilinçli olarak kullanılmaz, istemci bu tablolara INSERT
 * yapamaz.
 *
 * `MealEntryItem` bir kalemin YA besin YA tarif kaynaklı olabileceğini
 * yansıtır (§09 `meal_entry_items_source_check`): `food_id`/
 * `food_version_id`/`quantity_grams` VEYA `recipe_id`/`recipe_version_id`/
 * `recipe_servings` dolu — ikisi birden değil.
 */
export type MealEntry = Database['public']['Tables']['meal_entries']['Row'];
export type MealEntryItem = Database['public']['Tables']['meal_entry_items']['Row'];
export type MealEntrySnapshot = Database['public']['Tables']['meal_entry_snapshots']['Row'];
export type DailyNutritionSummaryRow =
  Database['public']['Functions']['daily_nutrition_summary']['Returns'][number];

/**
 * Tarif kaydı. Yazma yolu `public.save_recipe` RPC'sidir (§09 atomiklik) —
 * `recipes`/`recipe_versions`/`recipe_items` üzerinde Insert tipleri
 * bilinçli olarak kullanılmaz.
 */
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeVersion = Database['public']['Tables']['recipe_versions']['Row'];
export type RecipeItem = Database['public']['Tables']['recipe_items']['Row'];
export type RecipeSummary = Database['public']['Functions']['list_recipes']['Returns'][number];
export type RecipeDetail = Database['public']['Functions']['recipe_detail']['Returns'][number];

/**
 * Favori besin. `meal_entries`/`recipes`'in aksine tek satırlık bir
 * yıldızlama — client `favorite_foods` üzerinde doğrudan INSERT/DELETE
 * yapar (§09 "yalnız zorunluysa" SECURITY DEFINER gerektirmez).
 */
export type FavoriteFood = Database['public']['Tables']['favorite_foods']['Row'];
export type FavoriteFoodSummary =
  Database['public']['Functions']['list_favorite_foods']['Returns'][number];

/**
 * Su kaydı. `log_meal`'in aksine tek tablo — client doğrudan INSERT
 * yapar (bkz. supabase/migrations/20260716194015_water_logs.sql), bu
 * yüzden `Insert` tipi de dışa açılır.
 */
export type WaterLog = Database['public']['Tables']['water_logs']['Row'];
export type WaterLogInsert = Database['public']['Tables']['water_logs']['Insert'];
export type DailyWaterSummaryRow =
  Database['public']['Functions']['daily_water_summary']['Returns'][number];
