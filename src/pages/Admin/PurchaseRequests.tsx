import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, XCircle, Eye, Search, Filter, Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface PurchaseRequest {
  id: string;
  user_id: string;
  project_id: string;
  project_name?: string; // Denormalized project name
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  total_amount: number;
  payment_method?: string;
  receipt_url?: string;
  receipt_file_name?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  rejected_reason?: string;
  created_at: string;
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
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    loadRequests();
    
      const channel = supabase
      .channel('commerce_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commerce', filter: 'commerce_type=eq.purchase' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  // Load receipt image when request is selected
  useEffect(() => {
    if (selectedRequest?.receipt_url) {
      const loadReceipt = async () => {
        setLoadingReceipt(true);
        try {
          const { data, error } = await supabase.storage
            .from('payment-receipts')
            .createSignedUrl(selectedRequest.receipt_url!, 3600);
          
          if (error) throw error;
          if (data?.signedUrl) {
            setReceiptImageUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('Error loading receipt:', err);
          setReceiptImageUrl(null);
        } finally {
          setLoadingReceipt(false);
        }
      };
      loadReceipt();
    } else {
      setReceiptImageUrl(null);
    }
  }, [selectedRequest?.receipt_url]);

  // Load project details from projects table when viewing details - ALWAYS fetch to ensure fresh data
  useEffect(() => {
    if (selectedRequest?.project_id) {
      const fetchProject = async () => {
        console.log('🔍 Fetching project for details modal:', {
          requestId: selectedRequest.id,
          projectId: selectedRequest.project_id,
          projectIdType: typeof selectedRequest.project_id,
          currentProjectName: selectedRequest.project?.name
        });
        
        // Always fetch from projects table for fresh data
        const { data: projectData, error } = await supabase
          .from('projects')
          .select('id, name, region')
          .eq('id', selectedRequest.project_id)
          .maybeSingle();
        
        console.log('📦 Project fetch result:', {
          found: !!projectData,
          projectId: selectedRequest.project_id,
          data: projectData,
          error: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details
        });
        
        if (!error && projectData) {
          console.log('✅ Project found:', projectData.name);
          // Update local state with project details from projects table
          setSelectedRequest(prev => {
            if (!prev) return null;
            return {
              ...prev,
              project: {
                name: projectData.name || 'Unknown',
                developer: projectData.region || '', // region contains developer display name
                region: projectData.region || ''
              }
            };
          });
        } else if (error) {
          console.error('❌ Error fetching project:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            projectId: selectedRequest.project_id
          });
          // Set error state in project
          setSelectedRequest(prev => prev ? {
            ...prev,
            project: {
              name: `Error: ${error.message}`,
              developer: '',
              region: ''
            }
          } : null);
        } else {
          console.warn('⚠️ Project not found in database:', {
            projectId: selectedRequest.project_id,
            projectIdType: typeof selectedRequest.project_id
          });
          // Keep Unknown but log for debugging
          setSelectedRequest(prev => prev ? {
            ...prev,
            project: {
              name: 'Project Not Found',
              developer: '',
              region: ''
            }
          } : null);
        }
      };
      fetchProject();
    }
  }, [selectedRequest?.id]); // Use id as dependency to refetch when different request is selected

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify admin access
      if (!currentProfile || currentProfile.role !== 'admin') {
        console.warn('Admin access required for purchase requests');
      }
      
      // Fetch purchase requests from commerce table
      const { data: requestsData, error: requestsErr } = await supabase
        .from('commerce')
        .select('*')
        .eq('commerce_type', 'purchase')
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
          setError('The purchase_requests table does not exist. Please run the migration or verify the table exists in your database.');
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

      console.log('🔍 Debug: Purchase Requests Analysis', {
        totalRequests: requestsData.length,
        uniqueProjectIds: projectIds,
        sampleRequest: requestsData[0] ? {
          id: requestsData[0].id,
          project_id: requestsData[0].project_id,
          project_id_type: typeof requestsData[0].project_id
        } : null
      });

      // Fetch profiles and projects from their respective tables
      const [profilesResult, projectsResult] = await Promise.all([
        userIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, name, email')
              .in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? (async () => {
              // First try batch query
              let { data, error } = await supabase
                .from('projects')
                .select('id, name, region')
                .in('id', projectIds);
              
              // If batch fails, try fetching individually
              if (error || !data || data.length === 0) {
                console.warn('⚠️ Batch project fetch failed, trying individually:', error?.message);
                const projects: any[] = [];
                const errors: string[] = [];
                
                for (const projectId of projectIds.slice(0, 10)) { // Limit to first 10 to avoid timeout
                  try {
                    const { data: projectData, error: projectError } = await supabase
                      .from('projects')
                      .select('id, name, region')
                      .eq('id', projectId)
                      .maybeSingle();
                    
                    if (projectError) {
                      console.error(`Error fetching project ${projectId}:`, projectError);
                      errors.push(`${projectId}: ${projectError.message}`);
                    } else if (projectData) {
                      projects.push(projectData);
                    }
                  } catch (err: any) {
                    console.error(`Exception fetching project ${projectId}:`, err);
                    errors.push(`${projectId}: ${err.message}`);
                  }
                }
                
                console.log('📊 Individual projects fetch result:', {
                  requested: projectIds.length,
                  found: projects.length,
                  projects: projects.map((p: any) => ({ id: p.id, name: p.name })),
                  errors: errors.length > 0 ? errors : null
                });
                
                return { data: projects, error: errors.length > 0 ? new Error(errors.join('; ')) : null };
              }
              
              console.log('📊 Projects fetch result:', {
                requestedIds: projectIds.length,
                found: data?.length || 0,
                projects: data?.map((p: any) => ({ id: p.id, name: p.name })),
                error: error?.message
              });
              
              return { data: data || [], error };
            })()
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesResult.error) {
        console.error('❌ Profiles fetch error:', profilesResult.error);
      }
      if (projectsResult.error) {
        console.error('❌ Projects fetch error:', projectsResult.error);
      }

      // Create lookup maps - use both string and UUID keys for reliability
      const profilesMap = new Map(
        (profilesResult.data || []).map((p: any) => {
          const key = String(p.id);
          return [key, { name: p.name, email: p.email }];
        })
      );
      
      const projectsMap = new Map();
      (projectsResult.data || []).forEach((p: any) => {
        const stringKey = String(p.id);
        // region contains the developer display name (e.g., "Mountain View")
        projectsMap.set(stringKey, { name: p.name, developer: p.region || '', region: p.region || '' });
        // Also set with UUID key if different
        if (p.id !== stringKey) {
          projectsMap.set(p.id, { name: p.name, developer: p.region || '', region: p.region || '' });
        }
      });

      console.log('🗺️ Projects Map:', {
        size: projectsMap.size,
        keys: Array.from(projectsMap.keys()),
        entries: Array.from(projectsMap.entries()).map(([k, v]: [any, any]) => ({ key: k, name: v.name }))
      });

      // Format data - fetch project name from projects table
      const formatted = requestsData.map((item: any) => {
        const projectIdKey = String(item.project_id);
        const project = projectsMap.get(projectIdKey) || projectsMap.get(item.project_id);
        
        if (!project && item.project_id) {
          console.warn('⚠️ Project not found for purchase request:', {
            requestId: item.id,
            projectId: item.project_id,
            projectIdKey: projectIdKey,
            availableProjectKeys: Array.from(projectsMap.keys())
          });
        }
        
        return {
          ...item,
          user: profilesMap.get(String(item.user_id)) || { name: 'Unknown', email: '' },
          project: project || { name: 'Unknown', developer: '', region: '' },
        };
      });

      console.log('✅ Formatted requests:', formatted.slice(0, 3).map((r: any) => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project?.name
      })));

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
      
      // Call RPC function to approve and assign leads
      const { data: result, error: rpcError } = await supabase.rpc(
        'approve_purchase_request_and_assign_leads',
        {
          p_request_id: requestId,
          p_admin_id: currentProfile?.id,
          p_admin_notes: adminNotes || null,
        }
      );

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to approve request and assign leads');
      }

      console.log('✅ Purchase request approved and leads assigned:', result);

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'approve',
        entity: 'purchase_requests',
        entity_id: requestId,
        changes: {
          leads_assigned: result?.leads_assigned || 0,
        },
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
      setReceiptImageUrl(null);
      
      // Show success message
      alert(`Successfully approved request and assigned ${result?.leads_assigned || 0} leads!`);
    } catch (err) {
      console.error('Approve error:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      setProcessing(true);
      const { error: err } = await supabase
        .from('commerce')
        .update({
          status: 'rejected',
          rejected_reason: adminNotes || null,
          admin_notes: adminNotes || null,
        })
        .eq('id', requestId)
        .eq('commerce_type', 'purchase');

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'reject',
        entity: 'purchase_requests',
        entity_id: requestId,
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
      setReceiptImageUrl(null);
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
      req.total_amount?.toString() || '0',
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
          {row.project?.region && (
            <div className="text-sm text-gray-600">{row.project.region}</div>
          )}
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
      key: 'total_amount',
      label: 'Total Amount',
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
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

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
                <p className="text-gray-900 font-semibold">{selectedRequest.project?.name || 'Loading...'}</p>
                {(selectedRequest.project?.developer || selectedRequest.project?.region) && (
                  <p className="text-sm text-gray-600">
                    {selectedRequest.project?.developer || ''} 
                    {selectedRequest.project?.developer && selectedRequest.project?.region ? ' - ' : ''}
                    {selectedRequest.project?.region || ''}
                  </p>
                )}
                {selectedRequest.project_id && !selectedRequest.project?.name && (
                  <p className="text-xs text-gray-500 mt-1">Project ID: {selectedRequest.project_id}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-gray-900 text-xl font-semibold">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Cost</label>
                  <p className="text-gray-900 text-xl font-semibold">
                    EGP {Number(selectedRequest.total_amount || 0).toLocaleString()}
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
              {selectedRequest.payment_method && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="text-gray-900 capitalize">{selectedRequest.payment_method}</p>
                </div>
              )}
              {selectedRequest.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Payment Receipt</label>
                  {loadingReceipt ? (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading receipt...</span>
                    </div>
                  ) : receiptImageUrl ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={receiptImageUrl}
                          alt="Payment Receipt"
                          className="max-w-full h-auto w-full object-contain"
                          onError={() => {
                            console.error('Error displaying receipt image');
                            setReceiptImageUrl(null);
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = receiptImageUrl;
                            link.target = '_blank';
                            link.download = selectedRequest.receipt_file_name || 'receipt.jpg';
                            link.click();
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Download Receipt
                        </button>
                        <button
                          onClick={() => {
                            window.open(receiptImageUrl, '_blank');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Open in New Tab
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">Unable to load receipt image. Please try again later.</p>
                    </div>
                  )}
                </div>
              )}
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
                      setReceiptImageUrl(null);
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

