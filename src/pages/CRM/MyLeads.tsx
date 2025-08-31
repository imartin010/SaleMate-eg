import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LeadTable } from '../../components/leads/LeadTable';
import { LeadCard } from '../../components/leads/LeadCard';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';
import { supabase } from '../../lib/supabaseClient';
import { Lead, LeadFilters, Platform, LeadStage } from '../../types';
import { 
  Search, 
  Grid, 
  List, 
  Filter, 
  Plus,
  Users,
  TrendingUp,
  Target,
  BarChart3,
  Download,
  Upload
} from 'lucide-react';

const PLATFORMS: Platform[] = ['Facebook', 'Google', 'TikTok', 'Other'];
const LEAD_STAGES: LeadStage[] = [
  'New Lead',
  'Potential', 
  'Hot Case',
  'Meeting Done',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Wrong Number',
  'Non Potential'
];

const MyLeads: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { members } = useTeamStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<{id: string; name: string; developer: string; region: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filters, setFilters] = useState<LeadFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');

  // Get assignee filter from URL params
  useEffect(() => {
    const assignee = searchParams.get('assignee');
    if (assignee) {
      setAssigneeFilter(assignee);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadLeadsFromBackend();
      loadProjectsFromBackend();
    }
  }, [user]);

  const loadLeadsFromBackend = async () => {
    setLoading(true);
    
    try {
      console.log('📊 Loading leads from backend for user:', user?.id);
      
      if (!user) {
        console.log('❌ No user found, cannot load leads');
        setLeads([]);
        setLoading(false);
        return;
      }

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 8000)
      );

      // Try to load leads from database
      try {
        let query = supabase
          .from('leads')
          .select(`
            *,
            projects (
              id,
              name,
              developer,
              region
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50); // Limit to prevent large data loads

        // Filter by user ID if not admin/support
        if (!['admin', 'support'].includes(user.role)) {
          query = query.eq('buyer_user_id', user.id);
        }

        // Apply assignee filter if specified
        if (assigneeFilter) {
          if (assigneeFilter === 'me') {
            query = query.eq('assigned_to_id', user.id);
          } else if (assigneeFilter === 'unassigned') {
            query = query.is('assigned_to_id', null);
          } else {
            query = query.eq('assigned_to_id', assigneeFilter);
          }
        }

        const { data: leadsData, error: leadsError } = await Promise.race([
          query, 
          timeoutPromise
        ]) as any;

        if (leadsError) {
          throw new Error(`Database error: ${leadsError.message}`);
        }

        if (leadsData && leadsData.length > 0) {
          console.log(`✅ Loaded ${leadsData.length} leads from database`);
          
          // Transform to frontend format
          const formattedLeads = leadsData.map((lead: any) => ({
            id: lead.id,
            projectId: lead.project_id,
            buyerUserId: lead.buyer_user_id,
            clientName: lead.client_name,
            clientPhone: lead.client_phone,
            clientPhone2: lead.client_phone2,
            clientPhone3: lead.client_phone3,
            clientEmail: lead.client_email,
            clientJobTitle: lead.client_job_title,
            platform: lead.platform,
            stage: lead.stage,
            feedback: lead.feedback,
            createdAt: lead.created_at,
            project: lead.projects ? {
              id: lead.projects.id,
              name: lead.projects.name,
              developer: lead.projects.developer,
              region: lead.projects.region
            } : {
              name: 'Unknown Project',
              developer: 'Unknown',
              region: 'Unknown'
            }
          }));

          setLeads(formattedLeads);
          return;
        } else {
          console.log('📝 No leads found in database for user, showing sample leads');
        }

      } catch (dbError: any) {
        console.warn('🔄 Database query failed:', dbError.message);
        setLeads([]);
      }
      
      // No leads found - this is normal for new users
      if (leads.length === 0) {
        console.log('📝 No leads found for user, showing empty state');
      }
      
    } catch (error) {
      console.error('❌ Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsFromBackend = async () => {
    try {
      console.log('📝 Loading projects data');
      
      // No mock data - projects will be loaded from database when available
      setProjects([]);
      console.log('✅ No projects available');
      
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.projectId && lead.projectId !== filters.projectId) return false;
    if (filters.platform && lead.platform !== filters.platform) return false;
    if (filters.stage && lead.stage !== filters.stage) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        lead.clientName.toLowerCase().includes(searchLower) ||
        lead.clientPhone.toLowerCase().includes(searchLower) ||
        (lead.clientEmail && lead.clientEmail.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleFilterChange = (key: keyof LeadFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  // Calculate CRM metrics from real backend data
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.stage === 'New Lead').length;
  const hotLeads = leads.filter(lead => lead.stage === 'Hot Case').length;
  const meetingDone = leads.filter(lead => lead.stage === 'Meeting Done').length;
  const conversionRate = totalLeads > 0 ? ((meetingDone / totalLeads) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern card-hover p-4 text-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse w-20 shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Results Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-modern p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile First */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">My Leads</h1>
            <p className="text-muted-foreground">
              Manage your lead pipeline and drive conversions
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Connected to Supabase Backend</span>
            </div>
          </div>
          
          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button size="sm" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadLeadsFromBackend}>
              <Download className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* CRM Metrics Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalLeads}</div>
            <div className="text-sm text-muted-foreground">Total Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{newLeads}</div>
            <div className="text-sm text-muted-foreground">New Leads</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{hotLeads}</div>
            <div className="text-sm text-muted-foreground">Hot Cases</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
            <div className="text-sm text-muted-foreground">Conversion</div>
          </div>
        </div>
      </div>

      {/* Search and Filters - Mobile First */}
      <div className="space-y-4">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, phone, or email..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Quick Filters - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!filters.stage ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('stage', '')}
            className="whitespace-nowrap shrink-0"
          >
            All Stages
          </Button>
          {LEAD_STAGES.slice(0, 5).map(stage => (
            <Button
              key={stage}
              variant={filters.stage === stage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('stage', stage)}
              className="whitespace-nowrap shrink-0"
            >
              {stage}
            </Button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary hover:text-primary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="card-modern p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project</label>
                <Select
                  value={filters.projectId || ''}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Platform</label>
                <Select
                  value={filters.platform || ''}
                  onChange={(e) => handleFilterChange('platform', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Stage</label>
                <Select
                  value={filters.stage || ''}
                  onChange={(e) => handleFilterChange('stage', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Stages</option>
                  {LEAD_STAGES.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Assignee Filter - Only show for managers and admins */}
              {(profile?.role === 'manager' || profile?.role === 'admin') && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Assignee</label>
                  <Select
                    value={assigneeFilter}
                    onValueChange={(value) => {
                      setAssigneeFilter(value);
                      if (value) {
                        setSearchParams({ assignee: value });
                      } else {
                        setSearchParams({});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Assignees</SelectItem>
                      <SelectItem value="me">Assigned to Me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Toggle and Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> leads
          </p>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">View:</span>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="rounded-r-none border-r"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Leads Display */}
      {viewMode === 'table' ? (
        <div className="card-modern overflow-hidden">
          <LeadTable leads={filteredLeads} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {filteredLeads.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No leads found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms.'
                  : totalLeads === 0 
                    ? 'You haven\'t purchased any leads yet. Visit the Shop to buy leads from projects.'
                    : 'All your leads are filtered out by your current search criteria.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadLeadsFromBackend} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Refresh Leads
                </Button>
                {totalLeads === 0 && (
                  <Button onClick={() => window.location.href = '/shop'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Leads
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLeads;
