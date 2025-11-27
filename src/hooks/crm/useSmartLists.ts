import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { LeadFilters } from './useLeadFilters';

export interface SmartList {
  id: string;
  name: string;
  description?: string;
  criteria: LeadFilters;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSmartLists() {
  const { user } = useAuthStore();
  const [smartLists, setSmartLists] = useState<SmartList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSmartLists = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crm_smart_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSmartLists(data || []);
    } catch (err) {
      console.error('Error fetching smart lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch smart lists');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createSmartList = useCallback(async (name: string, description: string, criteria: LeadFilters) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('crm_smart_lists')
        .insert({
          user_id: user.id,
          name,
          description,
          criteria,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchSmartLists();
      return data;
    } catch (err) {
      console.error('Error creating smart list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create smart list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSmartLists]);

  const updateSmartList = useCallback(async (id: string, updates: { name?: string; description?: string; criteria?: LeadFilters; is_active?: boolean }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('crm_smart_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchSmartLists();
      return data;
    } catch (err) {
      console.error('Error updating smart list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update smart list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSmartLists]);

  const deleteSmartList = useCallback(async (id: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('crm_smart_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchSmartLists();
    } catch (err) {
      console.error('Error deleting smart list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete smart list';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSmartLists]);

  useEffect(() => {
    fetchSmartLists();
  }, [fetchSmartLists]);

  return {
    smartLists,
    loading,
    error,
    createSmartList,
    updateSmartList,
    deleteSmartList,
    fetchSmartLists,
  };
}

