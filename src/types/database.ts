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
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_attachments: {
        Row: {
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_at: string | null
        }
        Insert: {
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          uploaded_at?: string | null
        }
        Update: {
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          admin_notes: string | null
          client_name: string
          created_at: string | null
          deal_stage: string | null
          deal_type: string
          deal_value: number
          developer_name: string
          developer_sales_name: string
          developer_sales_phone: string
          downpayment_percentage: number
          id: string
          payment_plan_years: number
          project_name: string
          status: string | null
          unit_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          client_name: string
          created_at?: string | null
          deal_stage?: string | null
          deal_type: string
          deal_value: number
          developer_name: string
          developer_sales_name: string
          developer_sales_phone: string
          downpayment_percentage: number
          id?: string
          payment_plan_years: number
          project_name: string
          status?: string | null
          unit_code: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          client_name?: string
          created_at?: string | null
          deal_stage?: string | null
          deal_type?: string
          deal_value?: number
          developer_name?: string
          developer_sales_name?: string
          developer_sales_phone?: string
          downpayment_percentage?: number
          id?: string
          payment_plan_years?: number
          project_name?: string
          status?: string | null
          unit_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      lead_batches: {
        Row: {
          batch_name: string
          cpl_price: number
          created_at: string | null
          error_details: Json | null
          failed_leads: number
          file_name: string | null
          file_url: string | null
          id: string
          project_id: string
          status: string | null
          successful_leads: number
          total_leads: number
          updated_at: string | null
          upload_user_id: string
        }
        Insert: {
          batch_name: string
          cpl_price: number
          created_at?: string | null
          error_details?: Json | null
          failed_leads?: number
          file_name?: string | null
          file_url?: string | null
          id?: string
          project_id: string
          status?: string | null
          successful_leads?: number
          total_leads?: number
          updated_at?: string | null
          upload_user_id: string
        }
        Update: {
          batch_name?: string
          cpl_price?: number
          created_at?: string | null
          error_details?: Json | null
          failed_leads?: number
          file_name?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
          status?: string | null
          successful_leads?: number
          total_leads?: number
          updated_at?: string | null
          upload_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_batches_upload_user_id_fkey"
            columns: ["upload_user_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_batches_upload_user_id_fkey"
            columns: ["upload_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_purchase_requests: {
        Row: {
          admin_notes: string | null
          admin_user_id: string | null
          approved_at: string | null
          buyer_user_id: string
          cpl_price: number
          created_at: string | null
          id: string
          number_of_leads: number
          project_id: string
          receipt_file_name: string | null
          receipt_file_url: string | null
          rejected_at: string | null
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_user_id?: string | null
          approved_at?: string | null
          buyer_user_id: string
          cpl_price: number
          created_at?: string | null
          id?: string
          number_of_leads: number
          project_id: string
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          rejected_at?: string | null
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_user_id?: string | null
          approved_at?: string | null
          buyer_user_id?: string
          cpl_price?: number
          created_at?: string | null
          id?: string
          number_of_leads?: number
          project_id?: string
          receipt_file_name?: string | null
          receipt_file_url?: string | null
          rejected_at?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchase_requests_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_purchase_requests_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_purchase_requests_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_purchase_requests_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_purchase_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sales: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          purchase_request_id: string
          sale_price: number
          sold_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          purchase_request_id: string
          sale_price: number
          sold_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          purchase_request_id?: string
          sale_price?: number
          sold_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_sales_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "lead_purchase_requests"
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
          stage: Database["public"]["Enums"]["lead_stage"]
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
          stage?: Database["public"]["Enums"]["lead_stage"]
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
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string | null
          upload_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_upload_user_id_fkey"
            columns: ["upload_user_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_upload_user_id_fkey"
            columns: ["upload_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          payment_reference?: string | null
          project_id: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          payment_reference?: string | null
          project_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code_hash: string
          created_at: string | null
          expires_at: string
          id: string
          is_signup: boolean | null
          max_attempts: number | null
          phone: string
          signup_data: Json | null
          used_at: string | null
        }
        Insert: {
          attempts?: number | null
          code_hash: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_signup?: boolean | null
          max_attempts?: number | null
          phone: string
          signup_data?: Json | null
          used_at?: string | null
        }
        Update: {
          attempts?: number | null
          code_hash?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_signup?: boolean | null
          max_attempts?: number | null
          phone?: string
          signup_data?: Json | null
          used_at?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          commission_rate: number
          created_at: string | null
          description: string | null
          id: string
          logo_path: string | null
          name: string
          status: Database["public"]["Enums"]["partner_status"] | null
          website: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          status?: Database["public"]["Enums"]["partner_status"] | null
          website?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          status?: Database["public"]["Enums"]["partner_status"] | null
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
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_banned: boolean | null
          manager_id: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_banned?: boolean | null
          manager_id?: string | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_banned?: boolean | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_partner_commissions: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partner_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          available_leads: number | null
          created_at: string | null
          description: string | null
          developer: string
          developer_id: string | null
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
          developer_id?: string | null
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
          developer_id?: string | null
          id?: string
          name?: string
          price_per_lead?: number
          region?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
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
      sale_mate_inventory: {
        Row: {
          area: string | null
          building_number: string | null
          compound: Json | null
          created_at: string | null
          currency: string | null
          developer: Json | null
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
          phase: Json | null
          price_in_egp: number | null
          price_per_meter: number | null
          property_type: Json | null
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
          compound?: Json | null
          created_at?: string | null
          currency?: string | null
          developer?: Json | null
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
          phase?: Json | null
          price_in_egp?: number | null
          price_per_meter?: number | null
          property_type?: Json | null
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
          compound?: Json | null
          created_at?: string | null
          currency?: string | null
          developer?: Json | null
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
          phase?: Json | null
          price_in_egp?: number | null
          price_per_meter?: number | null
          property_type?: Json | null
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
          priority: Database["public"]["Enums"]["priority_level"] | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lead_analytics_mv: {
        Row: {
          call_back: number | null
          conversion_rate: number | null
          hot_leads: number | null
          joined_at: string | null
          last_updated: string | null
          manager_id: string | null
          meeting_done: number | null
          name: string | null
          new_leads: number | null
          no_answer: number | null
          non_potential: number | null
          potential_leads: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_leads: number | null
          total_orders: number | null
          total_spent: number | null
          user_id: string | null
          whatsapp: number | null
          wrong_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_mv"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_purchase_request: {
        Args: { admin_id: string; admin_notes?: string; request_id: string }
        Returns: Json
      }
      bulk_upload_leads_with_cpl: {
        Args: {
          batch_name?: string
          cpl_price: number
          leads_data: Json
          project_id_param: string
          upload_user_id: string
        }
        Returns: Json
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_otp: {
        Args: { is_signup?: boolean; phone_number: string; signup_data?: Json }
        Returns: Json
      }
      generate_otp_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_marketplace_projects: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_leads: number
          avg_cpl_price: number
          description: string
          developer_name: string
          max_cpl_price: number
          min_cpl_price: number
          project_id: string
          project_name: string
          region: string
        }[]
      }
      get_project_commissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          commission_rate: number
          developer_name: string
          partner_id: string
          partner_name: string
          project_id: string
          project_name: string
        }[]
      }
      hash_otp_code: {
        Args: { code: string }
        Returns: string
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      reject_purchase_request: {
        Args: { admin_id: string; admin_notes?: string; request_id: string }
        Returns: Json
      }
      rpc_add_user_to_team: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      rpc_assign_lead: {
        Args: { assignee_id: string; lead_id: string }
        Returns: boolean
      }
      rpc_calculate_order_total: {
        Args: { project_id: string; quantity: number }
        Returns: Json
      }
      rpc_confirm_order: {
        Args: { order_id: string; payment_reference: string }
        Returns: Json
      }
      rpc_fail_order: {
        Args: { order_id: string; reason: string }
        Returns: Json
      }
      rpc_get_project_availability: {
        Args: { project_id: string }
        Returns: Json
      }
      rpc_get_shop_projects: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_leads: number | null
          created_at: string | null
          description: string | null
          developer: string
          developer_id: string | null
          id: string
          name: string
          price_per_lead: number
          region: string
          updated_at: string | null
        }[]
      }
      rpc_leads_stats: {
        Args: { for_user: string }
        Returns: Json
      }
      rpc_project_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_reassign_lead: {
        Args: { lead_id: string; to_user_id: string }
        Returns: Json
      }
      rpc_start_order: {
        Args: {
          payment_method: string
          project_id: string
          quantity: number
          user_id: string
        }
        Returns: Json
      }
      rpc_team_user_ids: {
        Args: { root: string }
        Returns: {
          user_id: string
        }[]
      }
      rpc_unassign_lead: {
        Args: { lead_id: string }
        Returns: boolean
      }
      rpc_update_project_cpl: {
        Args: { new_price_per_lead: number; project_id: string }
        Returns: Json
      }
      rpc_update_project_leads: {
        Args: { new_available_leads: number; project_id: string }
        Returns: Json
      }
      rpc_upload_leads: {
        Args: { leads_data: Json[]; project_id: string }
        Returns: Json
      }
      update_project_cpl_price: {
        Args: { new_cpl_price: number; project_id_param: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      verify_otp: {
        Args: { input_code: string; phone_number: string }
        Returns: Json
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
      order_status: "pending" | "confirmed" | "failed"
      partner_status: "active" | "inactive"
      payment_method_type: "Instapay" | "VodafoneCash" | "BankTransfer"
      platform_type: "Facebook" | "Google" | "TikTok" | "Other"
      priority_level: "low" | "medium" | "high"
      support_status: "open" | "in_progress" | "resolved"
      user_role: "admin" | "manager" | "support" | "user"
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
      order_status: ["pending", "confirmed", "failed"],
      partner_status: ["active", "inactive"],
      payment_method_type: ["Instapay", "VodafoneCash", "BankTransfer"],
      platform_type: ["Facebook", "Google", "TikTok", "Other"],
      priority_level: ["low", "medium", "high"],
      support_status: ["open", "in_progress", "resolved"],
      user_role: ["admin", "manager", "support", "user"],
    },
  },
} as const
