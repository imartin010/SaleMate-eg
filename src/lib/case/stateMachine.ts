import { CaseStage, CaseActionType } from '../../types/case';

export interface StageContext {
  leadId: string;
  userId: string;
  createAction: (type: CaseActionType, payload?: Record<string, unknown>, dueInMinutes?: number) => Promise<void>;
  aiCoach: () => Promise<void>;
  runInventoryMatch: () => Promise<void>;
}

export interface StageConfig {
  requires: string[];
  onEnter: (ctx: StageContext) => Promise<void>;
}

export const transitions: Record<CaseStage, StageConfig> = {
  'New Lead': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Create immediate CALL_NOW action with 15-minute SLA
      await ctx.createAction('CALL_NOW', { sla: '15m' }, 15);
    },
  },
  
  'Potential': {
    requires: ['feedback'],
    onEnter: async (ctx: StageContext) => {
      // Get AI coaching recommendations
      await ctx.aiCoach();
      // Create action to push for meeting
      await ctx.createAction('PUSH_MEETING');
    },
  },
  
  'Non Potential': {
    requires: ['feedback'],
    onEnter: async (ctx: StageContext) => {
      // Suggest face change to verify non-potential classification
      await ctx.createAction('CHANGE_FACE', { reason: 'Verify non potential classification' });
    },
  },
  
  'Low Budget': {
    requires: ['budget|dp|installment'],
    onEnter: async (ctx: StageContext) => {
      // Run inventory matching to find affordable options
      await ctx.runInventoryMatch();
    },
  },
  
  'EOI': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Expression of Interest - suggest second face for pre-launch reinforcement
      await ctx.createAction('CHANGE_FACE', { reason: 'Pre-launch reinforcement - second opinion' });
    },
  },
  
  'Closed Deal': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Immediate referral request
      await ctx.createAction('ASK_FOR_REFERRALS');
      // Schedule follow-up referral request for 30 days later
      await ctx.createAction('ASK_FOR_REFERRALS', { followup: '30d' }, 30 * 24 * 60);
    },
  },
  
  // Default configs for other stages (no special actions)
  'Hot Case': {
    requires: [],
    onEnter: async () => {
      // Hot case requires immediate attention but no automated actions
    },
  },
  
  'Meeting Done': {
    requires: [],
    onEnter: async () => {
      // Meeting completed - await next manual action
    },
  },
  
  'Wrong Number': {
    requires: [],
    onEnter: async () => {
      // Dead end - no actions needed
    },
  },
  
  'No Answer': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Schedule callback attempt
      await ctx.createAction('CALL_NOW', { attempt: 'retry' }, 120); // 2 hours later
    },
  },
  
  'Call Back': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Schedule callback as requested
      await ctx.createAction('CALL_NOW', { type: 'callback' }, 60); // 1 hour default
    },
  },
  
  'Whatsapp': {
    requires: [],
    onEnter: async () => {
      // Communication via WhatsApp - manual handling
    },
  },
  
  'Switched Off': {
    requires: [],
    onEnter: async (ctx: StageContext) => {
      // Try again later
      await ctx.createAction('CALL_NOW', { attempt: 'retry_switched_off' }, 240); // 4 hours later
    },
  },
};

/**
 * Validates whether a stage change is allowed
 * @param currentStage Current lead stage
 * @param newStage Desired new stage
 * @param data Additional data for validation (feedback, budget, etc.)
 * @returns Validation result with error message if invalid
 */
export function validateStageChange(
  currentStage: CaseStage,
  newStage: CaseStage,
  data?: Record<string, unknown>
): { valid: boolean; error?: string } {
  const config = transitions[newStage];
  
  if (!config) {
    return { valid: false, error: `Unknown stage: ${newStage}` };
  }

  // Check required fields
  if (config.requires.length > 0) {
    const requirements = config.requires[0].split('|'); // Handle OR requirements
    
    // Special handling for Low Budget: budget OR (dp AND installment)
    if (newStage === 'Low Budget') {
      const hasBudget = !!(data?.budget || data?.totalBudget);
      const hasDP = !!data?.downPayment;
      const hasInstallment = !!data?.monthlyInstallment;
      const hasDPAndInstallment = hasDP && hasInstallment;
      
      if (!hasBudget && !hasDPAndInstallment) {
        return { 
          valid: false, 
          error: 'Low Budget stage requires either total budget OR both down payment and monthly installment' 
        };
      }
    } else {
      // For other stages, check if any requirement is met
      const hasRequired = requirements.some(req => {
        if (req === 'feedback') return data?.feedback;
        if (req === 'budget') return data?.budget || data?.totalBudget;
        if (req === 'dp') return data?.downPayment;
        if (req === 'installment') return data?.monthlyInstallment;
        return false;
      });

      if (!hasRequired) {
        const reqText = requirements.length > 1 
          ? `one of: ${requirements.join(', ')}` 
          : requirements[0];
        return { 
          valid: false, 
          error: `Stage "${newStage}" requires ${reqText}` 
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Gets user-friendly description for each stage
 */
export function getStageDescription(stage: CaseStage): string {
  const descriptions: Record<CaseStage, string> = {
    'New Lead': 'Fresh lead - requires immediate outreach',
    'Potential': 'Qualified lead showing interest',
    'Hot Case': 'High priority - strong buying signals',
    'Meeting Done': 'Meeting completed - awaiting next steps',
    'EOI': 'Expression of Interest submitted',
    'Closed Deal': 'Deal successfully closed',
    'Non Potential': 'Lead not qualified',
    'Low Budget': 'Budget below market availability',
    'Wrong Number': 'Contact information incorrect',
    'No Answer': 'Unable to reach - will retry',
    'Call Back': 'Requested callback at specific time',
    'Whatsapp': 'Prefers WhatsApp communication',
    'Switched Off': 'Phone switched off - will retry',
  };
  return descriptions[stage] || stage;
}

/**
 * Gets color scheme for stage visualization
 */
export function getStageColor(stage: CaseStage): { bg: string; text: string; border: string } {
  const colors: Record<CaseStage, { bg: string; text: string; border: string }> = {
    'New Lead': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'Potential': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'Hot Case': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    'Meeting Done': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'EOI': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    'Closed Deal': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'Non Potential': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'Low Budget': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'Wrong Number': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'No Answer': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
    'Call Back': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'Whatsapp': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'Switched Off': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
  };
  return colors[stage] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
}

