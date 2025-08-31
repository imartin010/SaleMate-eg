export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
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
          }
        ]
      }
      deals: {
        Row: {
          id: string
          user_id: string
          deal_type: "EOI" | "Reservation" | "Contract"
          project_name: string
          developer_name: string
          client_name: string
          unit_code: string
          developer_sales_name: string
          developer_sales_phone: string
          deal_value: number
          downpayment_percentage: number
          payment_plan_years: number
          deal_stage: "Reservation" | "Contracted" | "Collected" | "Ready to payout"
          status: "pending" | "approved" | "rejected"
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deal_type: "EOI" | "Reservation" | "Contract"
          project_name: string
          developer_name: string
          client_name: string
          unit_code: string
          developer_sales_name: string
          developer_sales_phone: string
          deal_value: number
          downpayment_percentage: number
          payment_plan_years: number
          deal_stage?: "Reservation" | "Contracted" | "Collected" | "Ready to payout"
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deal_type?: "EOI" | "Reservation" | "Contract"
          project_name?: string
          developer_name?: string
          client_name?: string
          unit_code?: string
          developer_sales_name?: string
          developer_sales_phone?: string
          deal_value?: number
          downpayment_percentage?: number
          payment_plan_years?: number
          deal_stage?: "Reservation" | "Contracted" | "Collected" | "Ready to payout"
          status?: "pending" | "approved" | "rejected"
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      deal_attachments: {
        Row: {
          id: string
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          project_id: string
          buyer_user_id: string | null
          client_name: string
          client_phone: string
          client_email: string | null
          platform: "Facebook" | "Google" | "TikTok" | "Other"
          stage: "New Lead" | "Potential" | "Hot Case" | "Meeting Done" | "No Answer" | "Call Back" | "Whatsapp" | "Wrong Number" | "Non Potential"
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          buyer_user_id?: string | null
          client_name: string
          client_phone: string
          client_email?: string | null
          platform: "Facebook" | "Google" | "TikTok" | "Other"
          stage?: "New Lead" | "Potential" | "Hot Case" | "Meeting Done" | "No Answer" | "Call Back" | "Whatsapp" | "Wrong Number" | "Non Potential"
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          buyer_user_id?: string | null
          client_name?: string
          client_phone?: string
          client_email?: string | null
          platform?: "Facebook" | "Google" | "TikTok" | "Other"
          stage?: "New Lead" | "Potential" | "Hot Case" | "Meeting Done" | "No Answer" | "Call Back" | "Whatsapp" | "Wrong Number" | "Non Potential"
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
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
          }
        ]
      }
      lead_analytics_mv: {
        Row: {
          user_id: string
          name: string
          role: "admin" | "manager" | "support" | "user"
          manager_id: string | null
          total_leads: number
          new_leads: number
          potential_leads: number
          hot_leads: number
          meeting_done: number
          no_answer: number
          call_back: number
          whatsapp: number
          wrong_number: number
          non_potential: number
          conversion_rate: number
          total_orders: number
          total_spent: number
          joined_at: string
          last_updated: string
        }
        Insert: {
          user_id: string
          name: string
          role: "admin" | "manager" | "support" | "user"
          manager_id?: string | null
          total_leads: number
          new_leads: number
          potential_leads: number
          hot_leads: number
          meeting_done: number
          no_answer: number
          call_back: number
          whatsapp: number
          wrong_number: number
          non_potential: number
          conversion_rate: number
          total_orders: number
          total_spent: number
          joined_at: string
          last_updated: string
        }
        Update: {
          user_id?: string
          name?: string
          role?: "admin" | "manager" | "support" | "user"
          manager_id?: string | null
          total_leads?: number
          new_leads?: number
          potential_leads?: number
          hot_leads?: number
          meeting_done?: number
          no_answer?: number
          call_back?: number
          whatsapp?: number
          wrong_number?: number
          non_potential?: number
          conversion_rate?: number
          total_orders?: number
          total_spent?: number
          joined_at?: string
          last_updated?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          project_id: string
          quantity: number
          payment_method: "Instapay" | "VodafoneCash" | "BankTransfer"
          status: "pending" | "confirmed" | "failed"
          total_amount: number
          payment_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          quantity: number
          payment_method: "Instapay" | "VodafoneCash" | "BankTransfer"
          status?: "pending" | "confirmed" | "failed"
          total_amount: number
          payment_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          quantity?: number
          payment_method?: "Instapay" | "VodafoneCash" | "BankTransfer"
          status?: "pending" | "confirmed" | "failed"
          total_amount?: number
          payment_reference?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      partners: {
        Row: {
          id: string
          name: string
          description: string | null
          commission_rate: number
          logo_path: string | null
          website: string | null
          status: "active" | "inactive"
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          commission_rate: number
          logo_path?: string | null
          website?: string | null
          status?: "active" | "inactive"
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          commission_rate?: number
          logo_path?: string | null
          website?: string | null
          status?: "active" | "inactive"
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: "admin" | "manager" | "support" | "user"
          manager_id: string | null
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: "admin" | "manager" | "support" | "user"
          manager_id?: string | null
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: "admin" | "manager" | "support" | "user"
          manager_id?: string | null
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          developer: string
          region: string
          available_leads: number
          price_per_lead: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          developer: string
          region: string
          available_leads?: number
          price_per_lead: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          developer?: string
          region?: string
          available_leads?: number
          price_per_lead?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      support_cases: {
        Row: {
          id: string
          created_by: string
          assigned_to: string | null
          subject: string
          description: string
          status: "open" | "in_progress" | "resolved"
          priority: "low" | "medium" | "high"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          assigned_to?: string | null
          subject: string
          description: string
          status?: "open" | "in_progress" | "resolved"
          priority?: "low" | "medium" | "high"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          assigned_to?: string | null
          subject?: string
          description?: string
          status?: "open" | "in_progress" | "resolved"
          priority?: "low" | "medium" | "high"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rpc_assign_leads: {
        Args: {
          action: string
          lead_ids?: string[]
          project_id?: string
          to_user_id?: string
          from_user_id?: string
          quantity?: number
          filters?: Json
        }
        Returns: Json
      }
      rpc_confirm_order: {
        Args: {
          order_id: string
          payment_reference: string
        }
        Returns: Json
      }
      rpc_fail_order: {
        Args: {
          order_id: string
          reason: string
        }
        Returns: Json
      }
      rpc_leads_stats: {
        Args: {
          for_user: string
        }
        Returns: Json
      }
      rpc_reassign_lead: {
        Args: {
          lead_id: string
          to_user_id: string
        }
        Returns: Json
      }
      rpc_start_order: {
        Args: {
          user_id: string
          project_id: string
          quantity: number
          payment_method: string
        }
        Returns: Json
      }
      rpc_team_user_ids: {
        Args: {
          manager_id: string
        }
        Returns: string[]
      }
    }
    Enums: {
      lead_stage: "New Lead" | "Potential" | "Hot Case" | "Meeting Done" | "No Answer" | "Call Back" | "Whatsapp" | "Wrong Number" | "Non Potential"
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

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type Lead = Tables<'leads'>
export type Order = Tables<'orders'>
export type SupportCase = Tables<'support_cases'>
export type Partner = Tables<'partners'>
export type Post = Tables<'posts'>
export type Comment = Tables<'comments'>
export type RecentActivity = Tables<'recent_activity'>
export type LeadAnalytics = Tables<'lead_analytics_mv'>

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type LeadStage = Database['public']['Enums']['lead_stage']
export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentMethod = Database['public']['Enums']['payment_method_type']
export type Platform = Database['public']['Enums']['platform_type']
export type SupportStatus = Database['public']['Enums']['support_status']
export type PriorityLevel = Database['public']['Enums']['priority_level']
export type PartnerStatus = Database['public']['Enums']['partner_status']

// RPC function types
export type RpcStartOrderArgs = {
  user_id: string
  project_id: string
  quantity: number
  payment_method: string
}

export type RpcConfirmOrderArgs = {
  order_id: string
  payment_reference: string
}

export type RpcFailOrderArgs = {
  order_id: string
  reason: string
}

export type RpcReassignLeadArgs = {
  lead_id: string
  to_user_id: string
}

export type RpcLeadsStatsArgs = {
  for_user: string
}

export type RpcTeamUserIdsArgs = {
  manager_id: string
}

// Response types for RPC functions
export type RpcStartOrderResponse = {
  order_id: string
  total_amount: number
  status: string
}

export type RpcConfirmOrderResponse = {
  order_id: string
  status: string
  leads_assigned: number
  payment_reference: string
}

export type RpcFailOrderResponse = {
  order_id: string
  status: string
  reason: string
}

export type RpcReassignLeadResponse = {
  lead_id: string
  new_owner_id: string
  status: string
}

export type RpcLeadsStatsResponse = {
  total_leads: number
  new_leads: number
  potential_leads: number
  hot_leads: number
  meeting_done: number
  no_answer: number
  call_back: number
  whatsapp: number
  wrong_number: number
  non_potential: number
  conversion_rate: number
}

export type RpcTeamUserIdsResponse = string[]
