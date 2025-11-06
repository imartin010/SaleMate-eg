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

      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select(`
          *,
          project:projects(id, name, region),
          owner:profiles!leads_owner_id_fkey(id, name),
          assigned_to:profiles!leads_assigned_to_id_fkey(id, name)
        `)
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;
      setLead(leadData as Lead);

      // Fetch case feedback, actions, faces, and matches in parallel
      const [feedbackData, actionsData, facesData, matchesData] = await Promise.all([
        getCaseFeedback(leadId),
        getCaseActions(leadId),
        getCaseFaces(leadId),
        getInventoryMatches(leadId),
      ]);

      setFeedback(feedbackData || []);
      setActions(actionsData || []);
      setFaces(facesData || []);
      setMatches(matchesData || []);
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

    // Subscribe to case_feedback changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'case_feedback',
        filter: `lead_id=eq.${leadId}`,
      },
      async () => {
        const data = await getCaseFeedback(leadId);
        setFeedback(data || []);
      }
    );

    // Subscribe to case_actions changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'case_actions',
        filter: `lead_id=eq.${leadId}`,
      },
      async () => {
        const data = await getCaseActions(leadId);
        setActions(data || []);
      }
    );

    // Subscribe to case_faces changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'case_faces',
        filter: `lead_id=eq.${leadId}`,
      },
      async () => {
        const data = await getCaseFaces(leadId);
        setFaces(data || []);
      }
    );

    // Subscribe to inventory_matches changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory_matches',
        filter: `lead_id=eq.${leadId}`,
      },
      async () => {
        const data = await getInventoryMatches(leadId);
        setMatches(data || []);
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

