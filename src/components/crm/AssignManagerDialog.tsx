import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { assignManager, bulkAssignManager, getManagerChain, canAssignManager } from '../../services/agentService';
import type { ManagerChainNode } from '../../services/agentService';

interface ManagerOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignManagerDialogProps {
  userIds: string[]; // Single or multiple users
  currentManagerId?: string | null;
  currentManagerName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignManagerDialog: React.FC<AssignManagerDialogProps> = ({
  userIds,
  currentManagerId,
  currentManagerName,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuthStore();
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerChain, setManagerChain] = useState<ManagerChainNode[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isBulk = userIds.length > 1;
  const firstUserId = userIds[0];

  useEffect(() => {
    fetchManagers();
    if (selectedManagerId && firstUserId) {
      fetchManagerChain(selectedManagerId);
      validateAssignment(firstUserId, selectedManagerId);
    }
  }, [selectedManagerId, firstUserId]);

  useEffect(() => {
    setIsBulkMode(isBulk);
  }, [isBulk]);

  const fetchManagers = async () => {
    try {
      // Fetch all users who can be managers
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .order('name');

      if (err) throw err;
      
      // Filter out the users being assigned
      const filteredManagers = (data || []).filter(
        manager => !userIds.includes(manager.id)
      );
      
      setManagers(filteredManagers);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Failed to load managers');
    }
  };

  const fetchManagerChain = async (managerId: string) => {
    try {
      const chain = await getManagerChain(managerId);
      setManagerChain(chain);
    } catch (err) {
      console.error('Error fetching manager chain:', err);
    }
  };

  const validateAssignment = async (userId: string, managerId: string) => {
    if (!managerId) {
      setValidationError(null);
      return;
    }

    try {
      const validation = await canAssignManager(userId, managerId);
      if (!validation.canAssign) {
        setValidationError(validation.reason || 'Cannot assign this manager');
      } else {
        setValidationError(null);
      }
    } catch (err) {
      console.error('Error validating assignment:', err);
    }
  };

  const handleAssign = async () => {
    if (!selectedManagerId) {
      setError('Please select a manager');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isBulkMode) {
        // Bulk assignment
        const result = await bulkAssignManager(userIds, selectedManagerId, profile?.id || '');
        
        if (!result.success) {
          throw new Error('Bulk assignment failed');
        }

        if (result.fail_count > 0) {
          setError(`Successfully assigned ${result.success_count} users. ${result.fail_count} failed: ${result.errors.join(', ')}`);
        } else {
          onSuccess();
          onClose();
        }
      } else {
        // Single assignment
        const result = await assignManager(firstUserId, selectedManagerId, profile?.id || '');
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to assign manager');
        }

        // Show info if manager has direct reports (tree is preserved)
        if (result.tree_preserved && result.direct_reports_count && result.direct_reports_count > 0) {
          const message = `Manager assigned successfully. ${result.direct_reports_count} direct report(s) remain under this manager.`;
          alert(message);
        }

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error assigning manager:', err);
      setError(err.message || 'Failed to assign manager');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, removing manager means setting it to null
      // This would need a remove_manager function or we can just set manager_id to null
      const { error: err } = await supabase
        .from('profiles')
        .update({ manager_id: null })
        .in('id', userIds);

      if (err) throw err;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error removing manager:', err);
      setError(err.message || 'Failed to remove manager');
    } finally {
      setLoading(false);
    }
  };

  // Check if any of the users being assigned are managers (would move tree)
  const wouldMoveTree = false; // This would need to be checked by querying if any userId has direct reports

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isBulkMode ? 'Assign Manager (Bulk)' : 'Assign Manager'}
              </h3>
              <p className="text-sm text-gray-500">
                {isBulkMode ? `${userIds.length} users selected` : 'Select a manager for this user'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Current Manager */}
        {currentManagerName && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Manager:</p>
            <p className="font-medium text-gray-900">{currentManagerName}</p>
          </div>
        )}

        {/* Info for Managers */}
        {currentManagerName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Manager Hierarchy</p>
                <p className="text-sm text-blue-700 mt-1">
                  When assigning a manager to another manager, the manager's direct reports will remain under them. This creates a reporting hierarchy: Users → Manager → Higher Manager.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {validationError}
          </div>
        )}

        {/* Manager Selection */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Manager:
          </label>
          <select
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            style={{ backgroundColor: '#ffffff', color: '#111827' }}
          >
            <option value="">Select a manager...</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} ({manager.email}) - {manager.role}
              </option>
            ))}
          </select>
        </div>

        {/* Manager Chain Preview */}
        {selectedManagerId && managerChain.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Manager Chain:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {managerChain.map((node, index) => (
                <React.Fragment key={node.user_id}>
                  <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md text-sm">
                    <span className="font-medium text-gray-900">{node.user_name}</span>
                    <span className="text-gray-500 text-xs">({node.user_role})</span>
                  </div>
                  {index < managerChain.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAssign}
            disabled={loading || !selectedManagerId || !!validationError}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Assigning...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Assign Manager</span>
              </>
            )}
          </button>
          {currentManagerId && (
            <button
              onClick={handleRemove}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

