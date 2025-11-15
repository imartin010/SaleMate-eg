import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { Button } from '../../components/ui/button';
import { Mail, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface InvitationDetails {
  id: string;
  manager_id: string;
  invitee_email: string;
  status: string;
  expires_at: string;
  manager_name?: string;
}

const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    if (!user) {
      // Redirect to login with return URL
      navigate(`/auth/login?redirect=/app/team/accept-invitation?token=${token}`);
      return;
    }

    fetchInvitation();
  }, [token, user, navigate]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select(`
          *,
          manager:profiles!team_members_invited_by_fkey(name)
        `)
        .eq('invitation_token', token)
        .eq('status', 'invited')
        .single();

      if (fetchError || !data) {
        setError('Invitation not found');
        setLoading(false);
        return;
      }

      // Check if invitation is valid
      if (data.status !== 'invited') {
        setError('This invitation has already been processed');
        setLoading(false);
        return;
      }

      if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      // Check if invitation is for current user
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();

      if (profile?.email !== data.invited_email) {
        setError('This invitation is not for your account');
        setLoading(false);
        return;
      }

      setInvitation({
        id: data.team_id + '-' + (data.profile_id || 'pending'),
        manager_id: data.invited_by || '',
        invitee_email: data.invited_email || '',
        status: data.status,
        expires_at: data.invitation_expires_at || '',
        manager_name: (data.manager as any)?.name || 'Unknown Manager',
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    setProcessing(true);
    setError(null);

    try {
      const { data, error: acceptError } = await supabase.rpc('accept_team_invitation', {
        invitation_token: token,
      });

      if (acceptError || !data?.success) {
        setError(data?.error || 'Failed to accept invitation');
        setProcessing(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/app/team');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An unexpected error occurred');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!invitation) return;

    setProcessing(true);
    setError(null);

    try {
      const { data, error: rejectError } = await supabase.rpc('reject_team_invitation', {
        invitation_token: token,
      });

      if (rejectError || !data?.success) {
        setError(data?.error || 'Failed to reject invitation');
        setProcessing(false);
        return;
      }

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      setError('An unexpected error occurred');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully joined the team. Redirecting to your team page...
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/app/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Team Invitation</h1>
          <p className="text-blue-100">You've been invited to join a team!</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">You've been invited by</p>
                <p className="text-xl font-bold text-gray-900">{invitation?.manager_name}</p>
                <p className="text-sm text-gray-500 mt-1">to join their team on SaleMate</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">What this means:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll be part of {invitation?.manager_name}'s team</span>
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

          <div className="p-4 bg-gray-50 rounded-xl mb-8">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> By accepting this invitation, {invitation?.manager_name} will become 
              your team manager. You can leave the team at any time from your team settings.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="outline"
              className="flex-1 text-gray-700 hover:bg-gray-50"
            >
              {processing ? 'Processing...' : 'Decline'}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            This invitation expires on {invitation && new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;

