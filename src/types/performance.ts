/**
 * Performance Program Types
 * For Coldwell Banker franchise financial management
 */

export interface PerformanceFranchise {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  headcount: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PerformanceCommissionScheme {
  id: string;
  franchise_id: string;
  project_id: number; // BIGINT from salemate-inventory
  commission_rate: number; // Percentage (e.g., 2.5 for 2.5%)
  developer_payout_months: number;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: {
    name: string;
    developer: string;
    area: string;
  };
}

export type TransactionStage = 'eoi' | 'reservation' | 'contracted' | 'cancelled';

export interface PerformanceTransaction {
  id: string;
  franchise_id: string;
  project_id: number; // BIGINT from salemate-inventory
  transaction_amount: number;
  stage: TransactionStage;
  stage_updated_at: string;
  contracted_at: string | null;
  expected_payout_date: string | null;
  commission_amount: number | null;
  gross_commission: number | null;
  tax_amount: number | null;
  withholding_tax: number | null;
  income_tax: number | null;
  net_commission: number | null;
  managerial_roles?: CommissionRole[]; // Roles involved in this transaction
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  project?: {
    name: string;
    developer: string;
    area: string;
  };
}

export type ExpenseType = 'fixed' | 'variable';
export type ExpenseCategory = 'rent' | 'salaries' | 'marketing' | 'phone_bills' | 'other';

export interface PerformanceExpense {
  id: string;
  franchise_id: string;
  expense_type: ExpenseType;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export type CommissionRole = 'sales_agent' | 'team_leader' | 'sales_director' | 'head_of_sales' | 'royalty';

export interface PerformanceCommissionCut {
  id: string;
  franchise_id: string;
  role: CommissionRole;
  cut_per_million: number;
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface FranchiseAnalytics {
  franchise_id: string;
  franchise_name: string;
  
  // Revenue
  gross_revenue: number;
  net_revenue: number;
  expected_revenue: number;
  
  // Expenses
  total_expenses: number;
  fixed_expenses: number;
  variable_expenses: number;
  commission_cuts_total: number;
  
  // Transactions
  total_sales_volume: number;
  contracted_deals_count: number;
  pending_deals_count: number;
  cancelled_deals_count: number;
  
  // Metrics
  cost_per_agent: number;
  headcount: number;
  
  // Timeline
  expected_payout_timeline: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface CommissionCutCalculation {
  role: CommissionRole;
  cut_per_million: number;
  millions: number;
  total_cut: number;
}

export interface BreakevenAnalysis {
  total_monthly_expenses: number;
  average_commission_rate: number;
  breakeven_sales_volume: number;
  current_monthly_sales: number;
  months_to_breakeven: number;
  is_profitable: boolean;
}

