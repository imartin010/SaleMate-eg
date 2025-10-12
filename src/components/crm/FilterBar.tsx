import React from 'react';
import { Search, Filter, X, RefreshCw, Plus } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { LeadFilters } from '../../hooks/crm/useLeadFilters';
import { LeadStage } from '../../hooks/crm/useLeads';

interface FilterBarProps {
  filters: LeadFilters;
  onFilterChange: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onRefresh: () => void;
  onAddLead: () => void;
  projects?: Array<{ id: string; name: string }>;
  loading?: boolean;
}

const STAGES: (LeadStage | 'all')[] = [
  'all',
  'New Lead',
  'Potential',
  'Hot Case',
  'Meeting Done',
  'Closed Deal',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Non Potential',
  'Wrong Number',
  'Switched Off',
  'Low Budget',
];

const PLATFORMS = ['all', 'Facebook', 'Google', 'TikTok', 'Other'];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  onRefresh,
  onAddLead,
  projects = [],
  loading,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, email..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stage Filter */}
        <Select
          value={filters.stage || 'all'}
          onValueChange={(value) => onFilterChange('stage', value as LeadStage | 'all')}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage === 'all' ? 'All Stages' : stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project Filter */}
        <Select
          value={filters.project || 'all'}
          onValueChange={(value) => onFilterChange('project', value)}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Platform Filter */}
        <Select
          value={filters.platform || 'all'}
          onValueChange={(value) => onFilterChange('platform', value)}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform === 'all' ? 'All Platforms' : platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select
          value={filters.dateRange || 'all'}
          onValueChange={(value) => onFilterChange('dateRange', value as LeadFilters['dateRange'])}
        >
          <SelectTrigger className="w-full lg:w-[180px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full lg:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}

        {/* Refresh */}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="w-full lg:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Add Lead */}
        <Button
          onClick={onAddLead}
          className="w-full lg:w-auto bg-[#257CFF] hover:bg-[#1a5fd4]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>
    </div>
  );
};

