import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuthStore } from '../../store/auth';
import { bulkChangeStage } from '../../lib/api/caseApi';
import { validateStageChange } from '../../lib/case/stateMachine';
import type { CaseStage } from '../../types/case';

interface BulkStageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function BulkStageChangeModal({
  isOpen,
  onClose,
  leadIds,
  onSuccess,
}: BulkStageChangeModalProps) {
  const { user } = useAuthStore();
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<CaseStage | ''>('');
  const [feedback, setFeedback] = useState('');
  const [budget, setBudget] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ leadId: string; error: string }>;
  } | null>(null);

  // Determine required fields based on new stage
  const requiresFeedback = newStage && ['Potential', 'Non Potential'].includes(newStage);
  const requiresBudget = newStage === 'Low Budget';
  const allowsMeeting = newStage === 'Potential';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStage) {
      setError('Please select a stage');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    // Prevent double submission
    if (changing) {
      return;
    }

    const data: Record<string, unknown> = {};
    if (feedback) data.feedback = feedback;
    if (budget) {
      const budgetValue = parseFloat(budget);
      if (!isNaN(budgetValue)) {
        data.budget = budgetValue;
      }
    }
    if (downPayment) {
      const dpValue = parseFloat(downPayment);
      if (!isNaN(dpValue)) {
        data.downPayment = dpValue;
      }
    }
    if (monthlyInstallment) {
      const installmentValue = parseFloat(monthlyInstallment);
      if (!isNaN(installmentValue)) {
        data.monthlyInstallment = installmentValue;
      }
    }

    // Validate stage change (using a generic current stage for validation)
    // For bulk operations, we'll validate against 'New Lead' as a baseline
    const validation = validateStageChange('New Lead', newStage, data);
    if (!validation.valid) {
      setError(validation.error || 'Invalid stage change');
      return;
    }

    try {
      setChanging(true);
      setError(null);
      setResults(null);

      const result = await bulkChangeStage({
        leadIds,
        newStage,
        userId: user.id,
        feedback: feedback || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        downPayment: downPayment ? parseFloat(downPayment) : undefined,
        monthlyInstallment: monthlyInstallment ? parseFloat(monthlyInstallment) : undefined,
        meetingDate: meetingDate || undefined,
        propertyType: propertyType && propertyType !== 'all' ? propertyType : undefined,
      });

      setResults(result);
      
      if (result.success > 0) {
        // Wait a moment to show results, then close and refresh
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error in bulk stage change:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setChanging(false);
    }
  };

  const handleClose = () => {
    if (changing) return; // Prevent closing while processing
    
    setNewStage('');
    setFeedback('');
    setBudget('');
    setDownPayment('');
    setMonthlyInstallment('');
    setMeetingDate('');
    setPropertyType('');
    setError(null);
    setResults(null);
    onClose();
  };

  // Show results if available
  if (results) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && !changing && handleClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Bulk Stage Change Results
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {results.success > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-semibold">
                    Successfully changed {results.success} {results.success === 1 ? 'lead' : 'leads'} to {newStage}
                  </p>
                </div>
              </div>
            )}

            {results.failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-semibold mb-2">
                      Failed to change {results.failed} {results.failed === 1 ? 'lead' : 'leads'}
                    </p>
                    {results.errors.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {results.errors.slice(0, 5).map((err, idx) => (
                          <p key={idx} className="text-sm text-red-700">
                            Lead {err.leadId.slice(0, 8)}...: {err.error}
                          </p>
                        ))}
                        {results.errors.length > 5 && (
                          <p className="text-sm text-red-600 italic">
                            ...and {results.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !changing && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Change Stage for {leadIds.length} {leadIds.length === 1 ? 'Lead' : 'Leads'}
          </DialogTitle>
        </DialogHeader>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          action="#"
          method="post"
          noValidate
        >
          {/* Stage Selection */}
          <div>
            <Label htmlFor="newStage" className="text-base font-semibold">
              New Stage <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newStage}
              onValueChange={(value) => setNewStage(value as CaseStage)}
              required
            >
              <SelectTrigger id="newStage" className="mt-2">
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Lead">New Lead</SelectItem>
                <SelectItem value="Potential">Potential</SelectItem>
                <SelectItem value="Hot Case">Hot Case</SelectItem>
                <SelectItem value="Meeting Done">Meeting Done</SelectItem>
                <SelectItem value="EOI">EOI</SelectItem>
                <SelectItem value="Closed Deal">Closed Deal</SelectItem>
                <SelectItem value="Non Potential">Non Potential</SelectItem>
                <SelectItem value="Low Budget">Low Budget</SelectItem>
                <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                <SelectItem value="No Answer">No Answer</SelectItem>
                <SelectItem value="Call Back">Call Back</SelectItem>
                <SelectItem value="Whatsapp">Whatsapp</SelectItem>
                <SelectItem value="Switched Off">Switched Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              <p className="text-xs text-gray-500 mt-1">
                This feedback will be applied to all selected leads.
              </p>
            </div>
          )}

          {/* Budget Info (Required for Low Budget) */}
          {requiresBudget && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Please provide budget information. This will be applied to all selected leads for inventory matching.
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

              <div>
                <Label htmlFor="propertyType">Property Type (Optional)</Label>
                <Select value={propertyType ? propertyType : 'all'} onValueChange={(value) => setPropertyType(value === 'all' ? '' : value)}>
                  <SelectTrigger id="propertyType" className="mt-2">
                    <SelectValue placeholder="Select property type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Twinhouse">Twinhouse</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Clinic">Clinic</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
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
                This meeting date will be applied to all selected leads. We'll create reminders 24h and 2h before the meeting.
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={changing}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={changing || !newStage}
            >
              {changing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Stage...
                </>
              ) : (
                `Change ${leadIds.length} ${leadIds.length === 1 ? 'Lead' : 'Leads'} to ${newStage || '...'}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

