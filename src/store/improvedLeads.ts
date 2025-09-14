import { create } from 'zustand';
import { supabase } from "../lib/supabaseClient"
import type { Lead, LeadFilters } from '../types';

interface LeadsState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  filters: LeadFilters;
  
  // Actions
  fetchLeads: (userId?: string, reset?: boolean) => Promise<void>;
  loadMoreLeads: (userId?: string) => Promise<void>;
  updateLeadStage: (leadId: string, stage: string, feedback?: string) => Promise<void>;
  setFilters: (filters: LeadFilters) => void;
  refreshLeads: (userId?: string) => Promise<void>;
  clearError: () => void;
}

export const useImprovedLeadStore = create<LeadsState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 0,
  pageSize: 20, // Load 20 leads at a time
  totalCount: 0,
  filters: {},

  fetchLeads: async (userId?: string, reset = true) => {
    const state = get();
    
    if (state.loading) return; // Prevent concurrent requests
    
    set({ 
      loading: true, 
      error: null,
      leads: reset ? [] : state.leads,
      currentPage: reset ? 0 : state.currentPage
    });

    try {
      const page = reset ? 0 : state.currentPage;
      const offset = page * state.pageSize;

      console.log(`📊 Fetching leads - Page: ${page}, Offset: ${offset}, UserId: ${userId}`);

      // Build query with filters
      let query = supabase
        .from('leads')
        .select(`
          *,
          projects (
            id,
            name,
            region,
            developers:developers ( name )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + state.pageSize - 1);

      // Apply user filter
      if (userId) {
        query = query.eq('buyer_user_id', userId);
      }

      // Apply additional filters
      if (state.filters.projectId) {
        query = query.eq('project_id', state.filters.projectId);
      }
      if (state.filters.platform) {
        query = query.eq('platform', state.filters.platform);
      }
      if (state.filters.stage) {
        query = query.eq('stage', state.filters.stage);
      }
      if (state.filters.search) {
        query = query.or(`client_name.ilike.%${state.filters.search}%,client_phone.ilike.%${state.filters.search}%,client_email.ilike.%${state.filters.search}%`);
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      const { data, error, count } = await Promise.race([query, timeoutPromise]) as any;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform data to match frontend types
      const transformedLeads: Lead[] = (data || []).map((lead: any) => ({
        id: lead.id,
        projectId: lead.project_id,
        buyerUserId: lead.buyer_user_id,
        clientName: lead.client_name,
        clientPhone: lead.client_phone,
        clientPhone2: lead.client_phone2,
        clientPhone3: lead.client_phone3,
        clientEmail: lead.client_email,
        clientJobTitle: lead.client_job_title,
        platform: lead.platform,
        stage: lead.stage,
        feedback: lead.feedback,
        createdAt: lead.created_at,
        project: lead.projects ? {
          id: lead.projects.id,
          name: lead.projects.name,
          developer: lead.projects?.developers?.name ?? 'Unknown',
          region: lead.projects.region
        } : undefined
      }));

      console.log(`✅ Loaded ${transformedLeads.length} leads, Total: ${count}`);

      set({
        leads: reset ? transformedLeads : [...state.leads, ...transformedLeads],
        loading: false,
        hasMore: transformedLeads.length === state.pageSize,
        currentPage: page + 1,
        totalCount: count || 0,
        error: null
      });

    } catch (err: any) {
      console.error('❌ Failed to fetch leads:', err);
      set({ 
        error: err.message || 'Failed to load leads',
        loading: false,
        hasMore: false
      });
    }
  },

  loadMoreLeads: async (userId?: string) => {
    const state = get();
    if (!state.hasMore || state.loading) return;
    
    await state.fetchLeads(userId, false);
  },

  updateLeadStage: async (leadId: string, stage: string, feedback?: string) => {
    try {
      console.log(`🔄 Updating lead ${leadId} to stage: ${stage}`);

      const updateData: any = { 
        stage,
        updated_at: new Date().toISOString()
      };
      
      if (feedback !== undefined) {
        updateData.feedback = feedback;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update lead: ${error.message}`);
      }

      // Update local state optimistically
      const state = get();
      const updatedLeads = state.leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, stage: stage as any, feedback }
          : lead
      );

      set({ leads: updatedLeads });

      console.log(`✅ Lead updated successfully`);
      return data;

    } catch (err: any) {
      console.error('❌ Failed to update lead stage:', err);
      set({ error: err.message || 'Failed to update lead' });
      throw err;
    }
  },

  setFilters: (filters: LeadFilters) => {
    set({ filters });
    // Auto-refresh when filters change
    const { fetchLeads } = get();
    fetchLeads(undefined, true);
  },

  refreshLeads: async (userId?: string) => {
    const { fetchLeads } = get();
    await fetchLeads(userId, true);
  },

  clearError: () => {
    set({ error: null });
  }
}));
