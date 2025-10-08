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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          attended: boolean | null
          booking_date: string
          class_id: string | null
          created_at: string
          id: string
          manual_schedule_id: string | null
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          booking_date: string
          class_id?: string | null
          created_at?: string
          id?: string
          manual_schedule_id?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          booking_date?: string
          class_id?: string | null
          created_at?: string
          id?: string
          manual_schedule_id?: string | null
          profile_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_manual_schedule_id_fkey"
            columns: ["manual_schedule_id"]
            isOneToOne: false
            referencedRelation: "manual_class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_exceptions: {
        Row: {
          class_id: string
          created_at: string | null
          created_by: string
          exception_date: string
          id: string
          is_cancelled: boolean | null
          migrate_bookings: boolean | null
          notes: string | null
          override_end_time: string | null
          override_instructor: string | null
          override_max_students: number | null
          override_start_time: string | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          created_by: string
          exception_date: string
          id?: string
          is_cancelled?: boolean | null
          migrate_bookings?: boolean | null
          notes?: string | null
          override_end_time?: string | null
          override_instructor?: string | null
          override_max_students?: number | null
          override_start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          created_by?: string
          exception_date?: string
          id?: string
          is_cancelled?: boolean | null
          migrate_bookings?: boolean | null
          notes?: string | null
          override_end_time?: string | null
          override_instructor?: string | null
          override_max_students?: number | null
          override_start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_exceptions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_instructors: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_name: string
          specific_date: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_name: string
          specific_date?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_name?: string
          specific_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_instructors_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          day_of_week: number
          description: string | null
          end_time: string
          id: string
          instructor: string | null
          is_active: boolean
          max_students: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          end_time: string
          id?: string
          instructor?: string | null
          is_active?: boolean
          max_students?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          end_time?: string
          id?: string
          instructor?: string | null
          is_active?: boolean
          max_students?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      manual_class_schedules: {
        Row: {
          class_date: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          instructor_name: string
          is_enabled: boolean
          max_students: number
          notes: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          class_date: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          instructor_name: string
          is_enabled?: boolean
          max_students?: number
          notes?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          class_date?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          instructor_name?: string
          is_enabled?: boolean
          max_students?: number
          notes?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          is_reregistration?: boolean | null
          last_name: string
          phone: string
          previous_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          is_reregistration?: boolean | null
          last_name?: string
          phone?: string
          previous_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_overrides: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_override: string | null
          is_enabled: boolean
          notes: string | null
          override_date: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_override?: string | null
          is_enabled?: boolean
          notes?: string | null
          override_date: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_override?: string | null
          is_enabled?: boolean
          notes?: string | null
          override_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_overrides_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monthly_classes: {
        Row: {
          created_at: string
          id: string
          max_monthly_classes: number
          month: number
          remaining_classes: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_monthly_classes?: number
          month: number
          remaining_classes?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          max_monthly_classes?: number
          month?: number
          remaining_classes?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_schedule_override: {
        Args: {
          instructor_name?: string
          notes?: string
          target_class_id: string
          target_date: string
        }
        Returns: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_override: string | null
          is_enabled: boolean
          notes: string | null
          override_date: string
          updated_at: string
        }
      }
      admin_advance_all_to_next_month: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: number
          remaining_classes: number
          user_id: string
          year: number
        }[]
      }
      admin_approve_user: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
      }
      admin_deactivate_user: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
      }
      admin_delete_user_completely: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      admin_expel_user: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
      }
      admin_get_monthly_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_remaining: number
          current_month: number
          current_year: number
          total_users: number
          users_with_classes: number
          users_without_classes: number
        }[]
      }
      admin_reactivate_user: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
      }
      admin_reject_user: {
        Args: { target_user_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_reregistration: boolean | null
          last_name: string
          phone: string
          previous_status: string | null
          updated_at: string
          user_id: string
        }
      }
      admin_reset_user_monthly_classes: {
        Args: { new_remaining?: number; target_user_id: string }
        Returns: {
          created_at: string
          id: string
          max_monthly_classes: number
          month: number
          remaining_classes: number
          updated_at: string
          user_id: string
          year: number
        }
      }
      admin_update_attendance: {
        Args: { attendance_status: boolean; booking_uuid: string }
        Returns: {
          attended: boolean | null
          booking_date: string
          class_id: string | null
          created_at: string
          id: string
          manual_schedule_id: string | null
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
      }
      admin_update_user_classes: {
        Args: { class_change: number; target_user_id: string }
        Returns: {
          created_at: string
          id: string
          max_monthly_classes: number
          month: number
          remaining_classes: number
          updated_at: string
          user_id: string
          year: number
        }
      }
      admin_update_user_monthly_limits: {
        Args: {
          new_max?: number
          new_remaining?: number
          target_user_id: string
        }
        Returns: {
          created_at: string
          id: string
          max_monthly_classes: number
          month: number
          remaining_classes: number
          updated_at: string
          user_id: string
          year: number
        }
      }
      book_manual_schedule: {
        Args:
          | {
              p_booking_date: string
              p_manual_schedule_id: string
              p_user_id: string
            }
          | { p_manual_schedule_id: string; p_user_id: string }
        Returns: {
          attended: boolean | null
          booking_date: string
          class_id: string | null
          created_at: string
          id: string
          manual_schedule_id: string | null
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
      }
      create_class_exception: {
        Args: {
          p_class_id: string
          p_exception_date: string
          p_is_cancelled?: boolean
          p_migrate_bookings?: boolean
          p_notes?: string
          p_override_end_time?: string
          p_override_instructor?: string
          p_override_max_students?: number
          p_override_start_time?: string
        }
        Returns: Json
      }
      create_manual_class_schedule: {
        Args: {
          p_class_date: string
          p_end_time: string
          p_instructor_name: string
          p_is_enabled?: boolean
          p_max_students?: number
          p_notes?: string
          p_start_time: string
          p_title: string
        }
        Returns: {
          class_date: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          instructor_name: string
          is_enabled: boolean
          max_students: number
          notes: string | null
          start_time: string
          title: string
          updated_at: string
        }
      }
      delete_class_exception: {
        Args: { p_exception_id: string }
        Returns: boolean
      }
      delete_manual_class_schedule: {
        Args: { schedule_id: string }
        Returns: boolean
      }
      delete_periodic_class: {
        Args: { target_class_id: string }
        Returns: boolean
      }
      disable_schedule_class: {
        Args: { notes?: string; target_class_id: string; target_date: string }
        Returns: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_override: string | null
          is_enabled: boolean
          notes: string | null
          override_date: string
          updated_at: string
        }
      }
      get_available_classes_for_date_range: {
        Args: { end_date: string; start_date: string }
        Returns: {
          class_date: string
          current_bookings: number
          end_time: string
          id: string
          instructor_name: string
          is_enabled: boolean
          max_students: number
          notes: string
          start_time: string
          title: string
        }[]
      }
      get_booking_counts: {
        Args: { _dates: string[] }
        Returns: {
          booking_date: string
          class_id: string
          count: number
        }[]
      }
      get_class_schedule_for_date: {
        Args: { target_date: string }
        Returns: {
          class_id: string
          day_of_week: number
          end_time: string
          exception_id: string
          instructor: string
          is_active: boolean
          is_cancelled: boolean
          is_exception: boolean
          is_special_day: boolean
          max_students: number
          override_notes: string
          start_time: string
          title: string
        }[]
      }
      get_manual_schedules_for_booking: {
        Args: { end_date: string; start_date: string }
        Returns: {
          class_date: string
          current_bookings: number
          end_time: string
          id: string
          instructor_name: string
          is_enabled: boolean
          max_students: number
          notes: string
          start_time: string
          title: string
        }[]
      }
      get_or_create_monthly_classes: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          id: string
          max_monthly_classes: number
          month: number
          remaining_classes: number
          updated_at: string
          user_id: string
          year: number
        }
      }
      get_schedule_with_exceptions: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          class_id: string
          day_of_week: number
          end_time: string
          exception_date: string
          exception_id: string
          instructor: string
          is_cancelled: boolean
          is_exception: boolean
          max_students: number
          notes: string
          start_time: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_specific_trainer: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_active: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
      set_class_instructor: {
        Args: {
          instructor_name: string
          specific_date?: string
          target_class_id: string
        }
        Returns: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_name: string
          specific_date: string | null
          updated_at: string
        }
      }
      set_schedule_override: {
        Args: {
          instructor_override?: string
          is_enabled: boolean
          notes?: string
          target_class_id: string
          target_date: string
        }
        Returns: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          instructor_override: string | null
          is_enabled: boolean
          notes: string | null
          override_date: string
          updated_at: string
        }
      }
      toggle_manual_class_schedule: {
        Args: {
          p_class_date: string
          p_end_time: string
          p_is_enabled: boolean
          p_notes?: string
          p_start_time: string
        }
        Returns: {
          class_date: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          instructor_name: string
          is_enabled: boolean
          max_students: number
          notes: string | null
          start_time: string
          title: string
          updated_at: string
        }
      }
      trainer_can_view_user_profile: {
        Args: { target_user_id: string; trainer_id: string }
        Returns: boolean
      }
      trainer_get_all_bookings: {
        Args: Record<PropertyKey, never>
        Returns: {
          attended: boolean
          booking_date: string
          class_day_of_week: number
          class_end_time: string
          class_id: string
          class_instructor: string
          class_start_time: string
          class_title: string
          created_at: string
          has_classes_available: boolean
          id: string
          manual_class_date: string
          manual_end_time: string
          manual_instructor_name: string
          manual_schedule_id: string
          manual_start_time: string
          manual_title: string
          profile_first_name: string
          profile_last_name: string
          status: string
          user_id: string
        }[]
      }
      trainer_get_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          first_name: string
          last_name: string
          user_id: string
        }[]
      }
      trainer_update_attendance: {
        Args: { attendance_status: boolean; booking_uuid: string }
        Returns: {
          attended: boolean | null
          booking_date: string
          class_id: string | null
          created_at: string
          id: string
          manual_schedule_id: string | null
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
      }
      verify_profiles_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_command: string
          policy_name: string
          policy_qual: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "trainer"
      approval_status: "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "trainer"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
