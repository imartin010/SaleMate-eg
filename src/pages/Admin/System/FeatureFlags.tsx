import React, { useState, useEffect } from 'react';
import { Flag, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { DataTable, Column } from '../../../components/admin/DataTable';
import { EmptyState } from '../../../components/admin/EmptyState';
import { getAllFeatureFlags, toggleFeatureFlag, createFeatureFlag, deleteFeatureFlag, FeatureFlag } from '../../../lib/data/featureFlags';
import { useAuthStore } from '../../../store/auth';

export default function FeatureFlags() {
  const { profile } = useAuthStore();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFlag, setNewFlag] = useState({
    key: '',
    description: '',
    enabled: false,
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await getAllFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, enabled: boolean) => {
    try {
      await toggleFeatureFlag(key, !enabled, profile?.id);
      await loadFlags();
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  const handleAdd = async () => {
    if (!newFlag.key) return;
    try {
      await createFeatureFlag(newFlag.key, newFlag.description || '', newFlag.enabled, profile?.id);
      setNewFlag({ key: '', description: '', enabled: false });
      setShowAddDialog(false);
      await loadFlags();
    } catch (error) {
      console.error('Error adding flag:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    try {
      await deleteFeatureFlag(key, profile?.id);
      await loadFlags();
    } catch (error) {
      console.error('Error deleting flag:', error);
    }
  };

  const columns: Column<FeatureFlag>[] = [
    {
      key: 'key',
      label: 'Feature Key',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-medium text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-gray-900">{value || 'No description'}</span>
      ),
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (value, row) => (
        <button
          onClick={() => handleToggle(row.key, row.enabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            row.enabled
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {row.enabled ? (
            <>
              <ToggleRight className="h-5 w-5" />
              <span>Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5" />
              <span>Disabled</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleDelete(row.key)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-1">Manage feature toggles</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Flag
        </button>
      </div>

      <DataTable
        columns={columns}
        data={flags}
        loading={loading}
        emptyMessage="No feature flags configured"
        pagination
        pageSize={20}
      />

      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Feature Flag</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Feature Key</label>
                <input
                  type="text"
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                  className="admin-input w-full"
                  placeholder="e.g., enable_new_feature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <textarea
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  className="admin-input w-full"
                  rows={3}
                  placeholder="Describe what this feature flag controls..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newFlag.enabled}
                    onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-brand-primary"
                  />
                  <span className="text-sm text-gray-900">Enable by default</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleAdd} className="admin-btn admin-btn-primary flex-1">
                Add Flag
              </button>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewFlag({ key: '', description: '', enabled: false });
                }}
                className="admin-btn admin-btn-secondary flex-1"
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

