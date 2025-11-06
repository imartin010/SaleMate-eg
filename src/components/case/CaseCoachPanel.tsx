import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { createAction } from '../../lib/api/caseApi';
import { useAuthStore } from '../../store/auth';
import { useState } from 'react';
import type { AICoachResponse } from '../../types/case';

interface CaseCoachPanelProps {
  recommendations: AICoachResponse;
  leadId: string;
  onRefetch: () => void;
}

export function CaseCoachPanel({ recommendations, leadId, onRefetch }: CaseCoachPanelProps) {
  const { user } = useAuthStore();
  const [creating, setCreating] = useState<string | null>(null);

  const handleCreateAction = async (rec: { cta: string; suggestedActionType?: string; dueInMinutes?: number }) => {
    if (!user?.id || !rec.suggestedActionType) return;

    try {
      setCreating(rec.cta);
      await createAction({
        leadId,
        actionType: rec.suggestedActionType as any,
        payload: { cta: rec.cta },
        dueInMinutes: rec.dueInMinutes,
        userId: user.id,
      });
      onRefetch();
    } catch (error) {
      console.error('Failed to create action:', error);
    } finally {
      setCreating(null);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" data-testid="ai-coach-panel">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Coach Recommendations</h3>
      </div>

      <div className="space-y-4">
        {/* Recommendations */}
        {recommendations.recommendations && recommendations.recommendations.length > 0 && (
          <div className="space-y-3">
            {recommendations.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-4 border border-purple-200"
                data-testid="ai-recommendation"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{rec.cta}</div>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                    {rec.dueInMinutes && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Due in {rec.dueInMinutes < 60 ? `${rec.dueInMinutes}min` : `${Math.round(rec.dueInMinutes / 60)}h`}
                      </div>
                    )}
                  </div>
                  {rec.suggestedActionType && (
                    <Button
                      size="sm"
                      onClick={() => handleCreateAction(rec)}
                      disabled={creating === rec.cta}
                      className="flex-shrink-0"
                    >
                      {creating === rec.cta ? 'Creating...' : 'Create Action'}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Follow-up Script */}
        {recommendations.followupScript && (
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">📱 Follow-up Script</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{recommendations.followupScript}</p>
          </div>
        )}

        {/* Risk Flags */}
        {recommendations.riskFlags && recommendations.riskFlags.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">⚠️ Risk Flags</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.riskFlags.map((flag, index) => (
                <Badge key={index} variant="outline" className="border-amber-300 text-amber-800 bg-white">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

