/**
 * Supabase MCP `generate_typescript_types` ile canlı şemadan üretildi.
 * ELLE DÜZENLENMEZ — migration eklendiğinde yeniden üretilir.
 *
 * Kaynak: proje aaufvndbagvkpbtqefee, migration 20260718120000 sonrası
 * (meal_entries/log_meal/water_logs/recipes/favorite_foods/
 * body_measurements/progress_photos/ai_jobs + MVP-09 job pipeline +
 * profiles.dashboard_layout (MVP-11) + daily_activity_metrics (MVP-12) dahil).
 *
 * `private.ai_jobs`/`ai_usage_ledger`/`ai_feature_flags` bilerek burada YOK —
 * Data API `private` şemasını yayınlamaz (bkz. supabase/config.toml
 * `api.schemas`), yalnız `create_ai_job`/`complete_ai_job`/`fail_ai_job`
 * RPC'leri (aşağıda, Functions altında) client'a açıktır.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      body_measurements: {
        Row: {
          arm_left_cm: number | null;
          arm_right_cm: number | null;
          body_fat_pct: number | null;
          calf_left_cm: number | null;
          calf_right_cm: number | null;
          chest_cm: number | null;
          created_at: string;
          deleted_at: string | null;
          forearm_left_cm: number | null;
          forearm_right_cm: number | null;
          height_cm: number | null;
          hip_cm: number | null;
          id: string;
          measured_at: string;
          muscle_mass_kg: number | null;
          neck_cm: number | null;
          notes: string | null;
          operation_id: string;
          shoulder_cm: number | null;
          source: string;
          thigh_left_cm: number | null;
          thigh_right_cm: number | null;
          updated_at: string;
          user_id: string;
          version: number;
          waist_cm: number | null;
          weight_kg: number | null;
        };
        Insert: {
          arm_left_cm?: number | null;
          arm_right_cm?: number | null;
          body_fat_pct?: number | null;
          calf_left_cm?: number | null;
          calf_right_cm?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          forearm_left_cm?: number | null;
          forearm_right_cm?: number | null;
          height_cm?: number | null;
          hip_cm?: number | null;
          id?: string;
          measured_at?: string;
          muscle_mass_kg?: number | null;
          neck_cm?: number | null;
          notes?: string | null;
          operation_id: string;
          shoulder_cm?: number | null;
          source?: string;
          thigh_left_cm?: number | null;
          thigh_right_cm?: number | null;
          updated_at?: string;
          user_id: string;
          version?: number;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          arm_left_cm?: number | null;
          arm_right_cm?: number | null;
          body_fat_pct?: number | null;
          calf_left_cm?: number | null;
          calf_right_cm?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          forearm_left_cm?: number | null;
          forearm_right_cm?: number | null;
          height_cm?: number | null;
          hip_cm?: number | null;
          id?: string;
          measured_at?: string;
          muscle_mass_kg?: number | null;
          neck_cm?: number | null;
          notes?: string | null;
          operation_id?: string;
          shoulder_cm?: number | null;
          source?: string;
          thigh_left_cm?: number | null;
          thigh_right_cm?: number | null;
          updated_at?: string;
          user_id?: string;
          version?: number;
          waist_cm?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      daily_activity_metrics: {
        Row: {
          active_energy_kcal: number | null;
          activity_date: string;
          created_at: string;
          id: string;
          platform_record_id: string | null;
          source: string;
          steps: number | null;
          synced_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active_energy_kcal?: number | null;
          activity_date: string;
          created_at?: string;
          id?: string;
          platform_record_id?: string | null;
          source: string;
          steps?: number | null;
          synced_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active_energy_kcal?: number | null;
          activity_date?: string;
          created_at?: string;
          id?: string;
          platform_record_id?: string | null;
          source?: string;
          steps?: number | null;
          synced_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
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
          dashboard_layout: Json;
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
          dashboard_layout?: Json;
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
          dashboard_layout?: Json;
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
      progress_photos: {
        Row: {
          angle: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          storage_path: string;
          taken_at: string;
          user_id: string;
        };
        Insert: {
          angle: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          storage_path: string;
          taken_at?: string;
          user_id: string;
        };
        Update: {
          angle?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          storage_path?: string;
          taken_at?: string;
          user_id?: string;
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
      complete_ai_job: {
        Args: {
          p_estimated_cost_usd: number;
          p_input_tokens: number;
          p_job_id: string;
          p_model: string;
          p_output_tokens: number;
          p_raw_response: Json;
        };
        Returns: undefined;
      };
      complete_ai_job_v2: {
        Args: {
          p_estimated_cost_usd: number;
          p_input_tokens: number;
          p_job_id: string;
          p_model: string;
          p_output_tokens: number;
          p_raw_response: Json;
          p_result_response: Json;
        };
        Returns: undefined;
      };
      create_ai_job: {
        Args: { p_operation_id: string; p_storage_path: string };
        Returns: {
          is_new: boolean;
          job_id: string;
          raw_response: Json;
          status: string;
        }[];
      };
      daily_activity_summary: {
        Args: { target_date: string };
        Returns: {
          active_energy_kcal: number;
          source: string;
          steps: number;
          synced_at: string;
        }[];
      };
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
      fail_ai_job: {
        Args: {
          p_error_message: string;
          p_estimated_cost_usd: number;
          p_input_tokens: number;
          p_job_id: string;
          p_model: string;
          p_output_tokens: number;
        };
        Returns: undefined;
      };
      fail_ai_job_v2: {
        Args: {
          p_error_code: string;
          p_error_message: string;
          p_estimated_cost_usd: number;
          p_input_tokens: number;
          p_job_id: string;
          p_model: string;
          p_output_tokens: number;
        };
        Returns: undefined;
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
      get_ai_job: {
        Args: { p_job_id: string };
        Returns: {
          correlation_id: string;
          created_at: string;
          error_code: string;
          error_message: string;
          job_id: string;
          result_response: Json;
          status: string;
          updated_at: string;
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
        Args: never;
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
      match_ai_food: {
        Args: { p_candidate_names: string[]; p_locale?: string };
        Returns: {
          carbs_g: number;
          energy_kcal: number;
          fat_g: number;
          fiber_g: number;
          food_id: string;
          food_version_id: string;
          match_score: number;
          matched_candidate: string;
          matched_locale: string;
          matched_name: string;
          protein_g: number;
          saturated_fat_g: number;
          sodium_mg: number;
          source_display_name: string;
          source_key: string;
          sugar_g: number;
        }[];
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
      weight_trend: {
        Args: { since_date?: string };
        Returns: {
          id: string;
          measured_at: string;
          source: string;
          weight_kg: number;
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
