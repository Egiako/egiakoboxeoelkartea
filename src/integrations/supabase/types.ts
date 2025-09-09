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
          class_id: string
          created_at: string
          id: string
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          booking_date: string
          class_id: string
          created_at?: string
          id?: string
          profile_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          booking_date?: string
          class_id?: string
          created_at?: string
          id?: string
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
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          class_id: string
          created_at: string
          id: string
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
      get_booking_counts: {
        Args: { _dates: string[] }
        Returns: {
          booking_date: string
          class_id: string
          count: number
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
      trainer_update_attendance: {
        Args: { attendance_status: boolean; booking_uuid: string }
        Returns: {
          attended: boolean | null
          booking_date: string
          class_id: string
          created_at: string
          id: string
          profile_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
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
