import { useState, useMemo, useCallback } from 'react';
import { Lead, LeadStage } from './useLeads';

export interface LeadFilters {
  search: string;
  stage?: LeadStage | 'all';
  stages?: LeadStage[]; // For filtering by multiple stages (e.g., quality leads)
  project?: string | 'all';
  platform?: string | 'all';
  dateRange?: 'week' | 'month' | 'quarter' | 'all';
  hasBudget?: boolean; // For pipeline filter (leads with budget entered)
}

export function useLeadFilters(leads: Lead[]) {
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    stage: undefined,
    stages: undefined,
    project: undefined,
    platform: undefined,
    dateRange: undefined,
    hasBudget: undefined,
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

    // Multiple stages filter (for quality leads) - takes precedence over single stage
    if (filters.stages && filters.stages.length > 0) {
      result = result.filter((lead) => filters.stages!.includes(lead.stage));
    } else if (filters.stage && filters.stage !== 'all') {
      // Stage filter (single stage) - only apply if stages filter is not set
      result = result.filter((lead) => lead.stage === filters.stage);
    }

    // Budget filter (for pipeline - leads with budget entered)
    if (filters.hasBudget !== undefined) {
      if (filters.hasBudget) {
        result = result.filter((lead) => lead.budget !== null && lead.budget !== undefined && lead.stage !== 'Closed Deal');
      } else {
        result = result.filter((lead) => lead.budget === null || lead.budget === undefined);
      }
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

  const updateMultipleFilters = useCallback((updates: Partial<LeadFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    // Reset all filters to their default/empty state
    // Using direct object instead of functional update to ensure clean reset
    setFilters({
      search: '',
      stage: undefined,
      stages: undefined,
      project: undefined,
      platform: undefined,
      dateRange: undefined,
      hasBudget: undefined,
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      (filters.stage && filters.stage !== 'all') ||
      (filters.stages && filters.stages.length > 0) ||
      (filters.project && filters.project !== 'all') ||
      (filters.platform && filters.platform !== 'all') ||
      (filters.dateRange && filters.dateRange !== 'all') ||
      filters.hasBudget !== undefined
    );
  }, [filters]);

  return {
    filters,
    filteredLeads,
    updateFilter,
    updateMultipleFilters,
    clearFilters,
    hasActiveFilters,
  };
}

