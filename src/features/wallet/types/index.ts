export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference_id?: string;
  reference_type?: 'lead_request' | 'purchase' | 'refund' | 'admin_adjustment';
  created_at: string;
}

export interface LeadRequest {
  id: string;
  user_id: string;
  project_id: string;
  requested_quantity: number;
  price_per_lead: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}
