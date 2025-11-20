/**
 * Performance Data Hooks
 * React hooks for fetching and managing performance data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type {
  PerformanceFranchise,
  PerformanceTransaction,
  PerformanceExpense,
  PerformanceCommissionScheme,
  PerformanceCommissionCut,
  FranchiseAnalytics,
  CommissionRole,
} from '../../types/performance';

// Franchises
export function usePerformanceFranchises() {
  return useQuery({
    queryKey: ['performance-franchises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_franchises')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as PerformanceFranchise[];
    },
  });
}

export function usePerformanceFranchise(franchiseId: string) {
  return useQuery({
    queryKey: ['performance-franchise', franchiseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_franchises')
        .select('*')
        .eq('id', franchiseId)
        .single();
      
      if (error) throw error;
      return data as PerformanceFranchise;
    },
    enabled: !!franchiseId,
  });
}

export function useUpdateFranchise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PerformanceFranchise> & { id: string }) => {
      const { data, error } = await supabase
        .from('performance_franchises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['performance-franchise', data.id] });
      queryClient.invalidateQueries({ queryKey: ['performance-franchises'] });
    },
  });
}

export function usePerformanceFranchiseBySlug(slug: string) {
  return useQuery({
    queryKey: ['performance-franchise-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_franchises')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as PerformanceFranchise;
    },
    enabled: !!slug,
  });
}

// Transactions
export function usePerformanceTransactions(franchiseId?: string) {
  return useQuery({
    queryKey: ['performance-transactions', franchiseId],
    queryFn: async () => {
      let query = supabase
        .from('performance_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      }
      
      const { data: transactions, error } = await query;
      if (error) throw error;
      
      if (!transactions || transactions.length === 0) {
        return [] as PerformanceTransaction[];
      }
      
      // Get unique project IDs
      const projectIds = [...new Set(transactions.map(t => t.project_id).filter(Boolean))];
      
      // Batch fetch all projects at once
      let projectsMap = new Map();
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('salemate-inventory')
          .select('id, compound, developer, area')
          .in('id', projectIds);
        
        if (projects) {
          // Helper to extract clean name from potentially JSON-formatted strings
          const extractCleanName = (value: unknown): string => {
            if (!value) return '';
            if (typeof value === 'string') {
              // Try to extract name from JSON or pseudo-JSON strings
              const jsonMatch = value.match(/"name"\s*:\s*"([^"]+)"/);
              if (jsonMatch && jsonMatch[1]) return jsonMatch[1].trim();
              const pseudoJsonMatch = value.match(/'name'\s*:\s*'([^']+)'/);
              if (pseudoJsonMatch && pseudoJsonMatch[1]) return pseudoJsonMatch[1].trim();
              // If it's a plain string, return it
              return value.trim();
            }
            if (typeof value === 'object' && value !== null) {
              const obj = value as { name?: string };
              return obj.name || '';
            }
            return String(value).trim();
          };

          projectsMap = new Map(projects.map(p => [p.id, {
            name: extractCleanName(p.compound) || `Project ${p.id}`,
            developer: extractCleanName(p.developer) || '',
            area: extractCleanName(p.area) || ''
          }]));
        }
      }
      
      // Merge transactions with project data
      const transactionsWithProjects = transactions.map(transaction => {
        // Parse managerial_roles from JSONB if it exists
        let managerialRoles: CommissionRole[] | undefined;
        if (transaction.managerial_roles) {
          if (Array.isArray(transaction.managerial_roles)) {
            managerialRoles = transaction.managerial_roles;
          } else if (typeof transaction.managerial_roles === 'string') {
            try {
              managerialRoles = JSON.parse(transaction.managerial_roles);
            } catch {
              managerialRoles = undefined;
            }
          }
        }
        
        return {
          ...transaction,
          project: transaction.project_id ? projectsMap.get(transaction.project_id) : undefined,
          managerial_roles: managerialRoles
        };
      });
      
      return transactionsWithProjects as PerformanceTransaction[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Partial<PerformanceTransaction>) => {
      // Convert managerial_roles array to JSONB format for database
      const transactionData = {
        ...transaction,
        managerial_roles: transaction.managerial_roles && transaction.managerial_roles.length > 0
          ? transaction.managerial_roles
          : null
      };
      
      const { data, error } = await supabase
        .from('performance_transactions')
        .insert(transactionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PerformanceTransaction> & { id: string }) => {
      // Convert managerial_roles array to JSONB format for database
      const updateData = {
        ...updates,
        managerial_roles: updates.managerial_roles && updates.managerial_roles.length > 0
          ? updates.managerial_roles
          : null
      };
      
      const { data, error } = await supabase
        .from('performance_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

// Expenses
export function usePerformanceExpenses(franchiseId?: string) {
  return useQuery({
    queryKey: ['performance-expenses', franchiseId],
    queryFn: async () => {
      let query = supabase
        .from('performance_expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PerformanceExpense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: Partial<PerformanceExpense>) => {
      const { data, error } = await supabase
        .from('performance_expenses')
        .insert(expense)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...expense }: Partial<PerformanceExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from('performance_expenses')
        .update(expense)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('performance_expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

// Commission Schemes
export function usePerformanceCommissionSchemes(franchiseId?: string) {
  return useQuery({
    queryKey: ['performance-commission-schemes', franchiseId],
    queryFn: async () => {
      let query = supabase
        .from('performance_commission_schemes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PerformanceCommissionScheme[];
    },
  });
}

export function useCreateCommissionScheme() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheme: Partial<PerformanceCommissionScheme>) => {
      const { data, error } = await supabase
        .from('performance_commission_schemes')
        .insert(scheme)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-commission-schemes'] });
    },
  });
}

// Commission Cuts
export function usePerformanceCommissionCuts(franchiseId?: string) {
  return useQuery({
    queryKey: ['performance-commission-cuts', franchiseId],
    queryFn: async () => {
      let query = supabase
        .from('performance_commission_cuts')
        .select('*')
        .order('role');
      
      if (franchiseId) {
        query = query.eq('franchise_id', franchiseId);
      }
      
      const { data, error} = await query;
      if (error) throw error;
      return data as PerformanceCommissionCut[];
    },
  });
}

export function useUpsertCommissionCut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cut: Partial<PerformanceCommissionCut>) => {
      const { data, error } = await supabase
        .from('performance_commission_cuts')
        .upsert(cut, { onConflict: 'franchise_id,role' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-commission-cuts'] });
      queryClient.invalidateQueries({ queryKey: ['performance-analytics'] });
    },
  });
}

// Analytics
export function usePerformanceAnalytics(franchiseId: string) {
  const { data: transactions } = usePerformanceTransactions(franchiseId);
  const { data: expenses } = usePerformanceExpenses(franchiseId);
  const { data: commissionCuts } = usePerformanceCommissionCuts(franchiseId);
  const { data: franchise } = usePerformanceFranchise(franchiseId);
  
  return useQuery({
    queryKey: ['performance-analytics', franchiseId, transactions, expenses, commissionCuts, franchise],
    queryFn: async (): Promise<FranchiseAnalytics> => {
      if (!transactions || !expenses || !commissionCuts || !franchise) {
        throw new Error('Missing data for analytics');
      }
      
      // Calculate contracted transactions
      const contractedTransactions = transactions.filter(t => t.stage === 'contracted');
      
      // Gross revenue (sum of all commission amounts for contracted deals)
      const gross_revenue = contractedTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
      
      // Total sales volume
      const total_sales_volume = contractedTransactions.reduce((sum, t) => sum + t.transaction_amount, 0);
      
      // Total expenses
      const total_expenses = expenses.reduce((sum, e) => e.amount + sum, 0);
      
      // Fixed and variable expenses
      const fixed_expenses = expenses.filter(e => e.expense_type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
      const variable_expenses = expenses.filter(e => e.expense_type === 'variable').reduce((sum, e) => sum + e.amount, 0);
      
      // Commission cuts
      const millions = total_sales_volume / 1_000_000;
      const commission_cuts_total = commissionCuts.reduce((sum, cut) => sum + (cut.cut_per_million * millions), 0);
      
      // Net revenue
      const net_revenue = gross_revenue - total_expenses - commission_cuts_total;
      
      // Expected revenue (future payouts)
      const now = new Date();
      const expected_revenue = contractedTransactions
        .filter(t => t.expected_payout_date && new Date(t.expected_payout_date) > now)
        .reduce((sum, t) => sum + (t.commission_amount || 0), 0);
      
      // Cost per agent
      const cost_per_agent = franchise.headcount > 0 ? total_expenses / franchise.headcount : 0;
      
      // Payout timeline
      const timeline = contractedTransactions
        .filter(t => t.expected_payout_date)
        .reduce((acc, t) => {
          const month = new Date(t.expected_payout_date!).toISOString().substring(0, 7);
          if (!acc[month]) {
            acc[month] = { month, amount: 0, count: 0 };
          }
          acc[month].amount += t.commission_amount || 0;
          acc[month].count += 1;
          return acc;
        }, {} as Record<string, { month: string; amount: number; count: number }>);
      
      const expected_payout_timeline = Object.values(timeline).sort((a, b) => a.month.localeCompare(b.month));
      
      return {
        franchise_id: franchiseId,
        franchise_name: franchise.name,
        gross_revenue,
        net_revenue,
        expected_revenue,
        total_expenses,
        fixed_expenses,
        variable_expenses,
        commission_cuts_total,
        total_sales_volume,
        contracted_deals_count: contractedTransactions.length,
        pending_deals_count: transactions.filter(t => t.stage === 'eoi' || t.stage === 'reservation').length,
        cancelled_deals_count: transactions.filter(t => t.stage === 'cancelled').length,
        cost_per_agent,
        headcount: franchise.headcount,
        expected_payout_timeline,
      };
    },
    enabled: !!franchiseId && !!transactions && !!expenses && !!commissionCuts && !!franchise,
  });
}

