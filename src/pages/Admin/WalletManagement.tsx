import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle, XCircle, Eye, FileText, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface WalletTopupRequest {
  id: string;
  user_id: string;
  amount: number;
  receipt_file_url: string;
  receipt_file_name: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  validated_by?: string;
  validated_at?: string;
  admin_notes?: string;
  rejected_reason?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function WalletManagement() {
  const { profile: currentProfile } = useAuthStore();
  const [requests, setRequests] = useState<WalletTopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<WalletTopupRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');

  useEffect(() => {
    loadRequests();
    
    const channel = supabase
      .channel('wallet_topup_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_topup_requests' }, () => {
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
        console.warn('Admin access required for wallet management');
      }
      
      // Fetch wallet topup requests first
      const { data: requestsData, error: requestsErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'topup')
        .order('created_at', { ascending: false });

      if (requestsErr) {
        console.error('Wallet topup requests error details:', {
          code: requestsErr.code,
          message: requestsErr.message,
          details: requestsErr.details,
          hint: requestsErr.hint,
        });
        // Check if table doesn't exist
        if (requestsErr.message?.includes('could not find the table') || requestsErr.message?.includes('does not exist')) {
          setError('The wallet_topup_requests table does not exist. Please run the migration CREATE_WALLET_TOPUP_TABLE.sql in your Supabase SQL editor.');
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

      // Get unique user IDs
      const userIds = [...new Set(requestsData.map((r: any) => r.user_id).filter(Boolean))];

      // Fetch profiles
      const profilesResult =
        userIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, name, email')
              .in('id', userIds)
          : { data: [], error: null };

      if (profilesResult.error) {
        console.error('Profiles fetch error:', profilesResult.error);
      }

      // Create lookup map
      const profilesMap = new Map(
        (profilesResult.data || []).map((p: any) => [p.id, { name: p.name, email: p.email }])
      );

      // Join the data
      const formatted = requestsData.map((item: any) => ({
        ...item,
        user: profilesMap.get(item.user_id) || { name: 'Unknown', email: '' },
      }));

      setRequests(formatted);
    } catch (err) {
      console.error('Error loading wallet requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const approveRequest = async (requestId: string) => {
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // Update request status
      const { error: err1 } = await supabase
        .from('transactions')
        .update({
          status: 'approved',
          validated_by: currentProfile?.id,
          validated_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', requestId);

      if (err1) throw err1;

      // Update user wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', request.user_id || request.profile_id)
        .single();

      if (profile) {
        const { error: err2 } = await supabase
          .from('profiles')
          .update({
            wallet_balance: (profile.wallet_balance || 0) + request.amount,
          })
          .eq('id', request.user_id || request.profile_id);

        if (err2) throw err2;

        // Create wallet ledger entry
        await supabase.from('transactions').insert({
          transaction_type: 'wallet',
          profile_id: request.user_id || request.profile_id,
          ledger_entry_type: 'credit',
          status: 'completed',
          amount: request.amount,
          currency: 'EGP',
          description: `Wallet top-up via ${request.payment_method}`,
          reference_type: 'topup',
          reference_id: requestId,
        });
      }

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'approve',
        entity: 'wallet_topup_requests',
        entity_id: requestId,
      });

      await loadRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error: err } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          validated_by: currentProfile?.id,
          validated_at: new Date().toISOString(),
          rejected_reason: rejectedReason || 'No reason provided',
          admin_notes: adminNotes || null,
        })
        .eq('id', requestId);

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'reject',
        entity: 'wallet_topup_requests',
        entity_id: requestId,
      });

      await loadRequests();
      setSelectedRequest(null);
      setRejectedReason('');
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column<WalletTopupRequest>[] = [
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
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-gray-900">EGP {Number(value).toLocaleString()}</span>
      ),
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value) => (
        <span className="text-gray-900 capitalize">{value as string}</span>
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
          {row.status === 'pending' && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-1">Manage wallet top-up requests and transactions</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-medium">
            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {requests.filter((r) => r.status === 'pending').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {requests.filter(
                  (r) =>
                    r.status === 'approved' &&
                    new Date(r.validated_at || '').toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                EGP {requests
                  .filter((r) => r.status === 'approved')
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
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
            placeholder="Search by user name or email..."
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
        emptyMessage="No wallet top-up requests found"
        pagination
        pageSize={20}
      />

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Top-Up Request Details</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-600">User</label>
                <p className="text-gray-900">
                  {selectedRequest.user?.name} ({selectedRequest.user?.email})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-gray-900 text-xl font-semibold">
                  EGP {selectedRequest.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Method</label>
                <p className="text-gray-900 capitalize">{selectedRequest.payment_method}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Receipt</label>
                {selectedRequest.receipt_file_url && (
                  <div className="mt-2">
                    <img
                      src={selectedRequest.receipt_file_url}
                      alt="Receipt"
                      className="max-w-full h-auto rounded-xl border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Request Date</label>
                <p className="text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
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
                    className="admin-btn admin-btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) {
                        setRejectedReason(reason);
                        rejectRequest(selectedRequest.id);
                      }
                    }}
                    className="admin-btn admin-btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setAdminNotes('');
                      setRejectedReason('');
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

