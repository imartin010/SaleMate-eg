import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useStageChange } from '../../hooks/case/useStageChange';
import type { CaseStage } from '../../types/case';

interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentStage: CaseStage;
  newStage: CaseStage;
  onSuccess: () => void;
}

export function StageChangeModal({
  isOpen,
  onClose,
  leadId,
  currentStage,
  newStage,
  onSuccess,
}: StageChangeModalProps) {
  const { changing, error, changeLeadStage, validateChange } = useStageChange();
  
  const [feedback, setFeedback] = useState('');
  const [budget, setBudget] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  // Determine required fields based on new stage
  const requiresFeedback = ['Potential', 'Non Potential'].includes(newStage);
  const requiresBudget = newStage === 'Low Budget';
  const allowsMeeting = newStage === 'Potential';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: Record<string, unknown> = {};
    if (feedback) data.feedback = feedback;
    if (budget) data.budget = parseFloat(budget);
    if (downPayment) data.downPayment = parseFloat(downPayment);
    if (monthlyInstallment) data.monthlyInstallment = parseFloat(monthlyInstallment);

    // Validate
    const validation = validateChange(currentStage, newStage, data);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const success = await changeLeadStage({
      leadId,
      newStage,
      currentStage,
      feedback: feedback || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      downPayment: downPayment ? parseFloat(downPayment) : undefined,
      monthlyInstallment: monthlyInstallment ? parseFloat(monthlyInstallment) : undefined,
      meetingDate: meetingDate || undefined,
    });

    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Change Stage to: {newStage}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback (Required for Potential/Non Potential) */}
          {requiresFeedback && (
            <div>
              <Label htmlFor="feedback" className="text-base font-semibold">
                Feedback <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the conversation, client needs, objections, etc."
                rows={4}
                required
                className="mt-2"
              />
            </div>
          )}

          {/* Budget Info (Required for Low Budget) */}
          {requiresBudget && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Please provide budget information. We'll match against available inventory.
                </p>
              </div>

              <div>
                <Label htmlFor="budget">Total Budget (EGP)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 5000000"
                  min="0"
                  step="10000"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="downPayment">Down Payment (EGP)</Label>
                  <Input
                    id="downPayment"
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="e.g. 500000"
                    min="0"
                    step="10000"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyInstallment">Monthly Installment (EGP)</Label>
                  <Input
                    id="monthlyInstallment"
                    type="number"
                    value={monthlyInstallment}
                    onChange={(e) => setMonthlyInstallment(e.target.value)}
                    placeholder="e.g. 50000"
                    min="0"
                    step="1000"
                    className="mt-2"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Provide at least total budget OR both down payment and monthly installment.
              </p>
            </div>
          )}

          {/* Meeting Scheduler (Optional for Potential) */}
          {allowsMeeting && (
            <div>
              <Label htmlFor="meetingDate">Schedule Meeting (Optional)</Label>
              <Input
                id="meetingDate"
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll create reminders 24h and 2h before the meeting.
              </p>
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-sm text-red-800">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={changing}>
              Cancel
            </Button>
            <Button type="submit" disabled={changing}>
              {changing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Stage...
                </>
              ) : (
                `Change to ${newStage}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

