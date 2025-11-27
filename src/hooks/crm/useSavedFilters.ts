import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { LeadFilters } from './useLeadFilters';

export interface SavedFilter {
  id: string;
  name: string;
  filters: LeadFilters;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedFilters() {
  const { user } = useAuthStore();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedFilters = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crm_saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSavedFilters(data || []);
    } catch (err) {
      console.error('Error fetching saved filters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch saved filters');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const saveFilter = useCallback(async (name: string, filters: LeadFilters, isDefault = false) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from('crm_saved_filters')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data, error: saveError } = await supabase
        .from('crm_saved_filters')
        .insert({
          user_id: user.id,
          name,
          filters,
          is_default: isDefault,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      await fetchSavedFilters();
      return data;
    } catch (err) {
      console.error('Error saving filter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save filter';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSavedFilters]);

  const updateFilter = useCallback(async (id: string, updates: { name?: string; filters?: LeadFilters; is_default?: boolean }) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      // If setting as default, unset other defaults
      if (updates.is_default) {
        await supabase
          .from('crm_saved_filters')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data, error: updateError } = await supabase
        .from('crm_saved_filters')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchSavedFilters();
      return data;
    } catch (err) {
      console.error('Error updating filter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update filter';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSavedFilters]);

  const deleteFilter = useCallback(async (id: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('crm_saved_filters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchSavedFilters();
    } catch (err) {
      console.error('Error deleting filter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete filter';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id, fetchSavedFilters]);

  const loadFilter = useCallback((savedFilter: SavedFilter): LeadFilters => {
    return savedFilter.filters;
  }, []);

  useEffect(() => {
    fetchSavedFilters();
  }, [fetchSavedFilters]);

  return {
    savedFilters,
    loading,
    error,
    saveFilter,
    updateFilter,
    deleteFilter,
    loadFilter,
    fetchSavedFilters,
  };
}

