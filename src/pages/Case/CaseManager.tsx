import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCase } from '../../hooks/case/useCase';
import { Button } from '../../components/ui/button';
import { CaseStageTimeline } from '../../components/case/CaseStageTimeline';
import { CaseCoachPanel } from '../../components/case/CaseCoachPanel';
import { FeedbackEditor } from '../../components/case/FeedbackEditor';
import { ActionsList } from '../../components/case/ActionsList';
import { ActivityLog } from '../../components/case/ActivityLog';
import { ChangeFaceModal } from '../../components/case/ChangeFaceModal';
import { MeetingScheduler } from '../../components/case/MeetingScheduler';
import { InventoryMatchesCard } from '../../components/case/InventoryMatchesCard';
import { QuickActions } from '../../components/case/QuickActions';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CaseManager() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { lead, feedback, actions, faces, matches, loading, error, refetch } = useCase(leadId!);
  
  const [showChangeFaceModal, setShowChangeFaceModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Case</h3>
          <p className="text-gray-600 mb-4">{error || 'Case not found'}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/crm')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Button>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // Get latest AI coach recommendations from most recent feedback
  const latestCoach = feedback[0]?.ai_coach 
    ? JSON.parse(feedback[0].ai_coach) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/crm')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 bg-clip-text text-transparent">
                Case: {lead.client_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {lead.client_phone} {lead.client_email && `• ${lead.client_email}`}
              </p>
            </div>
            <Button
              onClick={() => setShowChangeFaceModal(true)}
              variant="outline"
              className="bg-white"
            >
              👤 Change Face
            </Button>
          </div>
        </motion.div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Rail - Stage Timeline & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            <CaseStageTimeline lead={lead} onRefetch={refetch} />
          </motion.div>

          {/* Center - AI Coach, Feedback, Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6 space-y-6"
          >
            {latestCoach && (
              <CaseCoachPanel
                recommendations={latestCoach}
                leadId={leadId!}
                onRefetch={refetch}
              />
            )}
            
            <FeedbackEditor
              leadId={leadId!}
              currentStage={lead.stage}
              onSubmit={refetch}
            />
            
            <ActivityLog
              feedback={feedback}
              actions={actions}
              faces={faces}
            />
          </motion.div>

          {/* Right Rail - Actions, Meeting, Inventory */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            <QuickActions lead={lead} />
            
            <ActionsList
              actions={actions}
              onRefetch={refetch}
            />
            
            <MeetingScheduler
              leadId={leadId!}
              onScheduled={refetch}
            />
            
            {matches.length > 0 && (
              <InventoryMatchesCard matches={matches} />
            )}
          </motion.div>
        </div>
      </div>

      {/* Change Face Modal */}
      <ChangeFaceModal
        isOpen={showChangeFaceModal}
        onClose={() => setShowChangeFaceModal(false)}
        leadId={leadId!}
        currentAgentId={lead.assigned_to_id || undefined}
        onSuccess={() => {
          setShowChangeFaceModal(false);
          refetch();
        }}
      />
    </div>
  );
}

