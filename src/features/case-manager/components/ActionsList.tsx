import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { completeAction, skipAction } from '../../lib/api/caseApi';
import { formatDistanceToNow } from 'date-fns';
import type { CaseAction } from '../../types/case';

interface ActionsListProps {
  actions: CaseAction[];
  onRefetch: () => void;
}

const ACTION_ICONS: Record<string, string> = {
  CALL_NOW: '📞',
  PUSH_MEETING: '📅',
  REMIND_MEETING: '⏰',
  CHANGE_FACE: '👤',
  ASK_FOR_REFERRALS: '🤝',
  NURTURE: '💬',
  CHECK_INVENTORY: '🏠',
};

export function ActionsList({ actions, onRefetch }: ActionsListProps) {
  const pendingActions = actions.filter(a => a.status === 'PENDING');
  const completedActions = actions.filter(a => a.status === 'DONE').slice(0, 3);

  const handleComplete = async (actionId: string) => {
    try {
      await completeAction(actionId);
      onRefetch();
    } catch (error) {
      console.error('Failed to complete action:', error);
    }
  };

  const handleSkip = async (actionId: string) => {
    try {
      await skipAction(actionId);
      onRefetch();
    } catch (error) {
      console.error('Failed to skip action:', error);
    }
  };

  const isOverdue = (dueAt?: string) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions & Reminders</h3>

      <div className="space-y-4">
        {/* Pending Actions */}
        {pendingActions.length > 0 ? (
          <div className="space-y-3">
            {pendingActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 ${
                  isOverdue(action.due_at)
                    ? 'bg-red-50 border-red-300'
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ACTION_ICONS[action.action_type] || '📌'}</span>
                      <span className="font-medium text-gray-900">
                        {action.action_type.replace(/_/g, ' ')}
                      </span>
                      {isOverdue(action.due_at) && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                    </div>
                    {action.due_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Clock className="h-3 w-3" />
                        {isOverdue(action.due_at) 
                          ? `Overdue by ${formatDistanceToNow(new Date(action.due_at))}`
                          : `Due ${formatDistanceToNow(new Date(action.due_at), { addSuffix: true })}`
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleComplete(action.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSkip(action.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending actions</p>
          </div>
        )}

        {/* Recently Completed */}
        {completedActions.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Completed</h4>
            <div className="space-y-2">
              {completedActions.map(action => (
                <div key={action.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{action.action_type.replace(/_/g, ' ')}</span>
                  {action.completed_at && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(action.completed_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

