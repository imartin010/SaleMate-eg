import { useState } from 'react';
import { Calendar, Clock, Check, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';

interface MeetingSchedulerProps {
  leadId: string;
  onScheduled: () => void;
}

export function MeetingScheduler({ leadId, onScheduled }: MeetingSchedulerProps) {
  const { user } = useAuthStore();
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick date helpers
  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split('T')[0];
    setMeetingDate(dateStr);
    // Set default time to 2 PM if no time is set
    if (!meetingTime) {
      setMeetingTime('14:00');
    }
  };

  // Preset time slots
  const presetTimes = [
    { label: '9:00 AM', value: '09:00' },
    { label: '11:00 AM', value: '11:00' },
    { label: '2:00 PM', value: '14:00' },
    { label: '4:00 PM', value: '16:00' },
    { label: '6:00 PM', value: '18:00' },
  ];

  const handleSchedule = async () => {
    if (!meetingDate || !meetingTime || !user?.id) {
      setError('Please select both date and time');
      return;
    }

    // Combine date and time
    const dateTimeString = `${meetingDate}T${meetingTime}`;
    const meetingDateTime = new Date(dateTimeString);
    
    // Validate that the meeting is in the future
    if (meetingDateTime <= new Date()) {
      setError('Please select a date and time in the future');
      return;
    }

    try {
      setScheduling(true);
      setError(null);

      const meetingTimeMs = meetingDateTime.getTime();
      const reminder24h = new Date(meetingTimeMs - 24 * 60 * 60 * 1000).toISOString();
      const reminder2h = new Date(meetingTimeMs - 2 * 60 * 60 * 1000).toISOString();

      // Create meeting actions in events table
      await supabase.from('events').insert([
        {
          event_type: 'activity',
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'meeting',
          task_status: 'completed',
          actor_profile_id: user.id,
          assignee_profile_id: user.id,
          payload: { action_type: 'PUSH_MEETING', meeting_date: dateTimeString, scheduled: true },
          completed_at: new Date().toISOString(),
        },
        {
          event_type: 'activity',
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'meeting',
          task_status: 'pending',
          actor_profile_id: user.id,
          assignee_profile_id: user.id,
          payload: { action_type: 'REMIND_MEETING', meeting_date: dateTimeString, reminder: '24h' },
          due_at: reminder24h,
        },
        {
          event_type: 'activity',
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'meeting',
          task_status: 'pending',
          actor_profile_id: user.id,
          assignee_profile_id: user.id,
          payload: { action_type: 'REMIND_MEETING', meeting_date: dateTimeString, reminder: '2h' },
          due_at: reminder2h,
        },
      ]);

      setSuccess(true);
      setMeetingDate('');
      setMeetingTime('');
      onScheduled();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Schedule Meeting</h3>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-800 font-medium">
            Meeting scheduled successfully!
          </p>
          <p className="text-xs text-green-600 mt-1">
            Reminders created for 24h and 2h before
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Date Buttons */}
          <div>
            <Label className="mb-2 block">Quick Select Date</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(0)}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(1)}
                className="text-xs"
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDate(7)}
                className="text-xs"
              >
                Next Week
              </Button>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <Label htmlFor="meetingDate">Date</Label>
            <Input
              id="meetingDate"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2"
              placeholder="Select date"
            />
          </div>

          {/* Time Input with Presets */}
          <div>
            <Label htmlFor="meetingTime">Time</Label>
            <div className="mt-2 space-y-2">
              <Input
                id="meetingTime"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full"
                placeholder="Select time"
              />
              <div className="flex flex-wrap gap-2">
                {presetTimes.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={meetingTime === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMeetingTime(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Schedule Button */}
          <Button
            onClick={handleSchedule}
            disabled={!meetingDate || !meetingTime || scheduling}
            className="w-full"
            size="lg"
          >
            {scheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </>
            )}
          </Button>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              We'll create automatic reminders 24 hours and 2 hours before the meeting
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

