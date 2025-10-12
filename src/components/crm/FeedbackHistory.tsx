import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import { FeedbackHistoryEntry } from '../../hooks/crm/useLeads';
import { formatInTimeZone } from 'date-fns-tz';

interface FeedbackHistoryProps {
  history: FeedbackHistoryEntry[];
}

export const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return null;
  }

  // Sort by newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        Feedback History ({history.length})
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <AnimatePresence>
          {sortedHistory.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-2 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center text-gray-600">
                  <User className="h-3 w-3 mr-1" />
                  <span className="font-medium">
                    {entry.user?.name || 'User'}
                  </span>
                </div>
                <span className="text-gray-500 text-[10px]">
                  {formatInTimeZone(entry.created_at, 'Africa/Cairo', 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.feedback_text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

