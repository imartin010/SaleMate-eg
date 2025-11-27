import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Lead } from '../../hooks/crm/useLeads';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getStageColor } from '../../pages/CRM/ModernCRM';

interface CalendarViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export function CalendarView({ leads, onLeadClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get leads with meeting dates (using assigned_at or created_at as fallback)
  const leadsWithDates = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      meetingDate: lead.assigned_at ? new Date(lead.assigned_at) : new Date(lead.created_at),
    }));
  }, [leads]);

  // Group leads by date
  const leadsByDate = useMemo(() => {
    const grouped: Record<string, typeof leadsWithDates> = {};
    leadsWithDates.forEach(lead => {
      const dateKey = format(lead.meetingDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(lead);
    });
    return grouped;
  }, [leadsWithDates]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-600"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayLeads = leadsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`
                min-h-[100px] p-2 border border-gray-200 rounded-lg
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isCurrentDay ? 'ring-2 ring-indigo-500' : ''}
              `}
            >
              <div
                className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isCurrentDay ? 'text-indigo-600' : ''}
                `}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayLeads.slice(0, 3).map((lead) => (
                  <motion.div
                    key={lead.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onLeadClick(lead)}
                    className="cursor-pointer"
                  >
                    <Badge
                      className={`${getStageColor(lead.stage)} text-xs px-1.5 py-0.5 truncate w-full block`}
                    >
                      {lead.client_name}
                    </Badge>
                  </motion.div>
                ))}
                {dayLeads.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayLeads.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

