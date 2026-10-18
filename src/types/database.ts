export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_call_gate: {
        Row: { last_call_at: string; requester_key: string }
        Insert: { last_call_at: string; requester_key: string }
        Update: { last_call_at?: string; requester_key?: string }
        Relationships: []
      }
      ai_builds: {
        Row: {
          anon_fingerprint: string | null
          created_at: string
          id: string
          plan: Json | null
          request: Json
          status: string
          turn_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anon_fingerprint?: string | null
          created_at?: string
          id?: string
          plan?: Json | null
          request: Json
          status?: string
          turn_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anon_fingerprint?: string | null
          created_at?: string
          id?: string
          plan?: Json | null
          request?: Json
          status?: string
          turn_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          anon_fingerprint: string | null
          build_session_id: string | null
          created_at: string
          id: string
          input_tokens: number | null
          model: string
          model_tier: string | null
          output_tokens: number | null
          provider: string
          step: string
          turn_number: number | null
          user_id: string | null
        }
        Insert: {
          anon_fingerprint?: string | null
          build_session_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          model: string
          model_tier?: string | null
          output_tokens?: number | null
          provider: string
          step: string
          turn_number?: number | null
          user_id?: string | null
        }
        Update: {
          anon_fingerprint?: string | null
          build_session_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          model?: string
          model_tier?: string | null
          output_tokens?: number | null
          provider?: string
          step?: string
          turn_number?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      constraint_profiles: {
        Row: {
          constraint_type: string
          contraindications: string[]
          created_at: string
          detail: string | null
          id: string
          priority_area: boolean
          rom_cap_degrees: number | null
          user_id: string
        }
        Insert: {
          constraint_type: string
          contraindications?: string[]
          created_at?: string
          detail?: string | null
          id?: string
          priority_area?: boolean
          rom_cap_degrees?: number | null
          user_id?: string
        }
        Update: {
          constraint_type?: string
          contraindications?: string[]
          created_at?: string
          detail?: string | null
          id?: string
          priority_area?: boolean
          rom_cap_degrees?: number | null
          user_id?: string
        }
        Relationships: []
      }
      constraint_requirements: {
        Row: {
          constraint_type: string
          exercise_id: string
          rationale: string
        }
        Insert: {
          constraint_type: string
          exercise_id: string
          rationale: string
        }
        Update: {
          constraint_type?: string
          exercise_id?: string
          rationale?: string
        }
        Relationships: [
          {
            foreignKeyName: "constraint_requirements_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          equipment: string | null
          force: string | null
          id: string
          images: string[]
          instructions: string[]
          level: string
          mechanic: string | null
          movement_pattern: string | null
          name: string
          popularity: number
          primary_muscles: string[]
          search_vector: unknown
          secondary_muscles: string[]
          source: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          equipment?: string | null
          force?: string | null
          id: string
          images?: string[]
          instructions?: string[]
          level: string
          mechanic?: string | null
          movement_pattern?: string | null
          name: string
          popularity?: number
          primary_muscles?: string[]
          search_vector?: unknown
          secondary_muscles?: string[]
          source?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          equipment?: string | null
          force?: string | null
          id?: string
          images?: string[]
          instructions?: string[]
          level?: string
          mechanic?: string | null
          movement_pattern?: string | null
          name?: string
          popularity?: number
          primary_muscles?: string[]
          search_vector?: unknown
          secondary_muscles?: string[]
          source?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          exercise_id: string | null
          exercise_name: string
          id: string
          record_type: string
          session_id: string | null
          set_on: string
          user_id: string
          value: number
        }
        Insert: {
          exercise_id?: string | null
          exercise_name: string
          id?: string
          record_type: string
          session_id?: string | null
          set_on: string
          user_id: string
          value: number
        }
        Update: {
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          record_type?: string
          session_id?: string | null
          set_on?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          block_type: string
          duration_secs: number | null
          exercise_id: string | null
          exercise_name: string
          id: string
          is_pr: boolean | null
          is_timed: boolean | null
          logged_at: string | null
          reps: number | null
          rpe: number | null
          session_id: string | null
          set_number: number
          side: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          block_type?: string
          duration_secs?: number | null
          exercise_id?: string | null
          exercise_name: string
          id?: string
          is_pr?: boolean | null
          is_timed?: boolean | null
          logged_at?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number: number
          side?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          block_type?: string
          duration_secs?: number | null
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          is_pr?: boolean | null
          is_timed?: boolean | null
          logged_at?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number?: number
          side?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_workout_date: string | null
          longest_streak: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          plan: string
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          plan?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          plan?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      substitution_rules: {
        Row: {
          action: string
          constraint_type: string
          created_at: string
          exercise_id: string
          id: string
          rationale: string
          safe_alternative_id: string | null
          source: string | null
          updated_at: string
          warning: string
        }
        Insert: {
          action: string
          constraint_type: string
          created_at?: string
          exercise_id: string
          id?: string
          rationale: string
          safe_alternative_id?: string | null
          source?: string | null
          updated_at?: string
          warning: string
        }
        Update: {
          action?: string
          constraint_type?: string
          created_at?: string
          exercise_id?: string
          id?: string
          rationale?: string
          safe_alternative_id?: string | null
          source?: string | null
          updated_at?: string
          warning?: string
        }
        Relationships: [
          {
            foreignKeyName: "substitution_rules_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_rules_safe_alternative_id_fkey"
            columns: ["safe_alternative_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          age: number | null
          created_at: string | null
          equipment: string[]
          experience_level: string | null
          goal: string | null
          height_cm: number | null
          id: string
          name: string | null
          onboarded_at: string | null
          profile_data: Json
          role: string
          session_minutes: number | null
          sex: string | null
          starting_weight_kg: number | null
          training_days_per_week: number | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          equipment?: string[]
          experience_level?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          onboarded_at?: string | null
          profile_data?: Json
          role?: string
          session_minutes?: number | null
          sex?: string | null
          starting_weight_kg?: number | null
          training_days_per_week?: number | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          equipment?: string[]
          experience_level?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          onboarded_at?: string | null
          profile_data?: Json
          role?: string
          session_minutes?: number | null
          sex?: string | null
          starting_weight_kg?: number | null
          training_days_per_week?: number | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_schedule: {
        Row: {
          day_of_week: number
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          day_of_week: number
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Update: {
          day_of_week?: number
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_schedule_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          alternative_exercise_ids: string[]
          created_at: string
          display_name: string | null
          default_weight_kg: number
          duration_secs: number | null
          exercise_id: string
          id: string
          is_assistance: boolean
          is_mandatory: boolean
          is_timed: boolean
          is_unilateral: boolean
          notes: string
          order_index: number
          reps: string
          rest_secs: number
          sets: number
          updated_at: string
          user_id: string
          volume_type: string
          workout_id: string
        }
        Insert: {
          alternative_exercise_ids?: string[]
          created_at?: string
          display_name?: string | null
          default_weight_kg?: number
          duration_secs?: number | null
          exercise_id: string
          id?: string
          is_assistance?: boolean
          is_mandatory?: boolean
          is_timed?: boolean
          is_unilateral?: boolean
          notes?: string
          order_index: number
          reps: string
          rest_secs?: number
          sets: number
          updated_at?: string
          user_id?: string
          volume_type?: string
          workout_id: string
        }
        Update: {
          alternative_exercise_ids?: string[]
          created_at?: string
          display_name?: string | null
          default_weight_kg?: number
          duration_secs?: number | null
          exercise_id?: string
          id?: string
          is_assistance?: boolean
          is_mandatory?: boolean
          is_timed?: boolean
          is_unilateral?: boolean
          notes?: string
          order_index?: number
          reps?: string
          rest_secs?: number
          sets?: number
          updated_at?: string
          user_id?: string
          volume_type?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_user_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          date: string
          day_type: string | null
          duration_min: number | null
          id: string
          post_mood_energy: number | null
          post_mood_workout: number | null
          readiness_energy: number | null
          readiness_protein: number | null
          readiness_sleep: number | null
          readiness_soreness: number | null
          status: string | null
          total_volume_kg: number | null
          user_id: string
          wellness_score: number | null
          workout_id: string | null
          workout_name: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          date: string
          day_type?: string | null
          duration_min?: number | null
          id?: string
          post_mood_energy?: number | null
          post_mood_workout?: number | null
          readiness_energy?: number | null
          readiness_protein?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          status?: string | null
          total_volume_kg?: number | null
          user_id: string
          wellness_score?: number | null
          workout_id?: string | null
          workout_name?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          date?: string
          day_type?: string | null
          duration_min?: number | null
          id?: string
          post_mood_energy?: number | null
          post_mood_workout?: number | null
          readiness_energy?: number | null
          readiness_protein?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          status?: string | null
          total_volume_kg?: number | null
          user_id?: string
          wellness_score?: number | null
          workout_id?: string | null
          workout_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          focus: string
          id: string
          name: string
          protocol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          focus?: string
          id?: string
          name: string
          protocol: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          focus?: string
          id?: string
          name?: string
          protocol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_ai_call_slot: {
        Args: { p_cooldown_secs: number; p_requester_key: string }
        Returns: number
      }
      delete_workout_session: { Args: { p_session_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      replace_workout_exercises: {
        Args: { p_items: Json; p_workout_id: string }
        Returns: undefined
      }
      save_coach_plan: {
        Args: {
          p_days: Json
          p_replace_workout_ids: string[]
          p_take_over_days: boolean
        }
        Returns: {
          day_of_week: number
          is_scheduled: boolean
          workout_id: string
        }[]
      }
      search_exercises: {
        Args: {
          p_category?: string
          p_equipment?: string
          p_level?: string
          p_limit?: number
          p_mechanic?: string
          p_muscle?: string
          p_offset?: number
          p_query?: string
        }
        Returns: {
          category: string
          equipment: string | null
          force: string | null
          id: string
          images: string[]
          instructions: string[]
          level: string
          mechanic: string | null
          movement_pattern: string | null
          name: string
          popularity: number
          primary_muscles: string[]
          search_vector: unknown
          secondary_muscles: string[]
          source: string
        }[]
        SetofOptions: {
          from: "*"
          to: "exercises"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
