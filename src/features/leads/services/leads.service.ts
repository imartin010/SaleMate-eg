/**
 * Leads Service
 * 
 * Handles all lead-related API calls
 * 
 * @module features/leads/services/leads.service
 */

import { supabase } from '@/core/api/client';
import type { Database } from '@/shared/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export interface LeadFilters {
  projectId?: string;
  stage?: string;
  platform?: string;
  search?: string;
}

export class LeadsService {
  /**
   * Get leads for a user with optional filters
   */
  static async getLeads(userId: string, filters?: LeadFilters): Promise<Lead[]> {
    let query = supabase
      .from('leads')
      .select('*, projects(*)')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Lead[];
  }

  /**
   * Get a single lead by ID
   */
  static async getLead(leadId: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, projects(*)')
      .eq('id', leadId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new lead
   */
  static async createLead(lead: LeadInsert): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a lead
   */
  static async updateLead(leadId: string, updates: LeadUpdate): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a lead
   */
  static async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  }

  /**
   * Update lead stage
   */
  static async updateStage(leadId: string, stage: string, feedback?: string): Promise<Lead> {
    const updates: LeadUpdate = { stage };
    if (feedback) {
      updates.last_feedback = feedback;
    }

    return this.updateLead(leadId, updates);
  }

  /**
   * Assign lead to another user
   */
  static async assignLead(leadId: string, newUserId: string): Promise<Lead> {
    return this.updateLead(leadId, { profile_id: newUserId });
  }

  /**
   * Bulk assign leads
   */
  static async bulkAssignLeads(leadIds: string[], userId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ profile_id: userId })
      .in('id', leadIds);

    if (error) throw error;
  }

  /**
   * Get lead statistics for a user
   */
  static async getLeadStats(userId: string) {
    const { data, error } = await supabase.rpc('get_lead_stats', {
      p_user_id: userId,
    });

    if (error) {
      // Fallback: calculate stats manually
      const { data: leads } = await supabase
        .from('leads')
        .select('stage')
        .eq('profile_id', userId);

      if (!leads) return null;

      const stats = leads.reduce((acc: Record<string, number>, lead) => {
        acc[lead.stage] = (acc[lead.stage] || 0) + 1;
        return acc;
      }, {});

      return {
        total: leads.length,
        by_stage: stats,
      };
    }

    return data;
  }

  /**
   * Search leads across all fields
   */
  static async searchLeads(userId: string, searchTerm: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, projects(*)')
      .eq('profile_id', userId)
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) throw error;
    return data as Lead[];
  }
}

