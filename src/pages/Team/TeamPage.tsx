import React, { useState, useEffect } from 'react';
import { useTeamStore } from '../../store/team';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '../../components/common/PageTitle';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Eye, 
  UserPlus,
  UserMinus,
  Crown,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
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

interface Invitation {
  id: string;
  manager_id: string;
  invitee_email: string;
  status: string;
  expires_at: string;
  created_at: string;
  token: string;
  manager: {
    name: string;
    email: string;
  };
}

const TeamPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { 
    members, 
    invitations,
    loading, 
    error, 
    fetchTeam, 
    fetchInvitations,
    inviteUserByEmail,
    cancelInvitation,
    removeUserFromTeam, 
    clearError 
  } = useTeamStore();
  const navigate = useNavigate();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  
  // State for regular users
  const [teammates, setTeammates] = useState<any[]>([]);
  const [myInvitations, setMyInvitations] = useState<Invitation[]>([]);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const [loadingTeammates, setLoadingTeammates] = useState(false);

  const isManager = profile?.role === 'manager' || profile?.role === 'admin';

  useEffect(() => {
    if (user && profile) {
      if (isManager) {
        // Managers: fetch their team members and sent invitations
        fetchTeam();
        fetchInvitations();
      } else {
        // Regular users: fetch teammates and their received invitations
        fetchTeammates();
        fetchMyInvitations();
      }
    }
  }, [user, profile?.role]);

  // Fetch teammates for regular users (people under the same manager)
  const fetchTeammates = async () => {
    try {
      setLoadingTeammates(true);
      
      if (!profile?.manager_id) {
        setTeammates([]);
        setLoadingTeammates(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile.manager_id)
        .neq('id', user?.id) // Exclude current user
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching teammates:', fetchError);
      } else {
        setTeammates(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingTeammates(false);
    }
  };

  // Fetch invitations received by the current user
  const fetchMyInvitations = async () => {
    try {
      if (!profile?.email) return;

      const { data, error: fetchError } = await supabase
        .from('team_invitations')
        .select(`
          *,
          manager:profiles!team_invitations_manager_id_fkey(name, email)
        `)
        .eq('invitee_email', profile.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching my invitations:', fetchError);
      } else {
        setMyInvitations(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsAdding(true);
    const success = await inviteUserByEmail(inviteEmail.trim().toLowerCase());
    setIsAdding(false);

    if (success) {
      setShowAddModal(false);
      setInviteEmail('');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitation(invitationId);
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

  // Handle accepting/rejecting invitations for regular users
  const handleAcceptInvitation = async (invitation: Invitation) => {
    setProcessingInvitation(invitation.id);
    try {
      const { data, error: acceptError } = await supabase.rpc('accept_team_invitation', {
        invitation_token: invitation.token,
      });

      if (acceptError || !data?.success) {
        alert(data?.error || 'Failed to accept invitation');
        setProcessingInvitation(null);
        return;
      }

      // Refresh invitations and teammates
      await fetchMyInvitations();
      await fetchTeammates();
      setProcessingInvitation(null);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('An unexpected error occurred');
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitation: Invitation) => {
    if (!confirm('Are you sure you want to reject this invitation?')) {
      return;
    }

    setProcessingInvitation(invitation.id);
    try {
      const { data, error: rejectError } = await supabase.rpc('reject_team_invitation', {
        invitation_token: invitation.token,
      });

      if (rejectError || !data?.success) {
        alert(data?.error || 'Failed to reject invitation');
        setProcessingInvitation(null);
        return;
      }

      await fetchMyInvitations();
      setProcessingInvitation(null);
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('An unexpected error occurred');
      setProcessingInvitation(null);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h3>
          <p className="text-gray-600">
            You need to be logged in to access team management.
          </p>
        </div>
      </div>
    );
  }

  // MANAGER VIEW
  if (isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <PageTitle
              title="My Team"
              subtitle="Manage your team members and assign leads to maximize productivity."
              icon={Users}
              color="pink"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

            <div className="group cursor-pointer" onClick={() => setShowInvitations(!showInvitations)}>
              <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <Mail className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {invitations.filter(i => i.status === 'pending').length}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Pending Invites</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
                  <p className="text-sm text-gray-600">Invite members by email and manage your team</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
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

          {/* Pending Invitations */}
          {showInvitations && invitations.filter(i => i.status === 'pending').length > 0 && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {invitations
                  .filter(i => i.status === 'pending')
                  .map((invitation) => (
                    <div key={invitation.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{invitation.invitee_email}</div>
                            <div className="text-xs text-gray-500">
                              Sent {new Date(invitation.created_at).toLocaleDateString()} • 
                              Expires {new Date(invitation.expires_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
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
                Start building your team by inviting members via email.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Your First Member
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

        {/* Invite Team Member Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite Team Member
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-2">
                  An invitation will be sent to this email address. If they already have a SaleMate account, 
                  they'll see it in their team page. If not, they'll receive an email to create an account and 
                  will automatically join your team.
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
                  disabled={isAdding || !inviteEmail.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isAdding ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // REGULAR USER VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <PageTitle
            title="My Team"
            subtitle={profile?.manager_id ? "View your teammates and pending invitations" : "You're not part of a team yet"}
            icon={Users}
            color="pink"
          />
        </div>

        {/* Pending Invitations for User */}
        {myInvitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pending Invitations</h2>
            </div>
            <div className="space-y-4">
              {myInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Team Invitation from {(invitation.manager as any)?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(invitation.manager as any)?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">What this means:</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>You'll be part of {(invitation.manager as any)?.name}'s team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Access to shared leads and resources</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Collaborative real estate management</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Enhanced productivity tools</span>
                        </li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRejectInvitation(invitation)}
                        disabled={processingInvitation === invitation.id}
                        variant="outline"
                        className="flex-1 text-gray-700 hover:bg-gray-50"
                      >
                        {processingInvitation === invitation.id ? 'Processing...' : 'Decline'}
                      </Button>
                      <Button
                        onClick={() => handleAcceptInvitation(invitation)}
                        disabled={processingInvitation === invitation.id}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {processingInvitation === invitation.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Accept Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teammates Section */}
        {profile?.manager_id && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">My Teammates</h2>
            </div>

            {loadingTeammates ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading teammates...</p>
                </div>
              </div>
            ) : teammates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No teammates yet</h3>
                <p className="text-gray-600">
                  You're the first member of this team. More teammates will appear here when they join.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Teammate</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Role</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teammates.map((teammate) => (
                        <tr key={teammate.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-700">
                                  {teammate.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{teammate.name || 'Unnamed User'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {teammate.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  {teammate.email}
                                </div>
                              )}
                              {teammate.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  {teammate.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${getRoleBadgeColor(teammate.role)} flex items-center gap-1 w-fit`}>
                              {getRoleIcon(teammate.role)}
                              {teammate.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {teammate.created_at ? new Date(teammate.created_at).toLocaleDateString() : 'Unknown'}
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
        )}

        {/* No Team Message */}
        {!profile?.manager_id && myInvitations.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">You're not part of a team</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              When a manager invites you to their team, you'll see the invitation here and can choose to accept it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
