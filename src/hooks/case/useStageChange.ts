import { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { changeStage } from '../../lib/api/caseApi';
import { validateStageChange } from '../../lib/case/stateMachine';
import type { CaseStage, StageChangePayload } from '../../types/case';

interface UseStageChangeReturn {
  changing: boolean;
  error: string | null;
  changeLeadStage: (params: {
    leadId: string;
    newStage: CaseStage;
    currentStage: CaseStage;
    feedback?: string;
    budget?: number;
    downPayment?: number;
    monthlyInstallment?: number;
    meetingDate?: string;
  }) => Promise<boolean>;
  validateChange: (
    currentStage: CaseStage,
    newStage: CaseStage,
    data?: Record<string, unknown>
  ) => { valid: boolean; error?: string };
}

/**
 * Hook to handle stage changes with validation and state machine logic
 */
export function useStageChange(): UseStageChangeReturn {
  const { user } = useAuthStore();
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeLeadStage = async (params: {
    leadId: string;
    newStage: CaseStage;
    currentStage: CaseStage;
    feedback?: string;
    budget?: number;
    downPayment?: number;
    monthlyInstallment?: number;
    meetingDate?: string;
  }): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    const { leadId, newStage, currentStage, feedback, budget, downPayment, monthlyInstallment, meetingDate } = params;

    try {
      setChanging(true);
      setError(null);

      // Validate stage change
      const validation = validateStageChange(currentStage, newStage, {
        feedback,
        budget,
        totalBudget: budget,
        downPayment,
        monthlyInstallment,
      });

      if (!validation.valid) {
        setError(validation.error || 'Invalid stage change');
        return false;
      }

      // Prepare payload
      const payload: StageChangePayload = {
        leadId,
        newStage,
        userId: user.id,
        feedback,
        budget,
        downPayment,
        monthlyInstallment,
        meetingDate,
      };

      // Call API to change stage
      await changeStage(payload);

      console.log(`✅ Stage changed from "${currentStage}" to "${newStage}" for lead ${leadId}`);
      return true;
    } catch (err) {
      console.error('Error changing stage:', err);
      setError(err instanceof Error ? err.message : 'Failed to change stage');
      return false;
    } finally {
      setChanging(false);
    }
  };

  return {
    changing,
    error,
    changeLeadStage,
    validateChange: validateStageChange,
  };
}

