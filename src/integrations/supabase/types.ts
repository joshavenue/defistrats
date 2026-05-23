export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          page_path: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          page_path: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          page_path?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_requests: {
        Row: {
          email: string
          full_name: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          email: string
          full_name: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_secret: boolean | null
          key_name: string
          key_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key_name: string
          key_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key_name?: string
          key_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      apy_tvl_configs: {
        Row: {
          apy_context_after: string | null
          apy_context_before: string | null
          apy_decimals: number | null
          apy_field_name: string
          apy_text_pattern: string | null
          asset_id: string
          created_at: string | null
          id: string
          is_active: boolean
          last_scraped_at: string | null
          scraping_interval_hours: number
          target_asset1: string
          target_website: string
          tvl_context_after: string | null
          tvl_context_before: string | null
          tvl_field_name: string
          tvl_suffix: string | null
          tvl_text_pattern: string | null
          updated_at: string | null
          wait_delay_seconds: number | null
        }
        Insert: {
          apy_context_after?: string | null
          apy_context_before?: string | null
          apy_decimals?: number | null
          apy_field_name?: string
          apy_text_pattern?: string | null
          asset_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_interval_hours?: number
          target_asset1: string
          target_website: string
          tvl_context_after?: string | null
          tvl_context_before?: string | null
          tvl_field_name?: string
          tvl_suffix?: string | null
          tvl_text_pattern?: string | null
          updated_at?: string | null
          wait_delay_seconds?: number | null
        }
        Update: {
          apy_context_after?: string | null
          apy_context_before?: string | null
          apy_decimals?: number | null
          apy_field_name?: string
          apy_text_pattern?: string | null
          asset_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_interval_hours?: number
          target_asset1?: string
          target_website?: string
          tvl_context_after?: string | null
          tvl_context_before?: string | null
          tvl_field_name?: string
          tvl_suffix?: string | null
          tvl_text_pattern?: string | null
          updated_at?: string | null
          wait_delay_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apy_tvl_configs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "staking_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          order_index: number | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          order_index?: number | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          link_type: string
          link_url: string
          page_path: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          link_type: string
          link_url: string
          page_path: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          link_type?: string
          link_url?: string
          page_path?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          is_superadmin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          is_superadmin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_superadmin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      scraper_configs: {
        Row: {
          apy_selector: string | null
          asset_id: string
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          scraping_interval_hours: number
          target_website: string
          tvl_selector: string | null
          updated_at: string
        }
        Insert: {
          apy_selector?: string | null
          asset_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_interval_hours?: number
          target_website: string
          tvl_selector?: string | null
          updated_at?: string
        }
        Update: {
          apy_selector?: string | null
          asset_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          scraping_interval_hours?: number
          target_website?: string
          tvl_selector?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraper_configs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "staking_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_logs: {
        Row: {
          asset_id: string
          created_at: string
          error_message: string | null
          id: string
          new_value: number | null
          old_value: number | null
          scraped_at: string
          scraping_type: string
          success: boolean
        }
        Insert: {
          asset_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          scraped_at?: string
          scraping_type: string
          success?: boolean
        }
        Update: {
          asset_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          new_value?: number | null
          old_value?: number | null
          scraped_at?: string
          scraping_type?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "scraper_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "staking_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      staking_assets: {
        Row: {
          apy: number
          asset: string
          asset1_logo: string | null
          asset1_name: string | null
          asset2_logo: string | null
          asset2_name: string | null
          audited_by: string | null
          chain: string | null
          created_at: string
          cta_link: string | null
          description: string | null
          earn: string[] | null
          featured: boolean
          id: string
          logo: string
          points: string | null
          price: number
          protocol: string
          reward_program: string | null
          risk_level: string | null
          status: string
          strategy_action: string | null
          strategy_description: string | null
          strategy_type: string | null
          symbol: string
          tvl: number | null
          updated_at: string
          video_guide: string | null
        }
        Insert: {
          apy: number
          asset: string
          asset1_logo?: string | null
          asset1_name?: string | null
          asset2_logo?: string | null
          asset2_name?: string | null
          audited_by?: string | null
          chain?: string | null
          created_at?: string
          cta_link?: string | null
          description?: string | null
          earn?: string[] | null
          featured?: boolean
          id?: string
          logo: string
          points?: string | null
          price: number
          protocol: string
          reward_program?: string | null
          risk_level?: string | null
          status?: string
          strategy_action?: string | null
          strategy_description?: string | null
          strategy_type?: string | null
          symbol: string
          tvl?: number | null
          updated_at?: string
          video_guide?: string | null
        }
        Update: {
          apy?: number
          asset?: string
          asset1_logo?: string | null
          asset1_name?: string | null
          asset2_logo?: string | null
          asset2_name?: string | null
          audited_by?: string | null
          chain?: string | null
          created_at?: string
          cta_link?: string | null
          description?: string | null
          earn?: string[] | null
          featured?: boolean
          id?: string
          logo?: string
          points?: string | null
          price?: number
          protocol?: string
          reward_program?: string | null
          risk_level?: string | null
          status?: string
          strategy_action?: string | null
          strategy_description?: string | null
          strategy_type?: string | null
          symbol?: string
          tvl?: number | null
          updated_at?: string
          video_guide?: string | null
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
    Enums: {},
  },
} as const
