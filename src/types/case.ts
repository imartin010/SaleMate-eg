// Case Manager Type Definitions

export type CaseStage = 
  | 'New Lead' 
  | 'Potential' 
  | 'Hot Case' 
  | 'Meeting Done' 
  | 'EOI' 
  | 'Closed Deal' 
  | 'Non Potential' 
  | 'Low Budget' 
  | 'Wrong Number' 
  | 'No Answer' 
  | 'Call Back' 
  | 'Whatsapp' 
  | 'Switched Off';

export type CaseActionType = 
  | 'CALL_NOW' 
  | 'PUSH_MEETING' 
  | 'CHANGE_FACE' 
  | 'REMIND_MEETING' 
  | 'ASK_FOR_REFERRALS' 
  | 'NURTURE' 
  | 'CHECK_INVENTORY';

export type CaseActionStatus = 'PENDING' | 'DONE' | 'SKIPPED' | 'EXPIRED';

export interface CaseAction {
  id: string;
  lead_id: string;
  action_type: CaseActionType;
  payload?: Record<string, unknown>;
  due_at?: string;
  status: CaseActionStatus;
  created_by: string;
  created_at: string;
  completed_at?: string;
  notified_at?: string;
}

export interface CaseFeedback {
  id: string;
  lead_id: string;
  stage: string;
  feedback: string;
  ai_coach?: string;
  created_by: string;
  created_at: string;
}

export interface CaseFace {
  id: string;
  lead_id: string;
  from_agent?: string;
  to_agent: string;
  reason?: string;
  created_by: string;
  created_at: string;
  from_agent_profile?: {
    name: string;
    email: string;
  };
  to_agent_profile?: {
    name: string;
    email: string;
  };
}

export interface InventoryMatch {
  id: string;
  lead_id: string;
  filters: Record<string, unknown>;
  result_count: number;
  top_units?: Array<{
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
  recommendation?: string;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  url?: string;
  channels: string[];
  status: 'pending' | 'sent' | 'read';
  read_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface AICoachRecommendation {
  cta: string;
  reason: string;
  suggestedActionType?: CaseActionType;
  dueInMinutes?: number;
}

export interface AICoachResponse {
  recommendations: AICoachRecommendation[];
  followupScript: string;
  riskFlags?: string[];
}

export interface StageChangePayload {
  leadId: string;
  newStage: CaseStage;
  userId: string;
  feedback?: string;
  budget?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  meetingDate?: string;
  propertyType?: string;
}

export interface FaceChangePayload {
  leadId: string;
  toAgentId: string;
  reason?: string;
  userId: string;
}

export interface CreateActionPayload {
  leadId: string;
  actionType: CaseActionType;
  payload?: Record<string, unknown>;
  dueInMinutes?: number;
  userId: string;
}

export interface InventoryMatchRequest {
  leadId: string;
  userId: string;
  totalBudget?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  area?: string;
  minBedrooms?: number;
}

