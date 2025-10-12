import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';

export interface FeedbackHistoryEntry {
  id: string;
  lead_id: string;
  user_id: string;
  feedback_text: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

export interface Lead {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  client_phone2?: string | null;
  client_phone3?: string | null;
  client_job_title?: string | null;
  project_id: string;
  source: string;
  stage: LeadStage;
  feedback?: string | null;
  created_at: string;
  updated_at?: string;
  buyer_user_id?: string | null;
  upload_user_id?: string | null;
  project?: {
    id: string;
    name: string;
    region: string;
  } | null;
  feedback_history?: FeedbackHistoryEntry[];
}

export type LeadStage =
  | 'New Lead'
  | 'Potential'
  | 'Hot Case'
  | 'Meeting Done'
  | 'No Answer'
  | 'Call Back'
  | 'Whatsapp'
  | 'Non Potential'
  | 'Wrong Number'
  | 'Closed Deal'
  | 'Switched Off'
  | 'Low Budget';

export interface CreateLeadInput {
  client_name: string;
  client_phone: string;
  client_email?: string;
  project_id: string;
  source: string;
  stage?: LeadStage;
  feedback?: string;
}

export interface UpdateLeadInput {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  project_id?: string;
  source?: string;
  stage?: LeadStage;
  feedback?: string;
}

export function useLeads() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          project:projects (
            id,
            name,
            region
          ),
          feedback_history:feedback_history (
            id,
            feedback_text,
            created_at,
            user:profiles (
              name,
              email
            )
          )
        `)
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'feedback_history', ascending: false });

      if (fetchError) throw fetchError;

      // Debug: Log the first lead's project data
      if (data && data.length > 0) {
        console.log('🔍 First lead project data:', {
          raw: data[0].project,
          nameType: typeof data[0].project?.name,
          nameValue: data[0].project?.name,
          regionType: typeof data[0].project?.region,
          regionValue: data[0].project?.region,
        });
      }

      // Transform the data to extract nested names
      const transformedData = (data || []).map((lead: any) => {
        const originalProject = lead.project;
        const transformedProject = originalProject ? {
          ...originalProject,
          name: typeof originalProject.name === 'object' && originalProject.name !== null
            ? (originalProject.name.name || JSON.stringify(originalProject.name))
            : originalProject.name,
          region: typeof originalProject.region === 'object' && originalProject.region !== null
            ? (originalProject.region.name || JSON.stringify(originalProject.region))
            : originalProject.region,
        } : null;

        console.log('📝 Transform:', {
          original: originalProject,
          transformed: transformedProject
        });

        return {
          ...lead,
          project: transformedProject,
        };
      });

      setLeads(transformedData as Lead[]);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createLead = useCallback(
    async (input: CreateLeadInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      try {
        const newLead: Partial<Lead> = {
          ...input,
          buyer_user_id: user.id,
          upload_user_id: user.id,
          stage: input.stage || 'New Lead',
          created_at: new Date().toISOString(),
        };

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        setLeads((prev) => [{ ...newLead, id: tempId } as Lead, ...prev]);

        const { data, error: createError } = await supabase
          .from('leads')
          .insert([newLead])
          .select()
          .single();

        if (createError) throw createError;

        // Replace temp lead with real one
        setLeads((prev) =>
          prev.map((lead) => (lead.id === tempId ? (data as Lead) : lead))
        );

        return data as Lead;
      } catch (err) {
        console.error('Error creating lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [user?.id, fetchLeads]
  );

  const updateLead = useCallback(
    async (id: string, updates: UpdateLeadInput) => {
      try {
        // Optimistic update
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id ? { ...lead, ...updates } : lead
          )
        );

        const { data, error: updateError } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? (data as Lead) : lead))
        );

        return data as Lead;
      } catch (err) {
        console.error('Error updating lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [fetchLeads]
  );

  const deleteLead = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        setLeads((prev) => prev.filter((lead) => lead.id !== id));

        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Error deleting lead:', err);
        // Rollback optimistic update
        fetchLeads();
        throw err;
      }
    },
    [fetchLeads]
  );

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `buyer_user_id=eq.${user?.id}`,
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads, user?.id]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
  };
}

