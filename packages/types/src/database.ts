/**
 * Supabase MCP `generate_typescript_types` ile canlı şemadan üretildi.
 * ELLE DÜZENLENMEZ — migration eklendiğinde yeniden üretilir.
 *
 * Kaynak: proje aaufvndbagvkpbtqefee, migration 20260716000001 sonrası.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          activity_level: string | null;
          biological_sex: string;
          birth_year: number | null;
          bmr_kcal: number | null;
          carbs_g: number | null;
          created_at: string;
          diet_preference: string | null;
          display_name: string | null;
          fat_g: number | null;
          fiber_g: number | null;
          goal_formula_version: string | null;
          goal_overrides: Json;
          goal_warnings: string[];
          goals_calculated_at: string | null;
          goals_confidence: string | null;
          height_cm: number | null;
          id: string;
          locale: string;
          meals_per_day: number | null;
          onboarding_completed_at: string | null;
          primary_goal: string | null;
          protein_g: number | null;
          target_calories_kcal: number | null;
          target_weight_kg: number | null;
          tdee_kcal: number | null;
          theme_preference: string;
          unit_system: string;
          updated_at: string;
          water_ml: number | null;
          weekly_change_kg: number | null;
          weight_kg: number | null;
        };
        Insert: {
          activity_level?: string | null;
          biological_sex?: string;
          birth_year?: number | null;
          bmr_kcal?: number | null;
          carbs_g?: number | null;
          created_at?: string;
          diet_preference?: string | null;
          display_name?: string | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          goal_formula_version?: string | null;
          goal_overrides?: Json;
          goal_warnings?: string[];
          goals_calculated_at?: string | null;
          goals_confidence?: string | null;
          height_cm?: number | null;
          id: string;
          locale?: string;
          meals_per_day?: number | null;
          onboarding_completed_at?: string | null;
          primary_goal?: string | null;
          protein_g?: number | null;
          target_calories_kcal?: number | null;
          target_weight_kg?: number | null;
          tdee_kcal?: number | null;
          theme_preference?: string;
          unit_system?: string;
          updated_at?: string;
          water_ml?: number | null;
          weekly_change_kg?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          activity_level?: string | null;
          biological_sex?: string;
          birth_year?: number | null;
          bmr_kcal?: number | null;
          carbs_g?: number | null;
          created_at?: string;
          diet_preference?: string | null;
          display_name?: string | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          goal_formula_version?: string | null;
          goal_overrides?: Json;
          goal_warnings?: string[];
          goals_calculated_at?: string | null;
          goals_confidence?: string | null;
          height_cm?: number | null;
          id?: string;
          locale?: string;
          meals_per_day?: number | null;
          onboarding_completed_at?: string | null;
          primary_goal?: string | null;
          protein_g?: number | null;
          target_calories_kcal?: number | null;
          target_weight_kg?: number | null;
          tdee_kcal?: number | null;
          theme_preference?: string;
          unit_system?: string;
          updated_at?: string;
          water_ml?: number | null;
          weekly_change_kg?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      food_detail: {
        Args: { target_food_id: string };
        Returns: {
          brand_name: string;
          carbs_g: number;
          category: string;
          country_code: string;
          energy_kcal: number;
          fat_g: number;
          fiber_g: number;
          food_id: string;
          is_custom: boolean;
          micronutrients: Json;
          name_en: string;
          name_tr: string;
          portions: Json;
          protein_g: number;
          saturated_fat_g: number;
          sodium_mg: number;
          sugar_g: number;
        }[];
      };
      search_foods: {
        Args: { limit_count?: number; only_locale?: string; query: string };
        Returns: {
          brand_name: string;
          carbs_g: number;
          category: string;
          energy_kcal: number;
          fat_g: number;
          food_id: string;
          is_custom: boolean;
          match_score: number;
          matched_locale: string;
          matched_name: string;
          protein_g: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
