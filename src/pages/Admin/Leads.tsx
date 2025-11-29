import React, { useState, useEffect, useMemo } from 'react';
import { Database, Search, Filter, Download, Eye, Plus, X, Check, ChevronDown, Edit, Trash2, UserPlus, MoreVertical, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '../../components/admin/DataTable';
import { supabase } from '../../lib/supabaseClient';
import { AssignLeadDialog } from '../../components/crm/AssignLeadDialog';
import { BulkStageChangeModal } from '../../components/crm/BulkStageChangeModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuthStore } from '../../store/auth';

interface Lead {
  id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_phone2?: string;
  client_phone3?: string;
  client_job_title?: string;
  company_name?: string;
  budget?: number | null;
  project_id: string;
  buyer_user_id?: string;
  assigned_to_id?: string;
  stage: string;
  status?: string; // Legacy field for compatibility
  is_sold?: boolean;
  source?: string | null;
  created_at: string;
  project?: {
    name: string;
  };
  buyer?: {
    name: string;
    email: string;
  };
  // Computed/aliased fields for display
  name?: string;
  phone?: string;
  email?: string;
}

interface NewLeadForm {
  client_name: string;
  client_phone: string;
  client_phone2: string;
  client_phone3: string;
  client_email: string;
  client_job_title: string;
  company_name: string;
  project_id: string;
  source: string;
  stage: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; region?: string; project_code?: string }>>([]);
  const [projectFilterSearch, setProjectFilterSearch] = useState('');
  const [showProjectFilterDropdown, setShowProjectFilterDropdown] = useState(false);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [newLead, setNewLead] = useState<NewLeadForm>({
    client_name: '',
    client_phone: '',
    client_phone2: '',
    client_phone3: '',
    client_email: '',
    client_job_title: '',
    company_name: '',
    project_id: '',
    source: 'manual',
    stage: 'New Lead',
  });
  
  // Control features state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBulkStageDialog, setShowBulkStageDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { profile } = useAuthStore();

  useEffect(() => {
    loadLeads();
    loadProjects();
    
    const channel = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);


  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name, region, project_code').order('name', { ascending: true });
    if (data) setProjects(data);
  };

  // Filter projects for searchable dropdown
  const filteredProjectsForFilter = useMemo(() => {
    if (!projectFilterSearch.trim()) {
      return projects; // Already sorted A-Z from query
    }
    
    const searchLower = projectFilterSearch.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.region?.toLowerCase().includes(searchLower) ||
        project.project_code?.toLowerCase().includes(searchLower)
      );
    });
  }, [projects, projectFilterSearch]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) {
      return projects;
    }
    
    const searchLower = projectSearch.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.region?.toLowerCase().includes(searchLower) ||
        project.project_code?.toLowerCase().includes(searchLower)
      );
    });
  }, [projects, projectSearch]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      console.log('Loading leads...');
      
      // Get total count first for accurate pagination info
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Total leads in database: ${count}`);
      
      // Supabase has a default limit of 1000, so we need to fetch in chunks
      // Fetch all leads in batches of 1000
      let allLeads: any[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase
          .from('leads')
          .select(`
            *,
            projects:project_id (name),
            profiles:buyer_user_id (name, email)
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1);
        
        if (batchError) {
          console.error('Error loading batch:', batchError);
          // If join fails, try without joins
          const { data: simpleBatchData, error: simpleBatchError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + batchSize - 1);
          
          if (simpleBatchError) {
            throw simpleBatchError;
          }
          
          if (simpleBatchData && simpleBatchData.length > 0) {
            allLeads = [...allLeads, ...simpleBatchData];
            offset += batchSize;
            hasMore = simpleBatchData.length === batchSize;
          } else {
            hasMore = false;
          }
          continue;
        }
        
        if (batchData && batchData.length > 0) {
          allLeads = [...allLeads, ...batchData];
          offset += batchSize;
          hasMore = batchData.length === batchSize;
          console.log(`Loaded ${allLeads.length} leads so far...`);
        } else {
          hasMore = false;
        }
      }
      
      const data = allLeads;
      
      if (!data || data.length === 0) {
        console.log('No leads found');
        setLeads([]);
        setLoading(false);
        return;
      }
      
      console.log(`✅ Fetched ${data.length} leads from database (in ${Math.ceil(data.length / batchSize)} batches)`);

      // Fetch projects and profiles separately for better reliability
      const projectIds = [...new Set(data.map((item: any) => item.project_id).filter(Boolean))];
      const userIds = [...new Set(data.map((item: any) => item.buyer_user_id).filter(Boolean))];

      let projectsMap: Record<string, { name: string }> = {};
      let profilesMap: Record<string, { name: string; email: string }> = {};

      if (projectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        
        if (projectsData) {
          projectsMap = projectsData.reduce((acc, p) => {
            acc[p.id] = { name: p.name };
            return acc;
          }, {} as Record<string, { name: string }>);
        }
      }

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.id] = { name: p.name || '', email: p.email || '' };
            return acc;
          }, {} as Record<string, { name: string; email: string }>);
        }
      }

      // Format leads with proper field mapping
      const formatted = data.map((item: any) => {
        // Check if this is a simple query result (no joins)
        if (!item.projects && !item.profiles && projectIds.length === 0 && userIds.length === 0) {
          return {
            ...item,
            name: item.client_name || item.name || 'Unknown',
            phone: item.client_phone || item.phone || '',
            email: item.client_email || item.email || '',
            status: item.stage || item.status || 'Unknown',
            stage: item.stage || item.status || 'New Lead',
            is_sold: item.is_sold === true || item.is_sold === 'true',
            assigned_to_id: item.assigned_to_id || null,
            project: null,
            buyer: null,
          };
        }
        
        // Format with joins
        return {
          ...item,
          name: item.client_name || item.name || 'Unknown',
          phone: item.client_phone || item.phone || '',
          email: item.client_email || item.email || '',
          status: item.stage || item.status || 'Unknown',
          stage: item.stage || item.status || 'New Lead',
          is_sold: item.is_sold === true || item.is_sold === 'true',
          assigned_to_id: item.assigned_to_id || null,
          project: item.projects || projectsMap[item.project_id] || null,
          buyer: item.profiles || profilesMap[item.buyer_user_id] || null,
        };
      });

      setLeads(formatted);
      console.log(`✅ Successfully loaded ${formatted.length} leads`);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique stages from leads for filter dropdown
  const availableStages = useMemo(() => {
    const stages = new Set<string>();
    leads.forEach(lead => {
      if (lead.stage) stages.add(lead.stage);
      if (lead.status) stages.add(lead.status);
    });
    return Array.from(stages).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter - check all possible fields
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (lead.name || lead.client_name || '').toLowerCase().includes(searchLower) ||
          (lead.phone || lead.client_phone || '').toLowerCase().includes(searchLower) ||
          (lead.email || lead.client_email || '').toLowerCase().includes(searchLower) ||
          (lead.company_name || '').toLowerCase().includes(searchLower) ||
          (lead.client_job_title || '').toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status/Stage filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'available') {
          // Available = not sold
          if (lead.is_sold === true) return false;
        } else if (statusFilter === 'sold') {
          // Sold = is_sold is true
          if (lead.is_sold !== true) return false;
        } else if (statusFilter === 'assigned') {
          // Assigned = has assigned_to_id
          if (!lead.assigned_to_id) return false;
        } else {
          // Otherwise match stage
          const leadStage = lead.stage || lead.status || '';
          if (leadStage !== statusFilter) return false;
        }
      }

      // Project filter
      if (projectFilter !== 'all') {
        if (lead.project_id !== projectFilter) return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter, projectFilter]);

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Project', 'Status', 'Created At'];
    const rows = filteredLeads.map((lead) => [
      lead.name || lead.client_name || '',
      lead.phone || lead.client_phone || '',
      lead.email || lead.client_email || '',
      lead.project?.name || '',
      lead.status || lead.stage || '',
      new Date(lead.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Control functions
  const handleEditLead = async (lead: Lead) => {
    setEditingLead(lead);
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          client_name: editingLead.client_name,
          client_phone: editingLead.client_phone,
          client_phone2: editingLead.client_phone2 || null,
          client_phone3: editingLead.client_phone3 || null,
          client_email: editingLead.client_email || null,
          client_job_title: editingLead.client_job_title || null,
          company_name: editingLead.company_name || null,
          stage: editingLead.stage,
          budget: editingLead.budget || null,
          source: editingLead.source || null,
          project_id: editingLead.project_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLead.id);

      if (error) throw error;
      
      setEditingLead(null);
      loadLeads();
      alert('Lead updated successfully!');
    } catch (err: any) {
      console.error('Error updating lead:', err);
      alert('Failed to update lead: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    
    setProcessing(true);
    try {
      // If lead was sold, we should also update available_leads
      if (deletingLead.is_sold && deletingLead.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('available_leads')
          .eq('id', deletingLead.project_id)
          .single();
        
        if (projectData) {
          await supabase
            .from('projects')
            .update({ 
              available_leads: Math.max(0, (projectData.available_leads || 0) - 1) 
            })
            .eq('id', deletingLead.project_id);
        }
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deletingLead.id);

      if (error) throw error;
      
      setDeletingLead(null);
      loadLeads();
      alert('Lead deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      alert('Failed to delete lead: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.size} lead(s)? This action cannot be undone.`)) return;
    
    setProcessing(true);
    try {
      const leadIdsArray = Array.from(selectedLeadIds);
      
      // Get projects for these leads to update available_leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('project_id, is_sold')
        .in('id', leadIdsArray);
      
      // Group by project and count sold leads
      const projectCounts: Record<string, number> = {};
      (leadsData || []).forEach(lead => {
        if (lead.is_sold && lead.project_id) {
          projectCounts[lead.project_id] = (projectCounts[lead.project_id] || 0) + 1;
        }
      });

      // Update available_leads for affected projects
      for (const [projectId, count] of Object.entries(projectCounts)) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('available_leads')
          .eq('id', projectId)
          .single();
        
        if (projectData) {
          await supabase
            .from('projects')
            .update({ 
              available_leads: Math.max(0, (projectData.available_leads || 0) - count) 
            })
            .eq('id', projectId);
        }
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIdsArray);

      if (error) throw error;
      
      setSelectedLeadIds(new Set());
      loadLeads();
      alert(`Successfully deleted ${leadIdsArray.length} lead(s)!`);
    } catch (err: any) {
      console.error('Error deleting leads:', err);
      alert('Failed to delete leads: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };



  const columns: Column<Lead>[] = [
    {
      key: 'name',
      label: 'Lead',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || row.client_name || 'Unknown'}</div>
          <div className="text-sm text-gray-600">{row.phone || row.client_phone || '-'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value, row) => <span className="text-gray-900">{value || row.client_email || '-'}</span>,
    },
    {
      key: 'project',
      label: 'Project',
      render: (_, row) => (
        <span className="text-gray-900">{row.project?.name || 'Unknown'}</span>
      ),
    },
    {
      key: 'buyer',
      label: 'Buyer',
      render: (_, row) => (
        <div>
          <div className="text-sm text-gray-900">{row.buyer?.name || '-'}</div>
          <div className="text-xs text-gray-600">{row.buyer?.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const stage = (value || row.stage || 'Unknown') as string;
        const getStatusColor = (stage: string) => {
          const lowerStage = stage.toLowerCase();
          if (lowerStage.includes('new') || lowerStage.includes('potential')) {
            return 'bg-blue-100 text-blue-800';
          }
          if (lowerStage.includes('hot') || lowerStage.includes('meeting')) {
            return 'bg-orange-100 text-orange-800';
          }
          if (lowerStage.includes('closed') || lowerStage.includes('deal')) {
            return 'bg-green-100 text-green-800';
          }
          if (lowerStage.includes('no answer') || lowerStage.includes('wrong') || lowerStage.includes('non potential')) {
            return 'bg-red-100 text-red-800';
          }
          return 'bg-gray-100 text-gray-800';
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(stage)}`}>
            {stage}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditLead(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit lead"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeletingLead(row)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete lead"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600 mt-1">View and manage all leads</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => setShowAddLeadDialog(true)}
            className="btn-admin-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
          <button 
            onClick={() => window.location.href = '/app/admin/leads/upload'}
            className="btn-admin-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Download className="h-4 w-4" />
            Upload CSV
          </button>
          <button 
            onClick={exportCSV} 
            className="btn-admin-secondary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="admin-card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, email, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white text-gray-900 appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="all">All Status</option>
              <option value="available">Available (Not Sold)</option>
              <option value="sold">Sold</option>
              <option value="assigned">Assigned</option>
              {availableStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter - Searchable */}
          <div className="relative min-w-[220px]">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={projectFilter === 'all' 
                  ? projectFilterSearch 
                  : projects.find(p => p.id === projectFilter)?.name || projectFilterSearch
                }
                onChange={(e) => {
                  setProjectFilterSearch(e.target.value);
                  setShowProjectFilterDropdown(true);
                  if (e.target.value === '') {
                    setProjectFilter('all');
                  }
                }}
                onFocus={() => setShowProjectFilterDropdown(true)}
                placeholder="All Projects"
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white text-gray-900 placeholder-gray-400"
              />
              {projectFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setProjectFilter('all');
                    setProjectFilterSearch('');
                    setShowProjectFilterDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Dropdown */}
              {showProjectFilterDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProjectFilterDropdown(false)}
                  />
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectFilter('all');
                        setProjectFilterSearch('');
                        setShowProjectFilterDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-100 ${
                        projectFilter === 'all' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-900">All Projects</span>
                      {projectFilter === 'all' && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                    {filteredProjectsForFilter.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No projects found
                      </div>
                    ) : (
                      filteredProjectsForFilter.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => {
                            setProjectFilter(project.id);
                            setProjectFilterSearch(project.name);
                            setShowProjectFilterDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                            projectFilter === project.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{project.name}</div>
                            {(project.region || project.project_code) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {project.region} {project.project_code && `• Code: ${project.project_code}`}
                              </div>
                            )}
                          </div>
                          {projectFilter === project.id && (
                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary & Bulk Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-gray-900">
              {loading ? (
                'Loading leads...'
              ) : (
                <>
                  {filteredLeads.length.toLocaleString()} lead{filteredLeads.length !== 1 ? 's' : ''} found
                  {filteredLeads.length !== leads.length && (
                    <span className="text-gray-500 ml-2">
                      (of {leads.length.toLocaleString()} total)
                    </span>
                  )}
                  {selectedLeadIds.size > 0 && (
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {selectedLeadIds.size} selected
                    </span>
                  )}
                </>
              )}
            </span>
            {(searchTerm || statusFilter !== 'all' || projectFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setProjectFilter('all');
                  setProjectFilterSearch('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
          {!loading && filteredLeads.length > 0 && (
            <span className="text-gray-500 text-sm">
              Page size: 50 leads per page
            </span>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeadIds.size > 0 && (
          <div className="admin-card p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssignDialog(true)}
                  className="btn-admin-secondary text-sm px-3 py-1.5 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign
                </button>
                <button
                  onClick={() => setShowBulkStageDialog(true)}
                  className="btn-admin-secondary text-sm px-3 py-1.5 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Change Stage
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={processing}
                  className="btn-admin-secondary text-sm px-3 py-1.5 flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedLeadIds(new Set())}
                  className="text-sm text-gray-600 hover:text-gray-900 px-2"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="admin-card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading leads...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a moment for large datasets</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredLeads}
            loading={loading}
            emptyMessage="No leads found. Try adjusting your filters."
            pagination
            pageSize={50}
            bulkActions={[]}
            getRowId={(row) => row.id}
            selectedRows={selectedLeadIds}
            onSelectionChange={setSelectedLeadIds}
            showCheckboxes={true}
          />
        )}
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newLead.client_name || !newLead.client_phone || !newLead.project_id) {
                alert('Please fill in required fields: Client Name, Phone, and Project');
                return;
              }

              setAddingLead(true);
              try {
                // Insert lead
                const { error: insertError } = await supabase
                  .from('leads')
                  .insert({
                    project_id: newLead.project_id,
                    client_name: newLead.client_name,
                    client_phone: newLead.client_phone,
                    client_phone2: newLead.client_phone2 || null,
                    client_phone3: newLead.client_phone3 || null,
                    client_email: newLead.client_email || null,
                    client_job_title: newLead.client_job_title || null,
                    company_name: newLead.company_name || null,
                    source: newLead.source || 'manual',
                    platform: newLead.source || 'manual',
                    stage: newLead.stage || 'New Lead',
                    is_sold: false,
                  });

                if (insertError) throw insertError;

                // Increment available leads count
                const { data: projectData } = await supabase
                  .from('projects')
                  .select('available_leads')
                  .eq('id', newLead.project_id)
                  .single();
                
                if (projectData) {
                  await supabase
                    .from('projects')
                    .update({ 
                      available_leads: (projectData.available_leads || 0) + 1 
                    })
                    .eq('id', newLead.project_id);
                }

                // Reset form and reload leads
                setNewLead({
                  client_name: '',
                  client_phone: '',
                  client_phone2: '',
                  client_phone3: '',
                  client_email: '',
                  client_job_title: '',
                  company_name: '',
                  project_id: '',
                  source: 'manual',
                  stage: 'New Lead',
                });
                setShowAddLeadDialog(false);
                loadLeads();
                alert('Lead added successfully!');
              } catch (error: any) {
                console.error('Error adding lead:', error);
                alert('Failed to add lead: ' + (error.message || 'Unknown error'));
              } finally {
                setAddingLead(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={newLead.client_name}
                  onChange={(e) => setNewLead({ ...newLead, client_name: e.target.value })}
                  required
                  placeholder="Ahmed Hassan"
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Client Phone *</Label>
                <Input
                  id="client_phone"
                  value={newLead.client_phone}
                  onChange={(e) => setNewLead({ ...newLead, client_phone: e.target.value })}
                  required
                  placeholder="+201234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_phone2">Client Phone 2</Label>
                <Input
                  id="client_phone2"
                  value={newLead.client_phone2}
                  onChange={(e) => setNewLead({ ...newLead, client_phone2: e.target.value })}
                  placeholder="+201234567891"
                />
              </div>
              <div>
                <Label htmlFor="client_phone3">Client Phone 3</Label>
                <Input
                  id="client_phone3"
                  value={newLead.client_phone3}
                  onChange={(e) => setNewLead({ ...newLead, client_phone3: e.target.value })}
                  placeholder="+201234567892"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client_email">Client Email</Label>
              <Input
                id="client_email"
                type="email"
                value={newLead.client_email}
                onChange={(e) => setNewLead({ ...newLead, client_email: e.target.value })}
                placeholder="ahmed@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_job_title">Job Title</Label>
                <Input
                  id="client_job_title"
                  value={newLead.client_job_title}
                  onChange={(e) => setNewLead({ ...newLead, client_job_title: e.target.value })}
                  placeholder="Sales Manager"
                />
              </div>
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  placeholder="ABC Company"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="project_id">Project *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="project_id"
                    value={newLead.project_id 
                      ? projects.find(p => p.id === newLead.project_id)?.name || projectSearch
                      : projectSearch
                    }
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setShowProjectDropdown(true);
                      if (e.target.value === '') {
                        setNewLead({ ...newLead, project_id: '' });
                      }
                    }}
                    onFocus={() => setShowProjectDropdown(true)}
                    placeholder="Search project..."
                    className="w-full px-4 pl-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newLead.project_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewLead({ ...newLead, project_id: '' });
                        setProjectSearch('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Dropdown */}
                  {showProjectDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowProjectDropdown(false)}
                      />
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredProjects.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No projects found
                          </div>
                        ) : (
                          filteredProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => {
                                setNewLead({ ...newLead, project_id: project.id });
                                setProjectSearch(project.name);
                                setShowProjectDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                                newLead.project_id === project.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div>
                                <div className="font-medium text-gray-900">{project.name}</div>
                                {project.region && (
                                  <div className="text-xs text-gray-500">
                                    {project.region} {project.project_code && `• Code: ${project.project_code}`}
                                  </div>
                                )}
                              </div>
                              {newLead.project_id === project.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={newLead.source}
                  onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="snapchat">Snapchat</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddLeadDialog(false)}
                disabled={addingLead}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingLead}>
                {addingLead ? 'Adding...' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          
          {editingLead && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_client_name">Client Name *</Label>
                  <Input
                    id="edit_client_name"
                    value={editingLead.client_name || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, client_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_client_phone">Client Phone *</Label>
                  <Input
                    id="edit_client_phone"
                    value={editingLead.client_phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, client_phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_client_phone2">Client Phone 2</Label>
                  <Input
                    id="edit_client_phone2"
                    value={editingLead.client_phone2 || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, client_phone2: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_client_phone3">Client Phone 3</Label>
                  <Input
                    id="edit_client_phone3"
                    value={editingLead.client_phone3 || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, client_phone3: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_client_email">Client Email</Label>
                <Input
                  id="edit_client_email"
                  type="email"
                  value={editingLead.client_email || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, client_email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_client_job_title">Job Title</Label>
                  <Input
                    id="edit_client_job_title"
                    value={editingLead.client_job_title || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, client_job_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company_name">Company Name</Label>
                  <Input
                    id="edit_company_name"
                    value={editingLead.company_name || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_budget">Budget (EGP)</Label>
                <Input
                  id="edit_budget"
                  type="number"
                  step="0.01"
                  value={editingLead.budget || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, budget: parseFloat(e.target.value) || null })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_project_id">Project *</Label>
                  <Select
                    value={editingLead.project_id}
                    onValueChange={(value) => setEditingLead({ ...editingLead, project_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_stage">Stage</Label>
                  <Select
                    value={editingLead.stage || 'New Lead'}
                    onValueChange={(value) => setEditingLead({ ...editingLead, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Lead">New Lead</SelectItem>
                      <SelectItem value="Potential">Potential</SelectItem>
                      <SelectItem value="Hot Case">Hot Case</SelectItem>
                      <SelectItem value="Meeting Done">Meeting Done</SelectItem>
                      <SelectItem value="Closed Deal">Closed Deal</SelectItem>
                      <SelectItem value="No Answer">No Answer</SelectItem>
                      <SelectItem value="Call Back">Call Back</SelectItem>
                      <SelectItem value="Whatsapp">Whatsapp</SelectItem>
                      <SelectItem value="Non Potential">Non Potential</SelectItem>
                      <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                      <SelectItem value="Switched Off">Switched Off</SelectItem>
                      <SelectItem value="Low Budget">Low Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit_source">Source</Label>
                <Select
                  value={editingLead.source || 'manual'}
                  onValueChange={(value) => setEditingLead({ ...editingLead, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="snapchat">Snapchat</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLead(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLead} onOpenChange={(open) => !open && setDeletingLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Lead
            </DialogTitle>
          </DialogHeader>
          
          {deletingLead && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{deletingLead.client_name || deletingLead.name || 'Unknown'}</p>
                <p className="text-sm text-gray-600">{deletingLead.client_phone || deletingLead.phone || '-'}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingLead(null)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteLead}
                  disabled={processing}
                >
                  {processing ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      {showAssignDialog && (
        <AssignLeadDialog
          leadIds={Array.from(selectedLeadIds)}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedLeadIds(new Set());
          }}
          onSuccess={() => {
            loadLeads();
          }}
        />
      )}

      {/* Bulk Change Stage Dialog */}
      {showBulkStageDialog && (
        <BulkStageChangeModal
          isOpen={showBulkStageDialog}
          leadIds={Array.from(selectedLeadIds)}
          onClose={() => {
            setShowBulkStageDialog(false);
            setSelectedLeadIds(new Set());
          }}
          onSuccess={async () => {
            await loadLeads();
          }}
        />
      )}
    </div>
  );
}

