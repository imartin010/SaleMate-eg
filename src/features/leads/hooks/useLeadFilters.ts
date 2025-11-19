import { useState, useMemo, useCallback } from 'react';
import { Lead, LeadStage } from './useLeads';

export interface LeadFilters {
  search: string;
  stage?: LeadStage | 'all';
  project?: string | 'all';
  platform?: string | 'all';
  dateRange?: 'week' | 'month' | 'quarter' | 'all';
}

export function useLeadFilters(leads: Lead[]) {
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    stage: 'all',
    project: 'all',
    platform: 'all',
    dateRange: 'all',
  });

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.client_name.toLowerCase().includes(searchLower) ||
          lead.client_phone.includes(searchLower) ||
          lead.client_email?.toLowerCase().includes(searchLower) ||
          lead.project?.name.toLowerCase().includes(searchLower)
      );
    }

    // Stage filter
    if (filters.stage && filters.stage !== 'all') {
      result = result.filter((lead) => lead.stage === filters.stage);
    }

    // Project filter
    if (filters.project && filters.project !== 'all') {
      result = result.filter((lead) => lead.project_id === filters.project);
    }

    // Platform filter
    if (filters.platform && filters.platform !== 'all') {
      result = result.filter((lead) => lead.source === filters.platform);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      result = result.filter(
        (lead) => new Date(lead.created_at) >= cutoffDate
      );
    }

    return result;
  }, [leads, filters]);

  const updateFilter = useCallback(
    <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      stage: 'all',
      project: 'all',
      platform: 'all',
      dateRange: 'all',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      (filters.stage && filters.stage !== 'all') ||
      (filters.project && filters.project !== 'all') ||
      (filters.platform && filters.platform !== 'all') ||
      (filters.dateRange && filters.dateRange !== 'all')
    );
  }, [filters]);

  return {
    filters,
    filteredLeads,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

