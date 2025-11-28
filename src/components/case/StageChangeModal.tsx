import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, Home, MapPin, Building2, Bed, Square, CheckCircle, XCircle } from 'lucide-react';
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
  const [inventoryMatch, setInventoryMatch] = useState<{
    resultCount: number;
    topUnits: Array<{
      id: number;
      unit_id?: string;
      unit_number?: string;
      compound: string;
      area: string;
      developer: string;
      property_type: string;
      bedrooms?: number;
      unit_area?: number;
      price: number;
      currency: string;
    }>;
    recommendation: string;
    matchId: string;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Determine required fields based on new stage
  const requiresFeedback = ['Potential', 'Non Potential'].includes(newStage);
  const requiresBudget = newStage === 'Low Budget';
  const allowsMeeting = newStage === 'Potential';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Form submitted!', { budget, downPayment, monthlyInstallment, newStage });

    const data: Record<string, unknown> = {};
    if (feedback) data.feedback = feedback;
    if (budget) {
      const budgetValue = parseFloat(budget);
      console.log('🔵 Budget value:', budget, 'parsed:', budgetValue, 'isNaN:', isNaN(budgetValue));
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

    console.log('🔵 Validation data:', data);

    // Validate
    const validation = validateChange(currentStage, newStage, data);
    console.log('🔵 Validation result:', validation);
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.error);
      alert(validation.error);
      return;
    }

    try {
      const result = await changeLeadStage({
      leadId,
      newStage,
      currentStage,
      feedback: feedback || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      downPayment: downPayment ? parseFloat(downPayment) : undefined,
      monthlyInstallment: monthlyInstallment ? parseFloat(monthlyInstallment) : undefined,
      meetingDate: meetingDate || undefined,
    });

      console.log('Stage change result:', result);
      console.log('🔵 result.inventoryMatch:', result.inventoryMatch);
      console.log('🔵 result keys:', Object.keys(result));

      if (result.success) {
        // If Low Budget stage, show results (even if no matches)
        if (requiresBudget) {
          // Always show results for Low Budget, even if inventoryMatch is null
          if (result.inventoryMatch) {
            console.log('🔵 Setting inventory match:', result.inventoryMatch);
            setInventoryMatch(result.inventoryMatch);
            setShowResults(true);
          } else {
            // No inventory match returned - show error or default message
            console.warn('No inventory match returned for Low Budget stage');
            // Still show results with empty match
            setInventoryMatch({
              resultCount: 0,
              topUnits: [],
              recommendation: 'Unable to match inventory. Please try again or check inventory data.',
              matchId: '',
            });
            setShowResults(true);
          }
        } else {
          // For other stages, close immediately
      onSuccess();
        }
      } else {
        console.error('Stage change failed:', result);
        alert('Failed to change stage. Please try again.');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      alert(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setInventoryMatch(null);
    setFeedback('');
    setBudget('');
    setDownPayment('');
    setMonthlyInstallment('');
    setMeetingDate('');
    onClose();
  };

  const handleContinue = () => {
    onSuccess();
    handleClose();
  };

  // If showing results, display inventory match results
  if (showResults && inventoryMatch) {
    const hasMatches = inventoryMatch.resultCount > 0;
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Inventory Match Results
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!hasMatches ? (
              // No matches found - show warning
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">
                      No Matching Properties Found
                    </h3>
                    <p className="text-red-800 mb-4">
                      <strong>Yes, he's low budget - don't waste your time with him. Move to another lead.</strong>
                    </p>
                    <p className="text-sm text-red-700">
                      The client's budget is below what's available in our inventory. Consider focusing on leads with higher budgets.
                    </p>
                    {inventoryMatch.recommendation && (
                      <div className="mt-4 p-3 bg-red-100 rounded border border-red-200">
                        <p className="text-sm text-red-800">{inventoryMatch.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Matches found - show projects
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-semibold">
                      Found {inventoryMatch.resultCount} {inventoryMatch.resultCount === 1 ? 'property' : 'properties'} matching the budget
                    </p>
                  </div>
                </div>

                {inventoryMatch.recommendation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{inventoryMatch.recommendation}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Matching Projects (Up to 10):</h3>
                  <div className="grid gap-4">
                    {inventoryMatch.topUnits.slice(0, 10).map((unit) => (
                      <div
                        key={unit.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              {unit.compound || 'N/A'}
                            </h4>
                            {unit.unit_number && (
                              <p className="text-sm text-gray-600">Unit: {unit.unit_number}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {unit.price.toLocaleString()} {unit.currency || 'EGP'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{unit.area || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{unit.developer || 'N/A'}</span>
                          </div>
                          {unit.bedrooms !== undefined && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Bed className="h-4 w-4" />
                              <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                            </div>
                          )}
                          {unit.unit_area && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Square className="h-4 w-4" />
                              <span>{unit.unit_area} m²</span>
                            </div>
                          )}
                        </div>

                        {unit.property_type && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {unit.property_type}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={changing}>
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

