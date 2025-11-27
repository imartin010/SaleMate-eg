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
  // Advanced search filters
  createdDateFrom?: string; // ISO date string
  createdDateTo?: string; // ISO date string
  budgetMin?: number;
  budgetMax?: number;
  assignedTo?: string; // user ID
  owner?: string; // user ID
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
    createdDateFrom: undefined,
    createdDateTo: undefined,
    budgetMin: undefined,
    budgetMax: undefined,
    assignedTo: undefined,
    owner: undefined,
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

    // Date range filter (legacy - for backward compatibility)
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

    // Advanced date range filters (takes precedence over legacy dateRange)
    if (filters.createdDateFrom) {
      const fromDate = new Date(filters.createdDateFrom);
      result = result.filter((lead) => new Date(lead.created_at) >= fromDate);
    }
    if (filters.createdDateTo) {
      const toDate = new Date(filters.createdDateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      result = result.filter((lead) => new Date(lead.created_at) <= toDate);
    }

    // Budget range filters
    if (filters.budgetMin !== undefined) {
      result = result.filter((lead) => lead.budget !== null && lead.budget !== undefined && lead.budget >= filters.budgetMin!);
    }
    if (filters.budgetMax !== undefined) {
      result = result.filter((lead) => lead.budget !== null && lead.budget !== undefined && lead.budget <= filters.budgetMax!);
    }

    // Assigned to filter
    if (filters.assignedTo) {
      result = result.filter((lead) => lead.assigned_to_id === filters.assignedTo);
    }

    // Owner filter
    if (filters.owner) {
      result = result.filter((lead) => lead.owner_id === filters.owner);
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
      createdDateFrom: undefined,
      createdDateTo: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      assignedTo: undefined,
      owner: undefined,
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
      filters.hasBudget !== undefined ||
      filters.createdDateFrom !== undefined ||
      filters.createdDateTo !== undefined ||
      filters.budgetMin !== undefined ||
      filters.budgetMax !== undefined ||
      filters.assignedTo !== undefined ||
      filters.owner !== undefined
    );
  }, [filters]);

  const loadFilters = useCallback((newFilters: Partial<LeadFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    filters,
    filteredLeads,
    updateFilter,
    updateMultipleFilters,
    clearFilters,
    loadFilters,
    hasActiveFilters,
  };
}

