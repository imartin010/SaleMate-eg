import { create } from 'zustand';
import { supabase } from "../lib/supabaseClient"
import type { Lead, LeadFilters, LeadStage, Platform } from '../types';

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
            developer:entities!projects_developer_id_fkey ( name )
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

      const { data, error, count } = await Promise.race([query, timeoutPromise]) as { data: unknown; error: unknown; count: number };

      if (error) {
        throw new Error(`Database error: ${(error as Error).message}`);
      }

      // Transform data to match frontend types
      const transformedLeads: Lead[] = ((data as unknown[]) || []).map((lead: unknown) => {
        const leadData = lead as Record<string, unknown>;
        return {
        id: leadData.id as string,
        projectId: leadData.project_id as string,
        buyerUserId: leadData.buyer_user_id as string,
        clientName: leadData.client_name as string,
        clientPhone: leadData.client_phone as string,
        clientPhone2: leadData.client_phone2 as string,
        clientPhone3: leadData.client_phone3 as string,
        clientEmail: leadData.client_email as string,
        clientJobTitle: leadData.client_job_title as string,
        platform: leadData.platform as Platform,
        stage: leadData.stage as LeadStage,
        feedback: leadData.feedback as string,
        createdAt: leadData.created_at as string,
        project: leadData.projects ? {
          id: (leadData.projects as Record<string, unknown>).id as string,
          name: (leadData.projects as Record<string, unknown>).name as string,
          developer: ((leadData.projects as Record<string, unknown>)?.developer as Record<string, unknown>)?.name as string ?? 'Unknown',
          region: (leadData.projects as Record<string, unknown>).region as string
        } : undefined
      };
      });

      console.log(`✅ Loaded ${transformedLeads.length} leads, Total: ${count}`);

      set({
        leads: reset ? transformedLeads : [...state.leads, ...transformedLeads],
        loading: false,
        hasMore: transformedLeads.length === state.pageSize,
        currentPage: page + 1,
        totalCount: count || 0,
        error: null
      });

    } catch (err: unknown) {
      console.error('❌ Failed to fetch leads:', err);
      set({ 
        error: (err instanceof Error ? err.message : String(err)) || 'Failed to load leads',
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

      const updateData: Record<string, unknown> = { 
        stage,
        updated_at: new Date().toISOString()
      };
      
      if (feedback !== undefined) {
        updateData.feedback = feedback;
      }

      const { error } = await supabase
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
          ? { ...lead, stage: stage as LeadStage, feedback }
          : lead
      );

      set({ leads: updatedLeads });

      console.log(`✅ Lead updated successfully`);
      // Function should return void according to interface

    } catch (err: unknown) {
      console.error('❌ Failed to update lead stage:', err);
      set({ error: (err instanceof Error ? err.message : String(err)) || 'Failed to update lead' });
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
