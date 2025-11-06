import { useState } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';
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
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSchedule = async () => {
    if (!meetingDate || !user?.id) return;

    try {
      setScheduling(true);

      const meetingTime = new Date(meetingDate).getTime();
      const reminder24h = new Date(meetingTime - 24 * 60 * 60 * 1000).toISOString();
      const reminder2h = new Date(meetingTime - 2 * 60 * 60 * 1000).toISOString();

      // Create meeting action
      await supabase.from('case_actions').insert([
        {
          lead_id: leadId,
          action_type: 'PUSH_MEETING',
          payload: { meeting_date: meetingDate, scheduled: true },
          status: 'DONE',
          created_by: user.id,
          completed_at: new Date().toISOString(),
        },
        {
          lead_id: leadId,
          action_type: 'REMIND_MEETING',
          payload: { meeting_date: meetingDate, reminder: '24h' },
          due_at: reminder24h,
          status: 'PENDING',
          created_by: user.id,
        },
        {
          lead_id: leadId,
          action_type: 'REMIND_MEETING',
          payload: { meeting_date: meetingDate, reminder: '2h' },
          due_at: reminder2h,
          status: 'PENDING',
          created_by: user.id,
        },
      ]);

      setSuccess(true);
      setMeetingDate('');
      onScheduled();

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      alert('Failed to schedule meeting');
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
          <div>
            <Label htmlFor="meetingDate">Date & Time</Label>
            <Input
              id="meetingDate"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSchedule}
            disabled={!meetingDate || scheduling}
            className="w-full"
          >
            {scheduling ? (
              'Scheduling...'
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Schedule Meeting
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            We'll create reminders 24 hours and 2 hours before the meeting
          </p>
        </div>
      )}
    </Card>
  );
}

