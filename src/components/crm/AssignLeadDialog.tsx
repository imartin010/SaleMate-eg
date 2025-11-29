import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { getAgentTree } from '../../services/agentService';
import type { AgentTreeNode } from '../../services/agentService';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  depth: number;
}

interface AssignLeadDialogProps {
  leadIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignLeadDialog: React.FC<AssignLeadDialogProps> = ({
  leadIds,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      if (!profile?.id) {
        setError('User not found');
        return;
      }

      // Get full tree (all users who report to this manager, directly or indirectly)
      const tree = await getAgentTree(profile.id);
      
      // Convert to team members list (include manager themselves and all reports)
      const members: TeamMember[] = tree.map(node => ({
        id: node.user_id,
        name: node.user_name,
        email: node.user_email,
        role: node.user_role,
        depth: node.depth,
      }));

      setTeamMembers(members);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    }
  };

  const handleAssign = async () => {
    if (!selectedMemberId) {
      setError('Please select a team member');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase.rpc('assign_leads_to_team_member', {
        p_lead_ids: leadIds,
        p_manager_id: profile?.id,
        p_assignee_id: selectedMemberId,
      });

      if (err) throw err;

      // Get assignee name for confirmation message
      const assignee = teamMembers.find(m => m.id === selectedMemberId);
      const assigneeName = assignee?.name || 'team member';
      const leadCount = leadIds.length;
      
      // Show success message
      alert(`Successfully assigned ${leadCount} lead${leadCount > 1 ? 's' : ''} to ${assigneeName}!`);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning leads:', err);
      setError(err.message || 'Failed to assign leads');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase.rpc('unassign_leads', {
        p_lead_ids: leadIds,
        p_manager_id: profile?.id,
      });

      if (err) throw err;

      const leadCount = leadIds.length;
      alert(`Successfully unassigned ${leadCount} lead${leadCount > 1 ? 's' : ''}!`);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error unassigning leads:', err);
      setError(err.message || 'Failed to unassign leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assign Leads</h3>
              <p className="text-sm text-gray-500">{leadIds.length} lead{leadIds.length > 1 ? 's' : ''} selected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No team members found</p>
            <p className="text-sm text-gray-500 mt-1">Invite team members first</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to team member:
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
            >
              <option value="">Select team member...</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email}) {member.depth > 0 ? `- Level ${member.depth}` : '- You'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAssign}
            disabled={loading || !selectedMemberId || teamMembers.length === 0}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Assigning...</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Assign</span>
              </>
            )}
          </button>
          <button
            onClick={handleUnassign}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Unassign
          </button>
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

