import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import type { Lead } from '../crm/useLeads';
import type { CaseFeedback, CaseAction, CaseFace, InventoryMatch } from '../../types/case';
import {
  getCaseFeedback,
  getCaseActions,
  getCaseFaces,
  getInventoryMatches,
} from '../../lib/api/caseApi';

interface UseCaseReturn {
  lead: Lead | null;
  feedback: CaseFeedback[];
  actions: CaseAction[];
  faces: CaseFace[];
  matches: InventoryMatch[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage case data for a specific lead
 * Fetches lead, feedback, actions, faces, and inventory matches
 * Sets up realtime subscriptions for updates
 */
export function useCase(leadId: string): UseCaseReturn {
  const { user } = useAuthStore();
  const [lead, setLead] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState<CaseFeedback[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  const [faces, setFaces] = useState<CaseFace[]>([]);
  const [matches, setMatches] = useState<InventoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseData = useCallback(async () => {
    if (!leadId || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch lead details - try with project join first
      const query = supabase
        .from('leads')
        .select(`
          *,
          project:projects(id, name, region)
        `)
        .eq('id', leadId)
        .single();

      const { data: leadData, error: leadError } = await query;

      if (leadError) {
        // If the query fails, try a simpler query without joins
        console.warn('Failed to fetch lead with joins, trying simpler query:', leadError);
        const { data: simpleLeadData, error: simpleLeadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (simpleLeadError) throw simpleLeadError;
        
        // Transform simple data
        const transformedLead = {
          ...simpleLeadData,
          project: null,
          owner: null,
          assigned_to: null,
        } as Lead;
        
        setLead(transformedLead);
      } else {
        // Transform the data to extract nested project info
        const transformedLead = {
          ...leadData,
          project: leadData.project ? {
            ...leadData.project,
            name: typeof leadData.project.name === 'object' && leadData.project.name !== null
              ? (leadData.project.name.name || JSON.stringify(leadData.project.name))
              : leadData.project.name,
            region: typeof leadData.project.region === 'object' && leadData.project.region !== null
              ? (leadData.project.region.name || JSON.stringify(leadData.project.region))
              : leadData.project.region,
          } : null,
          owner: null,
          assigned_to: null,
        } as Lead;
        
        setLead(transformedLead);
      }

      // Fetch case feedback, actions, faces, and matches in parallel
      const [feedbackResult, actionsResult, facesResult, matchesResult] = await Promise.allSettled([
        getCaseFeedback(leadId),
        getCaseActions(leadId),
        getCaseFaces(leadId),
        getInventoryMatches(leadId),
      ]);

      if (feedbackResult.status === 'fulfilled') {
        setFeedback(feedbackResult.value || []);
      } else {
        console.warn('Failed to load case feedback:', feedbackResult.reason);
        setFeedback([]);
      }

      if (actionsResult.status === 'fulfilled') {
        setActions(actionsResult.value || []);
      } else {
        console.warn('Failed to load case actions:', actionsResult.reason);
        setActions([]);
      }

      if (facesResult.status === 'fulfilled') {
        setFaces(facesResult.value || []);
      } else {
        console.warn('Failed to load case faces:', facesResult.reason);
        setFaces([]);
      }

      if (matchesResult.status === 'fulfilled') {
        setMatches(matchesResult.value || []);
      } else {
        console.warn('Failed to load inventory matches:', matchesResult.reason);
        setMatches([]);
      }
    } catch (err) {
      console.error('Error fetching case data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch case data');
    } finally {
      setLoading(false);
    }
  }, [leadId, user?.id]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase.channel(`case-${leadId}`);

    // Subscribe to lead changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `id=eq.${leadId}`,
      },
      () => {
        fetchCaseData();
      }
    );

    // Subscribe to activities changes (consolidated table)
    // Listen for all activity types and update relevant state
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `lead_id=eq.${leadId}`,
      },
      async (payload) => {
        try {
          const activityType = (payload.new as any)?.activity_type;
          if (activityType === 'feedback') {
            const data = await getCaseFeedback(leadId);
            setFeedback(data || []);
          } else if (activityType === 'task') {
            const data = await getCaseActions(leadId);
            setActions(data || []);
          } else if (activityType === 'transfer') {
            const data = await getCaseFaces(leadId);
            setFaces(data || []);
          } else if (activityType === 'recommendation') {
            const data = await getInventoryMatches(leadId);
            setMatches(data || []);
          }
        } catch (err) {
          console.warn('Realtime update failed for activities:', err);
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, fetchCaseData]);

  return {
    lead,
    feedback,
    actions,
    faces,
    matches,
    loading,
    error,
    refetch: fetchCaseData,
  };
}

