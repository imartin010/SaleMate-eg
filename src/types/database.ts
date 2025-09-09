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
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_batches: {
        Row: {
          batch_name: string
          cpl_price: number | null
          created_at: string | null
          failed_leads: number | null
          id: string
          project_id: string
          status: string | null
          successful_leads: number | null
          total_leads: number | null
          updated_at: string | null
          upload_user_id: string
        }
        Insert: {
          batch_name: string
          cpl_price?: number | null
          created_at?: string | null
          failed_leads?: number | null
          id?: string
          project_id: string
          status?: string | null
          successful_leads?: number | null
          total_leads?: number | null
          updated_at?: string | null
          upload_user_id: string
        }
        Update: {
          batch_name?: string
          cpl_price?: number | null
          created_at?: string | null
          failed_leads?: number | null
          id?: string
          project_id?: string
          status?: string | null
          successful_leads?: number | null
          total_leads?: number | null
          updated_at?: string | null
          upload_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "lead_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to_id: string | null
          batch_id: string | null
          buyer_user_id: string | null
          client_email: string | null
          client_job_title: string | null
          client_name: string
          client_phone: string
          client_phone2: string | null
          client_phone3: string | null
          cpl_price: number | null
          created_at: string | null
          feedback: string | null
          id: string
          is_sold: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          project_id: string
          sold_at: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"] | null
          updated_at: string | null
          upload_user_id: string | null
        }
        Insert: {
          assigned_to_id?: string | null
          batch_id?: string | null
          buyer_user_id?: string | null
          client_email?: string | null
          client_job_title?: string | null
          client_name: string
          client_phone: string
          client_phone2?: string | null
          client_phone3?: string | null
          cpl_price?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_sold?: boolean | null
          platform: Database["public"]["Enums"]["platform_type"]
          project_id: string
          sold_at?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          updated_at?: string | null
          upload_user_id?: string | null
        }
        Update: {
          assigned_to_id?: string | null
          batch_id?: string | null
          buyer_user_id?: string | null
          client_email?: string | null
          client_job_title?: string | null
          client_name?: string
          client_phone?: string
          client_phone2?: string | null
          client_phone3?: string | null
          cpl_price?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          is_sold?: boolean | null
          platform?: Database["public"]["Enums"]["platform_type"]
          project_id?: string
          sold_at?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          updated_at?: string | null
          upload_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          payment_reference: string | null
          project_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          payment_reference?: string | null
          project_id: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          payment_reference?: string | null
          project_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          logo_path: string | null
          name: string
          status: Database["public"]["Enums"]["partner_status"] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          status?: Database["public"]["Enums"]["partner_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          status?: Database["public"]["Enums"]["partner_status"] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_banned: boolean
          manager_id: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_banned?: boolean
          manager_id?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_banned?: boolean
          manager_id?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          available_leads: number | null
          created_at: string | null
          description: string | null
          developer: string
          id: string
          name: string
          price_per_lead: number
          region: string
          updated_at: string | null
        }
        Insert: {
          available_leads?: number | null
          created_at?: string | null
          description?: string | null
          developer: string
          id?: string
          name: string
          price_per_lead: number
          region: string
          updated_at?: string | null
        }
        Update: {
          available_leads?: number | null
          created_at?: string | null
          description?: string | null
          developer?: string
          id?: string
          name?: string
          price_per_lead?: number
          region?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      "salemate-inventory": {
        Row: {
          area: string | null
          building_number: string | null
          compound: string | null
          created_at: string | null
          currency: string | null
          developer: string | null
          finishing: string | null
          floor_number: number | null
          garden_area: number | null
          id: number
          image: string | null
          is_launch: boolean | null
          last_inventory_update: string | null
          number_of_bathrooms: number | null
          number_of_bedrooms: number | null
          offers: string | null
          original_unit_id: string | null
          payment_plans: string | null
          phase: string | null
          price_in_egp: number | null
          price_per_meter: number | null
          property_type: string | null
          ready_by: string | null
          roof_area: number | null
          sale_type: string | null
          unit_area: number | null
          unit_id: string | null
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          building_number?: string | null
          compound?: string | null
          created_at?: string | null
          currency?: string | null
          developer?: string | null
          finishing?: string | null
          floor_number?: number | null
          garden_area?: number | null
          id: number
          image?: string | null
          is_launch?: boolean | null
          last_inventory_update?: string | null
          number_of_bathrooms?: number | null
          number_of_bedrooms?: number | null
          offers?: string | null
          original_unit_id?: string | null
          payment_plans?: string | null
          phase?: string | null
          price_in_egp?: number | null
          price_per_meter?: number | null
          property_type?: string | null
          ready_by?: string | null
          roof_area?: number | null
          sale_type?: string | null
          unit_area?: number | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          building_number?: string | null
          compound?: string | null
          created_at?: string | null
          currency?: string | null
          developer?: string | null
          finishing?: string | null
          floor_number?: number | null
          garden_area?: number | null
          id?: number
          image?: string | null
          is_launch?: boolean | null
          last_inventory_update?: string | null
          number_of_bathrooms?: number | null
          number_of_bedrooms?: number | null
          offers?: string | null
          original_unit_id?: string | null
          payment_plans?: string | null
          phase?: string | null
          price_in_egp?: number | null
          price_per_meter?: number | null
          property_type?: string | null
          ready_by?: string | null
          roof_area?: number | null
          sale_type?: string | null
          unit_area?: number | null
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_cases: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["support_case_priority"] | null
          status: Database["public"]["Enums"]["support_case_status"] | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["support_case_priority"] | null
          status?: Database["public"]["Enums"]["support_case_status"] | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["support_case_priority"] | null
          status?: Database["public"]["Enums"]["support_case_status"] | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      lead_analytics_mv: {
        Row: {
          available_leads: number | null
          avg_cpl_price: number | null
          project_id: string | null
          project_name: string | null
          region: string | null
          sold_leads: number | null
          total_leads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_leads_to_user: {
        Args: { project_id: string; quantity: number; user_id: string }
        Returns: Json
      }
      backfill_profiles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      convert_python_dict_to_json: {
        Args: { input_text: string }
        Returns: Json
      }
      rpc_team_user_ids: {
        Args: { root_user_id: string }
        Returns: {
          user_id: string
        }[]
      }
      update_project_lead_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      lead_stage:
        | "New Lead"
        | "Potential"
        | "Hot Case"
        | "Meeting Done"
        | "No Answer"
        | "Call Back"
        | "Whatsapp"
        | "Wrong Number"
        | "Non Potential"
      order_status: "pending" | "confirmed" | "failed" | "cancelled"
      partner_status: "active" | "inactive" | "pending"
      payment_method_type: "Instapay" | "VodafoneCash" | "BankTransfer"
      platform_type: "Facebook" | "Google" | "TikTok" | "Other"
      support_case_priority: "low" | "medium" | "high" | "urgent"
      support_case_status: "open" | "in_progress" | "resolved" | "closed"
      user_role: "admin" | "support" | "manager" | "user"
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
      lead_stage: [
        "New Lead",
        "Potential",
        "Hot Case",
        "Meeting Done",
        "No Answer",
        "Call Back",
        "Whatsapp",
        "Wrong Number",
        "Non Potential",
      ],
      order_status: ["pending", "confirmed", "failed", "cancelled"],
      partner_status: ["active", "inactive", "pending"],
      payment_method_type: ["Instapay", "VodafoneCash", "BankTransfer"],
      platform_type: ["Facebook", "Google", "TikTok", "Other"],
      support_case_priority: ["low", "medium", "high", "urgent"],
      support_case_status: ["open", "in_progress", "resolved", "closed"],
      user_role: ["admin", "support", "manager", "user"],
    },
  },
} as const
