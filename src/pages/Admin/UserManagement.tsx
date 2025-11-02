import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, UserPlus, Shield, Ban, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DataTable, Column } from '../../components/admin/DataTable';
import { EmptyState } from '../../components/admin/EmptyState';
import { logAudit } from '../../lib/data/audit';
import { useAuthStore } from '../../store/auth';

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'manager' | 'admin' | 'support';
  wallet_balance: number;
  is_banned: boolean;
  created_at: string;
  last_login_at?: string;
  leads_count?: number;
  owned_leads_count?: number;
  assigned_leads_count?: number;
}

export default function UserManagement() {
  const { profile: currentProfile } = useAuthStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [showBanDialog, setShowBanDialog] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'manager' | 'admin' | 'support',
  });

  useEffect(() => {
    loadUsers();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      
      // Fetch lead counts for all users efficiently
      const userIds = (data || []).map(u => u.id);
      
      // Batch fetch all owned leads
      const { data: allOwnedLeads } = await supabase
        .from('leads')
        .select('id, buyer_user_id')
        .in('buyer_user_id', userIds);
      
      // Batch fetch all assigned leads
      const { data: allAssignedLeads } = await supabase
        .from('leads')
        .select('id, assigned_to_id')
        .in('assigned_to_id', userIds);
      
      // Create maps for quick lookup
      const ownedCountsMap: Record<string, number> = {};
      const assignedCountsMap: Record<string, number> = {};
      const ownedIdsMap: Record<string, Set<string>> = {};
      const assignedIdsMap: Record<string, Set<string>> = {};
      
      // Initialize maps
      userIds.forEach(id => {
        ownedCountsMap[id] = 0;
        assignedCountsMap[id] = 0;
        ownedIdsMap[id] = new Set();
        assignedIdsMap[id] = new Set();
      });
      
      // Count owned leads
      (allOwnedLeads || []).forEach(lead => {
        if (lead.buyer_user_id) {
          ownedCountsMap[lead.buyer_user_id] = (ownedCountsMap[lead.buyer_user_id] || 0) + 1;
          ownedIdsMap[lead.buyer_user_id].add(lead.id);
        }
      });
      
      // Count assigned leads
      (allAssignedLeads || []).forEach(lead => {
        if (lead.assigned_to_id) {
          assignedCountsMap[lead.assigned_to_id] = (assignedCountsMap[lead.assigned_to_id] || 0) + 1;
          assignedIdsMap[lead.assigned_to_id].add(lead.id);
        }
      });
      
      // Calculate totals for each user
      const usersWithLeads = (data || []).map(user => {
        const ownedIds = ownedIdsMap[user.id] || new Set();
        const assignedIds = assignedIdsMap[user.id] || new Set();
        const totalUnique = new Set([...ownedIds, ...assignedIds]).size;
        
        return {
          ...user,
          leads_count: totalUnique,
          owned_leads_count: ownedCountsMap[user.id] || 0,
          assigned_leads_count: assignedCountsMap[user.id] || 0,
        };
      });
      
      setUsers(usersWithLeads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'update',
        entity: 'profiles',
        entity_id: userId,
        changes: { role: newRole },
      });

      await loadUsers();
      setEditingUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const toggleBan = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const { error: err } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', userId);

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: user.is_banned ? 'unban' : 'ban',
        entity: 'profiles',
        entity_id: userId,
      });

      await loadUsers();
      setShowBanDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ban status');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (err) throw err;

      await logAudit({
        actor_id: currentProfile?.id || '',
        action: 'delete',
        entity: 'profiles',
        entity_id: userId,
      });

      await loadUsers();
      setShowDeleteDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Name, email, and password are required');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to create users');
      }

      // Call edge function to create user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Reset form and close dialog
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
      });
      setShowCreateDialog(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Wallet Balance', 'Leads Count', 'Owned Leads', 'Assigned Leads', 'Status', 'Created At'];
    const rows = filteredUsers.map((user) => [
      user.name || '',
      user.email || '',
      user.phone || '',
      user.role || '',
      user.wallet_balance?.toString() || '0',
      (user.leads_count || 0).toString(),
      (user.owned_leads_count || 0).toString(),
      (user.assigned_leads_count || 0).toString(),
      user.is_banned ? 'Banned' : 'Active',
      new Date(user.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      support: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.user}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
            {value?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{value || 'No name'}</div>
            <div className="text-sm text-gray-600">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => getRoleBadge(value as string),
    },
    {
      key: 'wallet_balance',
      label: 'Wallet',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">EGP {Number(value || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'leads_count',
      label: 'Leads',
      sortable: true,
      render: (value, row) => {
        const total = row.leads_count || 0;
        const owned = row.owned_leads_count || 0;
        const assigned = row.assigned_leads_count || 0;
        
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
            {total > 0 && (
              <div className="flex gap-2 text-xs text-gray-600">
                <span title="Owned/Purchased">{owned} owned</span>
                {assigned > 0 && (
                  <span title="Assigned">{assigned} assigned</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'is_banned',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value ? 'Banned' : 'Active'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
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
              setEditingUserId(row.id);
              setEditRole(row.role);
            }}
            className="p-2 text-purple-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Change role"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBanDialog(row.id);
            }}
            className={`p-2 rounded-xl transition-colors ${
              row.is_banned
                ? 'text-green-600 hover:bg-green-50'
                : 'text-orange-600 hover:bg-orange-50'
            }`}
            title={row.is_banned ? 'Unban user' : 'Ban user'}
          >
            {row.is_banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </button>
          {row.id !== currentProfile?.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(row.id);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="btn-admin-primary flex items-center gap-2"
            style={{ padding: '0.625rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, color: 'white', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s ease', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
          <button onClick={exportCSV} className="admin-btn admin-btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-input"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="support">Support</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-card p-4 bg-red-50 border border-red-200 text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users found"
        pagination
        pageSize={20}
      />

      {/* Edit Role Dialog */}
      {editingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="admin-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change User Role</h3>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="admin-input w-full mb-4"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => updateUserRole(editingUserId, editRole)}
                className="admin-btn admin-btn-primary flex-1"
              >
                Save
              </button>
              <button
                onClick={() => setEditingUserId(null)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      {showBanDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="admin-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {users.find((u) => u.id === showBanDialog)?.is_banned ? 'Unban' : 'Ban'} User
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {users.find((u) => u.id === showBanDialog)?.is_banned ? 'unban' : 'ban'} this user?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleBan(showBanDialog)}
                className="admin-btn admin-btn-primary flex-1"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowBanDialog(null)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="admin-card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete User</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The user will be permanently removed from the system.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteUser(showDeleteDialog)}
                className="admin-btn admin-btn-secondary text-red-600 hover:bg-red-50 flex-1"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="admin-card p-6 max-w-md w-full mx-4" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', maxWidth: '28rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '1.5rem' }}>Create New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="admin-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="admin-input-field"
                  placeholder="Enter full name"
                  style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="admin-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="admin-input-field"
                  placeholder="user@example.com"
                  style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="admin-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="admin-input-field"
                  placeholder="+20 123 456 7890"
                  style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="admin-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="admin-input-field"
                  placeholder="Minimum 6 characters"
                  style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="admin-label" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="admin-select"
                  style={{ width: '100%', padding: '0.625rem 1rem', paddingRight: '2.5rem', borderRadius: '0.75rem', border: '2px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827', fontSize: '14px', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={createUser}
                disabled={creating || !newUser.name || !newUser.email || !newUser.password}
                className="btn-admin-primary flex-1"
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: creating || !newUser.name || !newUser.email || !newUser.password ? 'not-allowed' : 'pointer',
                  opacity: creating || !newUser.name || !newUser.email || !newUser.password ? 0.6 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewUser({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    role: 'user',
                  });
                  setError(null);
                }}
                className="btn-admin-secondary flex-1"
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

