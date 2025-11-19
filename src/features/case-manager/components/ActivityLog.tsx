import { motion } from 'framer-motion';
import { MessageSquare, Activity, Users, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';
import type { CaseFeedback, CaseAction, CaseFace } from '../../types/case';

interface ActivityLogProps {
  feedback: CaseFeedback[];
  actions: CaseAction[];
  faces: CaseFace[];
}

type Activity = {
  type: 'feedback' | 'action' | 'face';
  timestamp: string;
  data: CaseFeedback | CaseAction | CaseFace;
};

export function ActivityLog({ feedback, actions, faces }: ActivityLogProps) {
  // Combine all activities and sort by date
  const activities: Activity[] = [
    ...feedback.map(f => ({ type: 'feedback' as const, timestamp: f.created_at, data: f })),
    ...actions.filter(a => a.status === 'DONE').map(a => ({ type: 'action' as const, timestamp: a.completed_at!, data: a })),
    ...faces.map(f => ({ type: 'face' as const, timestamp: f.created_at, data: f })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const renderActivity = (activity: Activity) => {
    switch (activity.type) {
      case 'feedback': {
        const item = activity.data as CaseFeedback;
        return (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">Feedback Added</span>
                <span className="text-xs text-gray-500">
                  • {item.stage}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{item.feedback}</p>
              {item.ai_coach && (
                <div className="text-xs text-purple-600 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  AI coaching provided
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'action': {
        const item = activity.data as CaseAction;
        return (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-gray-900">Action Completed</span>
              <p className="text-sm text-gray-700">
                {item.action_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        );
      }

      case 'face': {
        const item = activity.data as CaseFace;
        return (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-gray-900">Face Changed</span>
              <p className="text-sm text-gray-700">
                Reassigned to {item.to_agent_profile?.name || 'new agent'}
                {item.reason && (
                  <span className="text-gray-500"> • {item.reason}</span>
                )}
              </p>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>

      {activities.length > 0 ? (
        <div className="space-y-6 relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />

          {activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {renderActivity(activity)}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 ml-11">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity yet</p>
        </div>
      )}
    </Card>
  );
}

