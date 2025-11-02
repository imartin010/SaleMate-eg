import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Download, Eye } from 'lucide-react';
import { DataTable, Column } from '../../components/admin/DataTable';
import { supabase } from '../../lib/supabaseClient';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  project_id: string;
  buyer_user_id?: string;
  assigned_to_id?: string;
  status: string;
  created_at: string;
  project?: {
    name: string;
  };
  buyer?: {
    name: string;
    email: string;
  };
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

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
    const { data } = await supabase.from('projects').select('id, name');
    if (data) setProjects(data);
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          projects:project_id (name),
          profiles:buyer_user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        project: item.projects,
        buyer: item.profiles,
      }));

      setLeads(formatted);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesProject = projectFilter === 'all' || lead.project_id === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Project', 'Status', 'Created At'];
    const rows = filteredLeads.map((lead) => [
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.project?.name || '',
      lead.status || '',
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

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      label: 'Lead',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{row.phone}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <span className="text-gray-900">{value || '-'}</span>,
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
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value as string}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600 mt-1">View and manage all leads</p>
        </div>
        <button onClick={exportCSV} className="admin-btn admin-btn-secondary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="assigned">Assigned</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLeads}
        loading={loading}
        emptyMessage="No leads found"
        pagination
        pageSize={50}
      />
    </div>
  );
}

