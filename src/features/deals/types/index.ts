export type DealType = 'EOI' | 'Reservation' | 'Contract';
export type DealStage = 'Reservation' | 'Contracted' | 'Collected' | 'Ready to payout';
export type DealStatus = 'pending' | 'approved' | 'rejected';

export interface Deal {
  id: string;
  user_id: string;
  deal_type: DealType;
  project_name: string;
  developer_name: string;
  client_name: string;
  unit_code: string;
  developer_sales_name: string;
  developer_sales_phone: string;
  deal_value: number;
  downpayment_percentage: number;
  payment_plan_years: number;
  deal_stage: DealStage;
  status: DealStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  attachments?: DealAttachment[];
}

export interface DealAttachment {
  id: string;
  deal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface CreateDealRequest {
  deal_type: DealType;
  project_name: string;
  developer_name: string;
  client_name: string;
  unit_code: string;
  developer_sales_name: string;
  developer_sales_phone: string;
  deal_value: number;
  downpayment_percentage: number;
  payment_plan_years: number;
}

export interface UpdateDealRequest {
  deal_type?: DealType;
  project_name?: string;
  developer_name?: string;
  client_name?: string;
  unit_code?: string;
  developer_sales_name?: string;
  developer_sales_phone?: string;
  deal_value?: number;
  downpayment_percentage?: number;
  payment_plan_years?: number;
}

export interface DealFilters {
  deal_type?: DealType;
  deal_stage?: DealStage;
  status?: DealStatus;
  project_name?: string;
  developer_name?: string;
}

export interface DealStats {
  total_deals: number;
  total_value: number;
  deals_by_stage: Record<DealStage, number>;
  deals_by_type: Record<DealType, number>;
}
