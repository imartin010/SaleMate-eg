import React, { useEffect } from 'react';
import { useSupportStore } from '../../store/support';
import { useAuthStore } from '../../store/auth';
import { UserSupportView } from '../../components/support/UserSupportView';
import { SupportAgentView } from '../../components/support/SupportAgentView';
import { SupportCaseStatus } from '../../types';

const SupportPanel: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { cases, fetchUserCases, fetchAllCases, createCase, updateCase, loading } = useSupportStore();
  
  const userRole = profile?.role || 'user';
  const isSupportRole = userRole === 'support' || userRole === 'admin';

  useEffect(() => {
    if (!user?.id) return;
    
    if (isSupportRole) {
      // Support role sees all tickets
      fetchAllCases();
    } else {
      // Users and managers see only their own tickets
      fetchUserCases(user.id);
    }
  }, [user?.id, isSupportRole, fetchUserCases, fetchAllCases]);

  const handleCreateCase = async (subject: string, description: string, topic: string, issue: string) => {
    if (!user?.id) return;
    await createCase(user.id, subject, description, topic, issue);
  };

  const handleUpdateCase = async (id: string, updates: { status?: SupportCaseStatus; assignedTo?: string }) => {
    await updateCase(id, updates);
  };

  // Render appropriate view based on role
  if (isSupportRole) {
    return (
      <SupportAgentView
        cases={cases}
        loading={loading}
        onUpdateCase={handleUpdateCase}
        currentUserId={user?.id || ''}
      />
    );
  }

  return (
    <UserSupportView
      cases={cases}
      loading={loading}
      onCreateCase={handleCreateCase}
    />
  );
};

export default SupportPanel;
