import { describe, it, expect, vi } from 'vitest';
import { transitions, validateStageChange, getStageDescription, getStageColor } from '../stateMachine';
import type { CaseStage, StageContext } from '../../../types/case';

describe('State Machine', () => {
  describe('transitions', () => {
    it('should have configuration for all stages', () => {
      const stages: CaseStage[] = [
        'New Lead',
        'Potential',
        'Hot Case',
        'Meeting Done',
        'EOI',
        'Closed Deal',
        'Non Potential',
        'Low Budget',
        'Wrong Number',
        'No Answer',
        'Call Back',
        'Whatsapp',
        'Switched Off',
      ];

      stages.forEach(stage => {
        expect(transitions[stage]).toBeDefined();
        expect(transitions[stage]).toHaveProperty('requires');
        expect(transitions[stage]).toHaveProperty('onEnter');
      });
    });

    it('should create CALL_NOW action for New Lead stage', async () => {
      const mockCtx: StageContext = {
        leadId: 'test-lead',
        userId: 'test-user',
        createAction: vi.fn().mockResolvedValue(undefined),
        aiCoach: vi.fn().mockResolvedValue(undefined),
        runInventoryMatch: vi.fn().mockResolvedValue(undefined),
      };

      await transitions['New Lead'].onEnter(mockCtx);

      expect(mockCtx.createAction).toHaveBeenCalledWith(
        'CALL_NOW',
        { sla: '15m' },
        15
      );
    });

    it('should call AI coach and create PUSH_MEETING for Potential stage', async () => {
      const mockCtx: StageContext = {
        leadId: 'test-lead',
        userId: 'test-user',
        createAction: vi.fn().mockResolvedValue(undefined),
        aiCoach: vi.fn().mockResolvedValue(undefined),
        runInventoryMatch: vi.fn().mockResolvedValue(undefined),
      };

      await transitions['Potential'].onEnter(mockCtx);

      expect(mockCtx.aiCoach).toHaveBeenCalled();
      expect(mockCtx.createAction).toHaveBeenCalledWith('PUSH_MEETING');
    });

    it('should create CHANGE_FACE action for Non Potential stage', async () => {
      const mockCtx: StageContext = {
        leadId: 'test-lead',
        userId: 'test-user',
        createAction: vi.fn().mockResolvedValue(undefined),
        aiCoach: vi.fn().mockResolvedValue(undefined),
        runInventoryMatch: vi.fn().mockResolvedValue(undefined),
      };

      await transitions['Non Potential'].onEnter(mockCtx);

      expect(mockCtx.createAction).toHaveBeenCalledWith(
        'CHANGE_FACE',
        { reason: 'Verify non potential classification' }
      );
    });

    it('should run inventory match for Low Budget stage', async () => {
      const mockCtx: StageContext = {
        leadId: 'test-lead',
        userId: 'test-user',
        createAction: vi.fn().mockResolvedValue(undefined),
        aiCoach: vi.fn().mockResolvedValue(undefined),
        runInventoryMatch: vi.fn().mockResolvedValue(undefined),
      };

      await transitions['Low Budget'].onEnter(mockCtx);

      expect(mockCtx.runInventoryMatch).toHaveBeenCalled();
    });

    it('should create referral actions for Closed Deal stage', async () => {
      const mockCtx: StageContext = {
        leadId: 'test-lead',
        userId: 'test-user',
        createAction: vi.fn().mockResolvedValue(undefined),
        aiCoach: vi.fn().mockResolvedValue(undefined),
        runInventoryMatch: vi.fn().mockResolvedValue(undefined),
      };

      await transitions['Closed Deal'].onEnter(mockCtx);

      expect(mockCtx.createAction).toHaveBeenCalledTimes(2);
      expect(mockCtx.createAction).toHaveBeenNthCalledWith(1, 'ASK_FOR_REFERRALS');
      expect(mockCtx.createAction).toHaveBeenNthCalledWith(
        2,
        'ASK_FOR_REFERRALS',
        { followup: '30d' },
        30 * 24 * 60
      );
    });
  });

  describe('validateStageChange', () => {
    it('should allow stage change without requirements', () => {
      const result = validateStageChange('New Lead', 'Hot Case', {});
      expect(result.valid).toBe(true);
    });

    it('should require feedback for Potential stage', () => {
      const resultWithout = validateStageChange('New Lead', 'Potential', {});
      expect(resultWithout.valid).toBe(false);
      expect(resultWithout.error).toContain('feedback');

      const resultWith = validateStageChange('New Lead', 'Potential', { feedback: 'Some feedback' });
      expect(resultWith.valid).toBe(true);
    });

    it('should require feedback for Non Potential stage', () => {
      const result = validateStageChange('New Lead', 'Non Potential', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('feedback');

      const resultWith = validateStageChange('New Lead', 'Non Potential', { feedback: 'Not interested' });
      expect(resultWith.valid).toBe(true);
    });

    it('should require budget OR downPayment/installment for Low Budget stage', () => {
      const resultWithout = validateStageChange('New Lead', 'Low Budget', {});
      expect(resultWithout.valid).toBe(false);

      const resultWithBudget = validateStageChange('New Lead', 'Low Budget', { budget: 1000000 });
      expect(resultWithBudget.valid).toBe(true);

      const resultWithDP = validateStageChange('New Lead', 'Low Budget', { downPayment: 100000 });
      expect(resultWithDP.valid).toBe(true);

      const resultWithInstallment = validateStageChange('New Lead', 'Low Budget', { monthlyInstallment: 10000 });
      expect(resultWithInstallment.valid).toBe(true);
    });

    it('should reject unknown stage', () => {
      const result = validateStageChange('New Lead', 'Unknown Stage' as CaseStage, {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown stage');
    });
  });

  describe('getStageDescription', () => {
    it('should return descriptions for all stages', () => {
      const stages: CaseStage[] = [
        'New Lead',
        'Potential',
        'Hot Case',
        'Closed Deal',
      ];

      stages.forEach(stage => {
        const desc = getStageDescription(stage);
        expect(desc).toBeTruthy();
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStageColor', () => {
    it('should return color scheme for all stages', () => {
      const stages: CaseStage[] = [
        'New Lead',
        'Potential',
        'Closed Deal',
      ];

      stages.forEach(stage => {
        const colors = getStageColor(stage);
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('border');
        expect(colors.bg).toContain('bg-');
        expect(colors.text).toContain('text-');
        expect(colors.border).toContain('border-');
      });
    });
  });
});

