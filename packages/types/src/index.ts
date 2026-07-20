export type { Database, Json } from './database';
export type {
  AIJob,
  AIJobStatus,
  AIProvider,
  CatalogFoodMatch,
  CatalogNutrientSnapshot,
  ConfidenceLevel,
  MealAnalysis,
  MealAnalysisItem,
  MealDraft,
  MealDraftItem,
  NutrientEstimateRange,
} from './ai';

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

/**
 * Vücut ölçümü. `water_logs` ile aynı desen — client doğrudan INSERT
 * yapar, `Insert` tipi dışa açılır.
 */
export type BodyMeasurement = Database['public']['Tables']['body_measurements']['Row'];
export type BodyMeasurementInsert = Database['public']['Tables']['body_measurements']['Insert'];
export type WeightTrendRow = Database['public']['Functions']['weight_trend']['Returns'][number];

/**
 * Günlük adım/aktif enerji (§17). `water_logs` ile aynı desen — client
 * doğrudan `.upsert()` yapar, `Insert` tipi dışa açılır. Sunucudaki
 * `unique(user_id, activity_date, source)` yeniden sync'i idempotent kılar.
 */
export type DailyActivityMetric = Database['public']['Tables']['daily_activity_metrics']['Row'];
export type DailyActivityMetricInsert =
  Database['public']['Tables']['daily_activity_metrics']['Insert'];
export type DailyActivitySummaryRow =
  Database['public']['Functions']['daily_activity_summary']['Returns'][number];

/**
 * İlerleme fotoğrafı METADATASI — ikili veri `progress-photos` private
 * bucket'ında, bu yalnız storage_path/açı/tarih taşır. Görüntüleme
 * `supabase.storage.from('progress-photos').createSignedUrl(storage_path, ...)`
 * ile yapılır (§05 "public URL yoktur").
 */
export type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row'];
export type ProgressPhotoInsert = Database['public']['Tables']['progress_photos']['Insert'];

/**
 * Egzersiz kataloğu erişimi yalnız RPC üzerinden (`public.search_exercises`,
 * `public.exercise_detail`) — `catalog` şeması burada da (foods gibi)
 * bilinçli olarak Data API'ye açık değil.
 */
export type ExerciseSearchResult =
  Database['public']['Functions']['search_exercises']['Returns'][number];
export type ExerciseDetail = Database['public']['Functions']['exercise_detail']['Returns'][number];

/**
 * Antrenman programı. Yazma yolu `public.save_program`/`public.copy_program`
 * RPC'leridir (§09 atomiklik) — `programs`/`program_versions`/
 * `program_days`/`program_exercises` üzerinde Insert tipleri bilinçli
 * olarak kullanılmaz.
 */
export type Program = Database['public']['Tables']['programs']['Row'];
export type ProgramVersion = Database['public']['Tables']['program_versions']['Row'];
export type ProgramDay = Database['public']['Tables']['program_days']['Row'];
export type ProgramExerciseRow = Database['public']['Tables']['program_exercises']['Row'];
export type ProgramSummary = Database['public']['Functions']['list_programs']['Returns'][number];
export type ProgramDetail = Database['public']['Functions']['program_detail']['Returns'][number];

/**
 * Canlı antrenman session/set. Yazma yolu `start_workout_session`/
 * `complete_set`/`update_set`/`delete_set`/`finish_workout_session`/
 * `abandon_workout_session` RPC'leridir — meal_entries ile aynı gerekçeyle
 * `workout_sessions`/`workout_sets`/`personal_records` üzerinde Insert/Update
 * tipleri bilinçli olarak kullanılmaz (client bu tablolara hiç yazamaz).
 */
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'];
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row'];
export type ActiveWorkoutSession =
  Database['public']['Functions']['active_workout_session']['Returns'][number];
export type WorkoutSessionSummary =
  Database['public']['Functions']['list_workout_sessions']['Returns'][number];
export type WorkoutSessionDetail =
  Database['public']['Functions']['workout_session_detail']['Returns'][number];
export type FinishWorkoutSessionResult =
  Database['public']['Functions']['finish_workout_session']['Returns'][number];
