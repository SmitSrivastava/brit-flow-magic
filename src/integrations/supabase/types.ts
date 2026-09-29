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
      britannia_portfolio: {
        Row: {
          brand: string
          category: string
          created_at: string
          flavours: string | null
          id: number
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          flavours?: string | null
          id?: number
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          flavours?: string | null
          id?: number
        }
        Relationships: []
      }
      flavours_global: {
        Row: {
          advocacy: number | null
          consumption_intent: number | null
          conv_growth: number | null
          conv_volume: string | null
          created_at: string
          diy: number | null
          eng_growth: number | null
          eng_volume: string | null
          flavor: string
          id: number
          social_shareability: number | null
          trend: string | null
        }
        Insert: {
          advocacy?: number | null
          consumption_intent?: number | null
          conv_growth?: number | null
          conv_volume?: string | null
          created_at?: string
          diy?: number | null
          eng_growth?: number | null
          eng_volume?: string | null
          flavor: string
          id?: number
          social_shareability?: number | null
          trend?: string | null
        }
        Update: {
          advocacy?: number | null
          consumption_intent?: number | null
          conv_growth?: number | null
          conv_volume?: string | null
          created_at?: string
          diy?: number | null
          eng_growth?: number | null
          eng_volume?: string | null
          flavor?: string
          id?: number
          social_shareability?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      flavours_india: {
        Row: {
          advocacy: number | null
          consumption_intent: number | null
          conv_growth: number | null
          conv_volume: string | null
          created_at: string
          diy: number | null
          eng_growth: number | null
          eng_volume: string | null
          flavor: string
          gifting: number | null
          health_indulgence: number | null
          id: number
          shareability: number | null
          trend: string | null
        }
        Insert: {
          advocacy?: number | null
          consumption_intent?: number | null
          conv_growth?: number | null
          conv_volume?: string | null
          created_at?: string
          diy?: number | null
          eng_growth?: number | null
          eng_volume?: string | null
          flavor: string
          gifting?: number | null
          health_indulgence?: number | null
          id?: number
          shareability?: number | null
          trend?: string | null
        }
        Update: {
          advocacy?: number | null
          consumption_intent?: number | null
          conv_growth?: number | null
          conv_volume?: string | null
          created_at?: string
          diy?: number | null
          eng_growth?: number | null
          eng_volume?: string | null
          flavor?: string
          gifting?: number | null
          health_indulgence?: number | null
          id?: number
          shareability?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      fpd_volumes: {
        Row: {
          base_brand: string
          created_at: string
          id: number
          volume: number
        }
        Insert: {
          base_brand: string
          created_at?: string
          id?: number
          volume: number
        }
        Update: {
          base_brand?: string
          created_at?: string
          id?: number
          volume?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
