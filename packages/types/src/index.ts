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
