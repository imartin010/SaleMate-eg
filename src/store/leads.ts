import { create } from 'zustand';
import { Lead, LeadFilters, User } from '../types';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database';

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  fetchLeads: (userId?: string, forceRefresh?: boolean, assigneeFilter?: string) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  assignLeadsToUser: (leadIds: string[], userId: string) => Promise<void>;
  assignLeadToUser: (leadId: string, assigneeId: string) => Promise<boolean>;
  unassignLead: (leadId: string) => Promise<boolean>;
  getFilteredLeads: (filters: LeadFilters, user: User) => Lead[];
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  lastFetched: null,
  
  fetchLeads: async (userId?: string, forceRefresh: boolean = false, assigneeFilter?: string) => {
    const state = get();
    const now = Date.now();
    
    // Check if we have recent data and don't need to refresh
    if (!forceRefresh && 
        state.lastFetched && 
        (now - state.lastFetched) < CACHE_DURATION && 
        state.leads.length > 0) {
      console.log('📊 Using cached leads data');
      return;
    }
    
    set({ loading: true, error: null });
    try {
      console.log('📊 Fetching leads from Supabase...');
      
      let query = supabase
        .from('leads')
        .select(`
          id,
          project_id,
          buyer_user_id,
          assigned_to_id,
          client_name,
          client_phone,
          client_email,
          platform,
          stage,
          feedback,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(200); // Increased limit for better UX

      // Filter by user if specified
      if (userId) {
        query = query.eq('buyer_user_id', userId);
      }

      // Filter by assignee if specified
      if (assigneeFilter) {
        if (assigneeFilter === 'me') {
          const { data: user } = await supabase.auth.getUser();
          query = query.eq('assigned_to_id', user?.user?.id);
        } else if (assigneeFilter === 'unassigned') {
          query = query.is('assigned_to_id', null);
        } else {
          query = query.eq('assigned_to_id', assigneeFilter);
        }
      }

      const { data: leadsData, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`);
      }

              // Transform Supabase data to match Lead type
        const transformedLeads: Lead[] = leadsData?.map(lead => ({
          id: lead.id,
          projectId: lead.project_id,
          buyerUserId: lead.buyer_user_id || undefined,
          assignedToId: lead.assigned_to_id || undefined,
          clientName: lead.client_name,
          clientPhone: lead.client_phone,
          clientPhone2: undefined, // Not in database schema
          clientPhone3: undefined, // Not in database schema
          clientEmail: lead.client_email || undefined,
          clientJobTitle: undefined, // Not in database schema
          platform: lead.platform,
          stage: lead.stage,
          feedback: lead.feedback || undefined,
          createdAt: lead.created_at
        })) || [];

      console.log(`✅ Fetched ${transformedLeads.length} leads from Supabase`);
      set({ 
        leads: transformedLeads, 
        loading: false, 
        lastFetched: now 
      });
      
    } catch (error) {
      console.error('Error fetching leads:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch leads', loading: false });
    }
  },
  
  updateLead: async (id: string, updates: Partial<Lead>) => {
    try {
      set({ error: null });
      
      // Transform frontend data to Supabase format
      const supabaseUpdates: any = {};
      if (updates.stage !== undefined) supabaseUpdates.stage = updates.stage;
      if (updates.feedback !== undefined) supabaseUpdates.feedback = updates.feedback;
      if (updates.clientName !== undefined) supabaseUpdates.client_name = updates.clientName;
      if (updates.clientPhone !== undefined) supabaseUpdates.client_phone = updates.clientPhone;
      if (updates.clientEmail !== undefined) supabaseUpdates.client_email = updates.clientEmail;
      if (updates.clientJobTitle !== undefined) supabaseUpdates.client_job_title = updates.clientJobTitle;

      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update lead: ${error.message}`);
      }

      // Update local state
      const leads = get().leads.map(l => 
        l.id === id ? {
          ...l,
          ...updates
        } : l
      );
      set({ leads });
      
    } catch (error) {
      console.error('Error updating lead:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update lead' });
    }
  },
  
  addLead: async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      set({ error: null });
      
      // Transform frontend data to Supabase format
      const supabaseLead = {
        project_id: leadData.projectId,
        buyer_user_id: leadData.buyerUserId,
        client_name: leadData.clientName,
        client_phone: leadData.clientPhone,
        client_email: leadData.clientEmail,
        platform: leadData.platform,
        stage: leadData.stage,
        feedback: leadData.feedback
      };

      const { data: newLead, error } = await supabase
        .from('leads')
        .insert(supabaseLead)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add lead: ${error.message}`);
      }

      // Transform back to frontend format and add to local state
      const transformedLead: Lead = {
        id: newLead.id,
        projectId: newLead.project_id,
        buyerUserId: newLead.buyer_user_id || undefined,
        clientName: newLead.client_name,
        clientPhone: newLead.client_phone,
        clientPhone2: undefined, // Not in database schema
        clientPhone3: undefined, // Not in database schema
        clientEmail: newLead.client_email || undefined,
        clientJobTitle: undefined, // Not in database schema
        platform: newLead.platform,
        stage: newLead.stage,
        feedback: newLead.feedback || undefined,
        createdAt: newLead.created_at
      };

      const leads = [...get().leads, transformedLead];
      set({ leads });
      
    } catch (error) {
      console.error('Error adding lead:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add lead' });
    }
  },
  
  deleteLead: async (id: string) => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete lead: ${error.message}`);
      }

      // Remove from local state
      const leads = get().leads.filter(l => l.id !== id);
      set({ leads });
      
    } catch (error) {
      console.error('Error deleting lead:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete lead' });
    }
  },
  
  assignLeadsToUser: async (leadIds: string[], userId: string) => {
    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('leads')
        .update({ buyer_user_id: userId })
        .in('id', leadIds);

      if (error) {
        throw new Error(`Failed to assign leads: ${error.message}`);
      }

      // Update local state
      const currentLeads = get().leads;
      const newLeads = currentLeads.map(lead => {
        if (leadIds.includes(lead.id)) {
          return { ...lead, buyerUserId: userId };
        }
        return lead;
      });
      
      set({ leads: newLeads });
      
    } catch (error) {
      console.error('Error assigning leads:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to assign leads' });
    }
  },

  assignLeadToUser: async (leadId: string, assigneeId: string) => {
    try {
      set({ error: null });
      
      const { data, error } = await supabase.rpc("rpc_assign_lead", { 
        lead_id: leadId, 
        assignee_id: assigneeId 
      });
      
      if (error) {
        throw new Error(`Failed to assign lead: ${error.message}`);
      }

      // Update local state
      const currentLeads = get().leads;
      const newLeads = currentLeads.map(lead => {
        if (lead.id === leadId) {
          return { ...lead, assignedToId: assigneeId };
        }
        return lead;
      });
      
      set({ leads: newLeads });
      return true;
      
    } catch (error) {
      console.error('Error assigning lead:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to assign lead' });
      return false;
    }
  },

  unassignLead: async (leadId: string) => {
    try {
      set({ error: null });
      
      const { data, error } = await supabase.rpc("rpc_unassign_lead", { 
        lead_id: leadId 
      });
      
      if (error) {
        throw new Error(`Failed to unassign lead: ${error.message}`);
      }

      // Update local state
      const currentLeads = get().leads;
      const newLeads = currentLeads.map(lead => {
        if (lead.id === leadId) {
          return { ...lead, assignedToId: undefined };
        }
        return lead;
      });
      
      set({ leads: newLeads });
      return true;
      
    } catch (error) {
      console.error('Error unassigning lead:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to unassign lead' });
      return false;
    }
  },
  
  getFilteredLeads: (filters: LeadFilters, user: User): Lead[] => {
    let filteredLeads = get().leads;
    
    // Apply role-based filtering
    if (user.role === 'user') {
      filteredLeads = filteredLeads.filter(lead => lead.buyerUserId === user.id);
    } else if (user.role === 'manager') {
      // For managers, we need to fetch team data from Supabase
      // This will be handled by the backend RLS policies
      // For now, show all leads (RLS will handle the filtering)
    }
    // Admin and Support see all leads
    
    // Apply filters
    if (filters.projectId) {
      filteredLeads = filteredLeads.filter(lead => lead.projectId === filters.projectId);
    }
    
    if (filters.platform) {
      filteredLeads = filteredLeads.filter(lead => lead.platform === filters.platform);
    }
    
    if (filters.stage) {
      filteredLeads = filteredLeads.filter(lead => lead.stage === filters.stage);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.clientName.toLowerCase().includes(searchLower) ||
        lead.clientPhone.includes(searchLower) ||
        (lead.clientEmail && lead.clientEmail.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredLeads;
  },
}));
