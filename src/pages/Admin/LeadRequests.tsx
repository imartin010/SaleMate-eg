import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Eye, Search, Filter, Download, FileText, Clock, Building, DollarSign, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface LeadRequest {
  id: string;
  user_id: string;
  project_name: string;
  project_id?: string | null;
  quantity: number;
  budget: number;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'rejected';
  notes?: string | null;
  fulfilled_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
  project?: {
    name: string;
    developer: string;
    region: string;
  } | null;
}

export default function LeadRequests() {
  const { profile: currentProfile } = useAuthStore();
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeadRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
    
    const channel = supabase
      .channel('lead_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_requests' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  // Load project details when viewing details
  useEffect(() => {
    if (selectedRequest?.project_id) {
      const fetchProject = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: projectData, error: projectError } = await (supabase as any)
            .from('projects')
            .select('id, name, region')
            .eq('id', selectedRequest.project_id)
            .single();

          if (!projectError && projectData) {
            setSelectedRequest(prev => prev ? {
              ...prev,
              project: {
                name: projectData.name || '',
                developer: (projectData.name || '').split(' - ')[0] || 'Unknown Developer',
                region: projectData.region || 'Unknown'
              }
            } : null);
          }
        } catch (err) {
          console.error('Error fetching project:', err);
        }
      };
      fetchProject();
    }
  }, [selectedRequest?.id]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentProfile || currentProfile.role !== 'admin') {
        console.warn('Admin access required for lead requests');
      }
      
      // Fetch lead requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requestsData, error: requestsErr } = await (supabase as any)
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'commerce')
        .eq('commerce_type', 'request')
        .order('created_at', { ascending: false });

      if (requestsErr) {
        console.error('Lead requests error details:', {
          code: requestsErr.code,
          message: requestsErr.message,
          details: requestsErr.details,
          hint: requestsErr.hint,
        });
        
        if (requestsErr.message?.includes('could not find the table') || requestsErr.message?.includes('does not exist')) {
          setError('The lead_requests table does not exist. Please run the migration 20251103000004_create_lead_requests_table.sql');
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
      const userIds = [...new Set(requestsData.map((r: any) => r.user_id).filter(Boolean))];
      const projectIds = [...new Set(requestsData.map((r: any) => r.project_id).filter(Boolean))];

      // Fetch profiles
      const profilesResult =
        userIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, name, email')
              .in('id', userIds)
          : { data: [], error: null };

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
      }

      // Fetch projects (optional, since project_id can be null)
      let projectsResult = { data: [], error: null };
      if (projectIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projectsResult = await (supabase as any)
          .from('projects')
          .select('id, name, region, developers:developers ( name )')
          .in('id', projectIds);
      }

      const profilesMap = new Map(
        (profilesResult.data || []).map((p: any) => [p.id, { name: p.name || 'Unknown', email: p.email || '' }])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectsMap = new Map(
        (projectsResult.data || []).map((p: any) => [
          p.id,
          {
            name: p.name || 'Unknown',
            developer: p.developer?.name || 'Unknown',
            region: p.region || 'Unknown'
          }
        ])
      );

      // Combine data
      const enrichedRequests: LeadRequest[] = requestsData.map((req: any) => ({
        ...req,
        user: profilesMap.get(req.user_id) || { name: 'Unknown', email: '' },
        project: req.project_id ? (projectsMap.get(req.project_id) || null) : null,
      }));

      setRequests(enrichedRequests);
    } catch (err: unknown) {
      console.error('Error loading lead requests:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load lead requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateRequestStatus = async (requestId: string, newStatus: 'fulfilled' | 'rejected' | 'cancelled') => {
    try {
      setProcessing(true);
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'fulfilled') {
        updateData.fulfilled_at = new Date().toISOString();
      }

      if (adminNotes) {
        updateData.notes = (updateData.notes || '') + `\n[Admin Notes] ${adminNotes}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('transactions')
        .update(updateData)
        .eq('id', requestId);

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: newStatus,
        entity: 'lead_requests',
        entity_id: requestId,
        changes: {
          status: newStatus,
          notes: adminNotes || null,
        },
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
      
      alert(`Successfully ${newStatus} the lead request!`);
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : `Failed to ${newStatus} request`);
    } finally {
      setProcessing(false);
    }
  };

  const exportCSV = () => {
    const headers = ['User', 'Project Name', 'Quantity', 'Budget', 'Status', 'Date'];
    const rows = filteredRequests.map((req) => [
      req.user?.name || '',
      req.project_name || '',
      req.quantity.toString(),
      req.budget?.toString() || '0',
      req.status,
      new Date(req.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-requests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead requests...</p>
        </div>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Lead Requests</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Lead Requests</h1>
          <p className="text-gray-600 mt-1">Manage user requests for leads from specific projects</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fulfilled</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{fulfilledCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, project name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Lead Requests Found"
          description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No lead requests have been submitted yet'}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{req.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{req.user?.email || ''}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{req.project_name}</div>
                      {req.project && (
                        <div className="text-xs text-gray-500">{req.project.developer} • {req.project.region}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Users className="h-4 w-4 text-blue-600" />
                        {req.quantity}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        EGP {req.budget.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'fulfilled'
                            ? 'bg-green-100 text-green-800'
                            : req.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Lead Request Details</h2>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="text-gray-900 mt-1">
                    {selectedRequest.user?.name || 'Unknown'} ({selectedRequest.user?.email || 'No email'})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Name</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    {selectedRequest.project_name}
                  </p>
                  {selectedRequest.project && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedRequest.project.developer} • {selectedRequest.project.region}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Leads Quantity</label>
                    <p className="text-gray-900 mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      {selectedRequest.quantity} leads
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Budget</label>
                    <p className="text-gray-900 mt-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      EGP {selectedRequest.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${
                        selectedRequest.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedRequest.status === 'fulfilled'
                          ? 'bg-green-100 text-green-800'
                          : selectedRequest.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Request Date</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.fulfilled_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fulfilled At</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedRequest.fulfilled_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'pending' && (
                <>
                  <div className="mt-6 mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add notes about this request..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'fulfilled')}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processing ? 'Processing...' : 'Mark as Fulfilled'}
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setAdminNotes('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

