import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { StageChangeModal } from './StageChangeModal';
import { getStageColor } from '../../lib/case/stateMachine';
import type { Lead } from '../../hooks/crm/useLeads';
import type { CaseStage } from '../../types/case';

interface CaseStageTimelineProps {
  lead: Lead;
  onRefetch: () => void;
}

const STAGE_FLOW: CaseStage[] = [
  'New Lead',
  'Potential',
  'Hot Case',
  'Meeting Done',
  'Closed Deal',
];

const DEAD_END_STAGES: CaseStage[] = [
  'Non Potential',
  'Low Budget',
  'Wrong Number',
  'No Answer',
  'Switched Off',
];

export function CaseStageTimeline({ lead, onRefetch }: CaseStageTimelineProps) {
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<CaseStage | null>(null);

  const currentStage = (lead.stage || 'New Lead') as CaseStage;
  const currentIndex = STAGE_FLOW.indexOf(currentStage);

  const handleStageClick = (stage: CaseStage) => {
    setSelectedStage(stage);
    setShowStageModal(true);
  };

  const stageColors = getStageColor(currentStage);

  return (
    <>
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100 shadow-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Current Stage</h3>
            <Badge className={`${stageColors.bg} ${stageColors.text} border ${stageColors.border} text-sm px-3 py-1`}>
              {currentStage}
            </Badge>
          </div>

          {/* Main Flow Timeline */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Progress Flow</h4>
            <div className="space-y-2">
              {STAGE_FLOW.map((stage, index) => {
                const isActive = stage === currentStage;
                const isPast = index < currentIndex;
                const isFuture = index > currentIndex;

                return (
                  <motion.button
                    key={stage}
                    onClick={() => handleStageClick(stage)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-50 border-2 border-indigo-300'
                        : isPast
                        ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isPast ? (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle
                        className={`h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-indigo-600 fill-indigo-600' : 'text-gray-400'
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-indigo-900' : isPast ? 'text-green-900' : 'text-gray-600'
                      }`}
                    >
                      {stage}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Other Stages */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Other Stages</h4>
            <div className="grid grid-cols-2 gap-2">
              {DEAD_END_STAGES.map(stage => (
                <motion.button
                  key={stage}
                  onClick={() => handleStageClick(stage)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                    stage === currentStage
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {stage}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Project:</span>
                <span className="font-medium text-gray-900">{lead.project?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="font-medium text-gray-900 capitalize">{lead.source || 'N/A'}</span>
              </div>
              {lead.budget && (
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <span className="font-medium text-gray-900">
                    EGP {lead.budget.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stage Change Modal */}
      {selectedStage && (
        <StageChangeModal
          isOpen={showStageModal}
          onClose={() => {
            setShowStageModal(false);
            setSelectedStage(null);
          }}
          leadId={lead.id}
          currentStage={currentStage}
          newStage={selectedStage}
          onSuccess={() => {
            setShowStageModal(false);
            setSelectedStage(null);
            onRefetch();
          }}
        />
      )}
    </>
  );
}

