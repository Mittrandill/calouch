/**
 * Supabase MCP `generate_typescript_types` ile canlı şemadan üretildi.
 * ELLE DÜZENLENMEZ — migration eklendiğinde yeniden üretilir.
 *
 * Kaynak: proje aaufvndbagvkpbtqefee, migration 20260716200459 sonrası
 * (meal_entries/log_meal/water_logs/recipes/favorite_foods dahil).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      favorite_foods: {
        Row: {
          created_at: string;
          food_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      meal_entries: {
        Row: {
          created_at: string;
          custom_label: string | null;
          deleted_at: string | null;
          id: string;
          logged_at: string;
          meal_type: string;
          notes: string | null;
          operation_id: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          custom_label?: string | null;
          deleted_at?: string | null;
          id?: string;
          logged_at?: string;
          meal_type: string;
          notes?: string | null;
          operation_id: string;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          custom_label?: string | null;
          deleted_at?: string | null;
          id?: string;
          logged_at?: string;
          meal_type?: string;
          notes?: string | null;
          operation_id?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      meal_entry_items: {
        Row: {
          created_at: string;
          food_id: string | null;
          food_version_id: string | null;
          id: string;
          meal_entry_id: string;
          portion_label: string | null;
          quantity_grams: number | null;
          recipe_id: string | null;
          recipe_servings: number | null;
          recipe_version_id: string | null;
        };
        Insert: {
          created_at?: string;
          food_id?: string | null;
          food_version_id?: string | null;
          id?: string;
          meal_entry_id: string;
          portion_label?: string | null;
          quantity_grams?: number | null;
          recipe_id?: string | null;
          recipe_servings?: number | null;
          recipe_version_id?: string | null;
        };
        Update: {
          created_at?: string;
          food_id?: string | null;
          food_version_id?: string | null;
          id?: string;
          meal_entry_id?: string;
          portion_label?: string | null;
          quantity_grams?: number | null;
          recipe_id?: string | null;
          recipe_servings?: number | null;
          recipe_version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_entry_items_meal_entry_id_fkey';
            columns: ['meal_entry_id'];
            isOneToOne: false;
            referencedRelation: 'meal_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_entry_items_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_entry_items_recipe_version_id_fkey';
            columns: ['recipe_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      meal_entry_snapshots: {
        Row: {
          carbs_g: number;
          created_at: string;
          energy_kcal: number;
          fat_g: number;
          fiber_g: number | null;
          food_version_id: string | null;
          id: string;
          meal_entry_item_id: string;
          micronutrients: Json;
          protein_g: number;
          saturated_fat_g: number | null;
          sodium_mg: number | null;
          sugar_g: number | null;
        };
        Insert: {
          carbs_g: number;
          created_at?: string;
          energy_kcal: number;
          fat_g: number;
          fiber_g?: number | null;
          food_version_id?: string | null;
          id?: string;
          meal_entry_item_id: string;
          micronutrients?: Json;
          protein_g: number;
          saturated_fat_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
        };
        Update: {
          carbs_g?: number;
          created_at?: string;
          energy_kcal?: number;
          fat_g?: number;
          fiber_g?: number | null;
          food_version_id?: string | null;
          id?: string;
          meal_entry_item_id?: string;
          micronutrients?: Json;
          protein_g?: number;
          saturated_fat_g?: number | null;
          sodium_mg?: number | null;
          sugar_g?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_entry_snapshots_meal_entry_item_id_fkey';
            columns: ['meal_entry_item_id'];
            isOneToOne: true;
            referencedRelation: 'meal_entry_items';
            referencedColumns: ['id'];
          },
        ];
      };
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
      recipe_items: {
        Row: {
          created_at: string;
          food_id: string;
          id: string;
          quantity_grams: number;
          recipe_version_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          id?: string;
          quantity_grams: number;
          recipe_version_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          id?: string;
          quantity_grams?: number;
          recipe_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_items_recipe_version_id_fkey';
            columns: ['recipe_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_versions: {
        Row: {
          created_at: string;
          id: string;
          operation_id: string;
          recipe_id: string;
          servings: number;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          operation_id: string;
          recipe_id: string;
          servings: number;
          version_number: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          operation_id?: string;
          recipe_id?: string;
          servings?: number;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_versions_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          current_version_id: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          current_version_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          current_version_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_current_version_id_fkey';
            columns: ['current_version_id'];
            isOneToOne: false;
            referencedRelation: 'recipe_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      water_logs: {
        Row: {
          amount_ml: number;
          created_at: string;
          deleted_at: string | null;
          id: string;
          logged_at: string;
          operation_id: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          amount_ml: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          logged_at?: string;
          operation_id: string;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          amount_ml?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          logged_at?: string;
          operation_id?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      daily_nutrition_summary: {
        Args: { target_date: string };
        Returns: {
          meal_count: number;
          total_carbs_g: number;
          total_energy_kcal: number;
          total_fat_g: number;
          total_fiber_g: number;
          total_protein_g: number;
          total_sodium_mg: number;
        }[];
      };
      daily_water_summary: {
        Args: { target_date: string };
        Returns: {
          last_amount_ml: number;
          log_count: number;
          total_ml: number;
        }[];
      };
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
      list_favorite_foods: {
        Args: { only_locale?: string };
        Returns: {
          brand_name: string;
          carbs_g: number;
          category: string;
          energy_kcal: number;
          fat_g: number;
          food_id: string;
          is_custom: boolean;
          matched_name: string;
          protein_g: number;
        }[];
      };
      list_recipes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          name: string;
          per_serving_energy_kcal: number;
          recipe_id: string;
          servings: number;
        }[];
      };
      log_meal: {
        Args: {
          p_custom_label?: string;
          p_items: Json;
          p_logged_at: string;
          p_meal_type: string;
          p_notes?: string;
          p_operation_id: string;
        };
        Returns: string;
      };
      recipe_detail: {
        Args: { target_recipe_id: string };
        Returns: {
          items: Json;
          name: string;
          per_serving_carbs_g: number;
          per_serving_energy_kcal: number;
          per_serving_fat_g: number;
          per_serving_protein_g: number;
          recipe_id: string;
          servings: number;
          version_number: number;
        }[];
      };
      save_recipe: {
        Args: {
          p_items: Json;
          p_name: string;
          p_operation_id: string;
          p_recipe_id?: string;
          p_servings: number;
        };
        Returns: string;
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
