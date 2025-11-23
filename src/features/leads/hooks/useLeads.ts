import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/api/client';
import { useAuthStore } from '../../store/auth';

export interface FeedbackHistoryEntry {
  id: string;
  lead_id: string;
  user_id: string;
  feedback_text: string;
  created_at: string;
  updated_at?: string | null;
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
  company_name?: string | null;
  budget?: number | null;
  project_id: string;
  source: string;
  stage: LeadStage;
  feedback?: string | null;
  created_at: string;
  updated_at?: string;
  assigned_at?: string | null;
  buyer_user_id?: string | null;
  assigned_to_id?: string | null;
  owner_id?: string | null;
  upload_user_id?: string | null;
  project?: {
    id: string;
    name: string;
    region: string;
  } | null;
  owner?: {
    id: string;
    name: string;
  } | null;
  assigned_to?: {
    id: string;
    name: string;
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
  client_phone2?: string;
  client_phone3?: string;
  client_job_title?: string;
  company_name?: string;
  budget?: number;
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

      // Try to fetch leads with project join (only FK that exists)
      // Note: owner_id and assigned_to_id don't have foreign keys, so we can't join profiles
      let query = supabase
        .from('leads')
        .select(`
          *,
          projects (
            id,
            name,
            region
          )
        `)
        .or(`buyer_user_id.eq.${user.id},assigned_to_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // If the query fails, try a simpler query without joins
        console.warn('Failed to fetch leads with project join, trying simpler query:', fetchError);
        const { data: simpleData, error: simpleError } = await supabase
          .from('leads')
          .select('*')
          .or(`buyer_user_id.eq.${user.id},assigned_to_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        
        // Fetch projects separately if join failed
        const projectIds = [...new Set((simpleData || []).map((l: any) => l.project_id).filter(Boolean))];
        let projectsMap: Record<string, { id: string; name: string; region: string }> = {};
        
        if (projectIds.length > 0) {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, region')
            .in('id', projectIds);
          
          if (!projectsError && projectsData) {
            projectsMap = projectsData.reduce((acc, p: any) => {
              acc[p.id] = {
                id: p.id,
                name: typeof p.name === 'object' && p.name !== null
                  ? (p.name.name || JSON.stringify(p.name))
                  : (p.name || ''),
                region: typeof p.region === 'object' && p.region !== null
                  ? (p.region.name || JSON.stringify(p.region))
                  : (p.region || ''),
              };
              return acc;
            }, {} as Record<string, { id: string; name: string; region: string }>);
          }
        }
        
        // Transform simple data with manually joined projects
        const transformedData = (simpleData || []).map((lead: any) => ({
          ...lead,
          project: lead.project_id ? (projectsMap[lead.project_id] || null) : null,
          owner: null,
          assigned_to: null,
          feedback_history: [],
        }));

        setLeads(transformedData as Lead[]);
        setLoading(false);
        return;
      }

      // Transform the data to extract nested names
      const transformedData = (data || []).map((lead: any) => {
        // Handle project - Supabase returns it as 'projects' (could be array or object)
        // For one-to-one relationships, it's usually an object, but can be an array
        const originalProject = lead.projects;
        
        // Debug logging for first lead to understand the structure
        if (lead.id && !originalProject && lead.project_id) {
          console.warn(`Lead ${lead.id} has project_id ${lead.project_id} but no project data in join`);
        }
        
        // If it's an array, take the first element (shouldn't happen for one-to-one, but handle it)
        const projectData = Array.isArray(originalProject) 
          ? (originalProject.length > 0 ? originalProject[0] : null)
          : originalProject;
        
        const transformedProject = projectData ? {
          id: projectData.id,
          name: typeof projectData.name === 'object' && projectData.name !== null
            ? (projectData.name.name || JSON.stringify(projectData.name))
            : (projectData.name || ''),
          region: typeof projectData.region === 'object' && projectData.region !== null
            ? (projectData.region.name || JSON.stringify(projectData.region))
            : (projectData.region || ''),
        } : null;

        return {
          ...lead,
          project: transformedProject,
          owner: null, // Will be fetched separately if needed
          assigned_to: null, // Will be fetched separately if needed
          feedback_history: [] as FeedbackHistoryEntry[],
        };
      });

      const leadIds = transformedData.map((lead) => lead.id).filter(Boolean);

      let feedbackHistoryMap: Record<string, FeedbackHistoryEntry[]> = {};

      // Only fetch feedback history if we have a reasonable number of leads
      // Large arrays in .in() filters can cause 400 errors
      if (leadIds.length > 0 && leadIds.length <= 100) {
        try {
          // Batch the query if there are many leads (Supabase has limits on .in() array size)
          const batchSize = 50;
          const batches: string[][] = [];
          
          for (let i = 0; i < leadIds.length; i += batchSize) {
            batches.push(leadIds.slice(i, i + batchSize));
          }

          // Fetch feedback in batches
          const allFeedbackData: any[] = [];
          const profileIdsSet = new Set<string>();

          for (const batch of batches) {
            const { data: batchFeedbackData, error: batchError } = await supabase
          .from('events')
              .select('id, lead_id, actor_profile_id, body, payload, created_at, updated_at')
              .in('lead_id', batch)
          .eq('event_type', 'activity')
          .eq('activity_type', 'feedback')
          .order('created_at', { ascending: false });

            if (!batchError && batchFeedbackData) {
              allFeedbackData.push(...batchFeedbackData);
              batchFeedbackData.forEach((f: any) => {
                if (f.actor_profile_id) profileIdsSet.add(f.actor_profile_id);
              });
            }
          }

          // Fetch profiles separately
          let profilesMap: Record<string, { id: string; name: string; email: string }> = {};
          
          if (profileIdsSet.size > 0) {
            const profileIds = Array.from(profileIdsSet);
            // Batch profile fetches too if needed
            const profileBatchSize = 100;
            for (let i = 0; i < profileIds.length; i += profileBatchSize) {
              const profileBatch = profileIds.slice(i, i + profileBatchSize);
              const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', profileBatch);
              
              if (profilesData) {
                profilesData.forEach((p: any) => {
                  profilesMap[p.id] = { id: p.id, name: p.name || 'Unknown User', email: p.email || '' };
                });
              }
            }
          }

          // Build feedback history map
          feedbackHistoryMap = allFeedbackData.reduce<Record<string, FeedbackHistoryEntry[]>>((acc, activity: any) => {
            const feedbackEntry: FeedbackHistoryEntry = {
              id: activity.id,
              lead_id: activity.lead_id,
              user_id: activity.actor_profile_id ?? '',
              feedback_text: activity.body ?? '',
              created_at: activity.created_at,
              updated_at: activity.updated_at ?? null,
              user: activity.actor_profile_id && profilesMap[activity.actor_profile_id]
                ? {
                    name: profilesMap[activity.actor_profile_id].name,
                    email: profilesMap[activity.actor_profile_id].email,
                  }
                : null,
            };

            if (!acc[activity.lead_id]) {
              acc[activity.lead_id] = [];
            }
            acc[activity.lead_id].push(feedbackEntry);
            return acc;
          }, {});
        } catch (error) {
          console.warn('Error loading feedback history:', error);
          // Continue without feedback history - it's not critical
        }
      } else if (leadIds.length > 100) {
        // Skip feedback history for large result sets to avoid query size limits
        console.log(`Skipping feedback history fetch for ${leadIds.length} leads (too many for efficient query)`);
      }

      const leadsWithFeedback = transformedData.map((lead) => ({
        ...lead,
        feedback_history: feedbackHistoryMap[lead.id] ?? [],
      }));

      setLeads(leadsWithFeedback as Lead[]);
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

