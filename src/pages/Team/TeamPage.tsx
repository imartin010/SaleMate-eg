import React, { useState, useEffect } from 'react';
import { useTeamStore } from '../../store/team';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Eye, 
  MoreVertical,
  UserPlus,
  UserMinus,
  Crown,
  Sparkles,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../../components/ui/dialog';

import { Badge } from '../../components/ui/badge';

const TeamPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { members, loading, error, fetchTeam, addUserToTeam, removeUserFromTeam, clearError } = useTeamStore();
  const navigate = useNavigate();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user && (profile?.role === 'manager' || profile?.role === 'admin')) {
      fetchTeam();
    }
  }, [user, profile?.role, fetchTeam]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;

    setIsAdding(true);
    const success = await addUserToTeam(newUserId.trim());
    setIsAdding(false);

    if (success) {
      setShowAddModal(false);
      setNewUserId('');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user from your team?')) {
      await removeUserFromTeam(userId);
    }
  };

  const handleViewMemberLeads = (memberId: string) => {
    navigate(`/crm?assignee=${memberId}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-3 w-3" />;
      case 'manager': return <Crown className="h-3 w-3" />;
      case 'support': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  // Only show for managers and admins
  if (!user || (profile?.role !== 'manager' && profile?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            You need manager or admin privileges to access team management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Team Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            My Team
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your team members and assign leads to maximize productivity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{members.length}</div>
                    <p className="text-sm text-gray-600 font-medium">Team Members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {members.filter(m => m.role === 'user').length}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Active Users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {members.filter(m => m.role === 'manager').length}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Managers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
              <p className="text-sm text-gray-600">Add members and manage your team</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="font-medium">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600 hover:text-red-800">×</Button>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading team members...</p>
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your team by adding members. You can add existing users by their user ID.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Member
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Member</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Joined</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {member.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name || 'Unnamed User'}</div>
                            <div className="text-sm text-gray-500">{member.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {member.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getRoleBadgeColor(member.role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMemberLeads(member.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Leads
                          </Button>
                          {member.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                type="text"
                placeholder="Enter user ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the user ID of an existing user to add them to your team.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding || !newUserId.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isAdding ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;
