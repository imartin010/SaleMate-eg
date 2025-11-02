import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, XCircle, Eye, Search, Filter, Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface PurchaseRequest {
  id: string;
  buyer_user_id: string;
  project_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  total_cost: number;
  admin_notes?: string;
  created_at: string;
  validated_at?: string;
  validated_by?: string;
  user?: {
    name: string;
    email: string;
  };
  project?: {
    name: string;
    developer: string;
    region: string;
  };
}

export default function PurchaseRequests() {
  const { profile: currentProfile } = useAuthStore();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
    
    const channel = supabase
      .channel('purchase_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_purchase_requests' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify admin access
      if (!currentProfile || currentProfile.role !== 'admin') {
        console.warn('Admin access required for purchase requests');
      }
      
      // Fetch purchase requests first
      const { data: requestsData, error: requestsErr } = await supabase
        .from('lead_purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsErr) {
        console.error('Purchase requests error details:', {
          code: requestsErr.code,
          message: requestsErr.message,
          details: requestsErr.details,
          hint: requestsErr.hint,
        });
        // Check if table doesn't exist
        if (requestsErr.message?.includes('could not find the table') || requestsErr.message?.includes('does not exist')) {
          setError('The lead_purchase_requests table does not exist. Please run the migration or verify the table exists in your database.');
        } else if (requestsErr.code === 'PGRST116' || requestsErr.message?.includes('permission denied')) {
          setError('Permission denied. Please check your admin role and RLS policies.');
        } else {
          setError(`Failed to load requests: ${requestsErr.message || 'Unknown error'}`);
        }
        setRequests([]);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get unique user IDs and project IDs
      const userIds = [...new Set(requestsData.map((r: any) => r.buyer_user_id).filter(Boolean))];
      const projectIds = [...new Set(requestsData.map((r: any) => r.project_id).filter(Boolean))];

      // Fetch profiles and projects in parallel
      const [profilesResult, projectsResult] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, name, email')
              .in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase
              .from('projects')
              .select('id, name, developer, region')
              .in('id', projectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesResult.error) {
        console.error('Profiles fetch error:', profilesResult.error);
      }
      if (projectsResult.error) {
        console.error('Projects fetch error:', projectsResult.error);
      }

      // Create lookup maps
      const profilesMap = new Map(
        (profilesResult.data || []).map((p: any) => [p.id, { name: p.name, email: p.email }])
      );
      const projectsMap = new Map(
        (projectsResult.data || []).map((p: any) => [
          p.id,
          { name: p.name, developer: p.developer, region: p.region },
        ])
      );

      // Join the data
      const formatted = requestsData.map((item: any) => ({
        ...item,
        user: profilesMap.get(item.buyer_user_id) || { name: 'Unknown', email: '' },
        project: projectsMap.get(item.project_id) || { name: 'Unknown', developer: '', region: '' },
      }));

      setRequests(formatted);
    } catch (err) {
      console.error('Error loading purchase requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const approveRequest = async (requestId: string) => {
    try {
      setProcessing(true);
      const { error: err } = await (supabase as any).rpc('rpc_approve_request', {
        p_request: requestId,
        p_admin_notes: adminNotes || null,
      });

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'approve',
        entity: 'lead_purchase_requests',
        entity_id: requestId,
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      setProcessing(true);
      const { error: err } = await (supabase as any).rpc('rpc_reject_request', {
        p_request: requestId,
        p_admin_notes: adminNotes || null,
      });

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'reject',
        entity: 'lead_purchase_requests',
        entity_id: requestId,
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const exportCSV = () => {
    const headers = ['User', 'Project', 'Quantity', 'Cost', 'Status', 'Date'];
    const rows = filteredRequests.map((req) => [
      req.user?.name || '',
      req.project?.name || '',
      req.quantity.toString(),
      req.total_cost?.toString() || '0',
      req.status,
      new Date(req.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column<PurchaseRequest>[] = [
    {
      key: 'user',
      label: 'User',
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.user?.name || 'Unknown'}</div>
          <div className="text-sm text-gray-600">{row.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'project',
      label: 'Project',
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.project?.name || 'Unknown'}</div>
          <div className="text-sm text-gray-600">{row.project?.region}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-gray-900">
          EGP {Number(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value as string),
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
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRequest(row);
            }}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const totalRevenue = requests
    .filter((r) => r.status === 'approved' || r.status === 'completed')
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-gray-600 mt-1">Manage lead purchase requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="admin-btn admin-btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                EGP {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{requests.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card flex items-center gap-4">
        <div className="flex-1 admin-search">
          <Search className="admin-search-icon h-5 w-5" />
          <input
            type="text"
            placeholder="Search by user, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-card p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        loading={loading}
        emptyMessage="No purchase requests found"
        pagination
        pageSize={20}
      />

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="admin-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Purchase Request Details</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-600">User</label>
                <p className="text-gray-900">
                  {selectedRequest.user?.name} ({selectedRequest.user?.email})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Project</label>
                <p className="text-gray-900">{selectedRequest.project?.name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.project?.developer} - {selectedRequest.project?.region}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-gray-900 text-xl font-semibold">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Cost</label>
                  <p className="text-gray-900 text-xl font-semibold">
                    EGP {Number(selectedRequest.total_cost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Request Date</label>
                <p className="text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
              {selectedRequest.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                  <p className="text-gray-900">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="admin-input w-full"
                    rows={3}
                    placeholder="Add notes about this request..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(selectedRequest.id)}
                    disabled={processing}
                    className="admin-btn admin-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => rejectRequest(selectedRequest.id)}
                    disabled={processing}
                    className="admin-btn admin-btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setAdminNotes('');
                    }}
                    className="admin-btn admin-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

