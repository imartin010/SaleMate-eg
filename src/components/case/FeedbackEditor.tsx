import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';
import { getAICoaching } from '../../lib/api/caseApi';

interface FeedbackEditorProps {
  leadId: string;
  currentStage: string;
  onSubmit: () => void;
}

export function FeedbackEditor({ leadId, currentStage, onSubmit }: FeedbackEditorProps) {
  const { user } = useAuthStore();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gettingAI, setGettingAI] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || !user?.id) return;

    try {
      setSubmitting(true);

      // Get lead details for AI coaching
      const { data: lead } = await supabase
        .from('leads')
        .select('id, client_name, client_phone, project_id')
        .eq('id', leadId)
        .single();

      // Save feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('case_feedback')
        .insert({
          lead_id: leadId,
          stage: currentStage,
          feedback,
          created_by: user.id,
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // Get AI coaching
      setGettingAI(true);
      try {
        const aiResponse = await getAICoaching({
          stage: currentStage,
          lead: {
            id: lead?.id || leadId,
            name: lead?.client_name || 'Client',
            phone: lead?.client_phone,
            project_id: lead?.project_id,
          },
          lastFeedback: feedback,
        });

        // Update feedback with AI coach response
        await supabase
          .from('case_feedback')
          .update({ ai_coach: JSON.stringify(aiResponse) })
          .eq('id', feedbackData.id);
      } catch (aiError) {
        console.error('AI coaching failed:', aiError);
        // Continue even if AI fails
      } finally {
        setGettingAI(false);
      }

      setFeedback('');
      onSubmit();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-100">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Feedback</h3>
          {gettingAI && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Getting AI recommendations...
            </div>
          )}
        </div>

        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your feedback about this lead... What was discussed? Any objections? Client needs?"
          rows={6}
          className="resize-none"
        />

        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            AI coaching will be generated automatically after submission
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!feedback.trim() || submitting || gettingAI}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
                <Sparkles className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

