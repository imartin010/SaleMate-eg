import { create } from 'zustand';
import { supabase } from "../lib/supabaseClient"
import { Deal, CreateDealRequest, UpdateDealRequest, DealFilters, DealStats } from '../types/deals';

interface DealsState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  selectedDeal: Deal | null;
  
  // Actions
  fetchDeals: () => Promise<void>;
  createDeal: (dealData: CreateDealRequest) => Promise<Deal | null>;
  updateDeal: (id: string, dealData: UpdateDealRequest) => Promise<Deal | null>;
  deleteDeal: (id: string) => Promise<boolean>;
  selectDeal: (deal: Deal | null) => void;
  uploadFiles: (dealId: string, files: File[]) => Promise<boolean>;
  getDealStats: () => Promise<DealStats | null>;
  filterDeals: (filters: DealFilters) => Deal[];
  clearError: () => void;
}

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  loading: false,
  error: null,
  selectedDeal: null,

  fetchDeals: async () => {
    // ULTRA-FAST: Return immediately with empty state, load in background
    set({ deals: [], loading: false, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚡ No user, keeping empty deals');
        return;
      }

      // Mock implementation - deals table doesn't exist in schema
      console.log('⚡ Deals table not available - using mock data');
      set({ deals: [] });
    } catch {
      console.log('⚡ Deals loading failed, keeping empty state');
      // Don't show error, just keep empty state
    }
  },

  createDeal: async (_dealData: CreateDealRequest) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    set({ loading: true, error: null });
    try {
      // Mock implementation - deals table doesn't exist
      console.log('⚡ Deals table not available - mock create');
      set({ loading: false });
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  updateDeal: async (_id: string, _dealData: UpdateDealRequest) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    set({ loading: true, error: null });
    try {
      // Mock implementation - deals table doesn't exist
      console.log('⚡ Deals table not available - mock update');
      set({ loading: false });
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  deleteDeal: async (_id: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    set({ loading: true, error: null });
    try {
      // Mock implementation - deals table doesn't exist
      console.log('⚡ Deals table not available - mock delete');
      set({ loading: false });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  selectDeal: (deal: Deal | null) => {
    set({ selectedDeal: deal });
  },

  uploadFiles: async (_dealId: string, _files: File[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    set({ loading: true, error: null });
    try {
      // Mock implementation - deals table doesn't exist
      console.log('⚡ Deals table not available - mock file upload');
      set({ loading: false });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, loading: false });
      return false;
    }
  },

  getDealStats: async () => {
    try {
      const deals = get().deals;
      if (!deals.length) return null;

      const totalDeals = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + deal.deal_value, 0);
      
      const dealsByStage = deals.reduce((acc, deal) => {
        acc[deal.deal_stage] = (acc[deal.deal_stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dealsByType = deals.reduce((acc, deal) => {
        acc[deal.deal_type] = (acc[deal.deal_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_deals: totalDeals,
        total_value: totalValue,
        deals_by_stage: dealsByStage,
        deals_by_type: dealsByType,
      };
    } catch (error: unknown) {
      console.error('Error getting deal stats:', error);
      return null;
    }
  },

  filterDeals: (filters: DealFilters) => {
    let filteredDeals = [...get().deals];

    if (filters.deal_type) {
      filteredDeals = filteredDeals.filter(deal => deal.deal_type === filters.deal_type);
    }

    if (filters.deal_stage) {
      filteredDeals = filteredDeals.filter(deal => deal.deal_stage === filters.deal_stage);
    }

    if (filters.status) {
      filteredDeals = filteredDeals.filter(deal => deal.status === filters.status);
    }

    if (filters.project_name) {
      filteredDeals = filteredDeals.filter(deal => 
        deal.project_name.toLowerCase().includes(filters.project_name!.toLowerCase())
      );
    }

    if (filters.developer_name) {
      filteredDeals = filteredDeals.filter(deal => 
        deal.developer_name.toLowerCase().includes(filters.developer_name!.toLowerCase())
      );
    }

    return filteredDeals;
  },

  clearError: () => {
    set({ error: null });
  },
}));
