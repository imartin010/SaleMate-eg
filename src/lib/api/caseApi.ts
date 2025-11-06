import { supabase } from '../supabaseClient';
import type {
  StageChangePayload,
  FaceChangePayload,
  CreateActionPayload,
  InventoryMatchRequest,
  AICoachResponse,
  CaseAction,
  CaseFace,
  InventoryMatch,
} from '../../types/case';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Change lead stage and trigger associated actions
 */
export async function changeStage(payload: StageChangePayload): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('case-stage-change', {
    body: payload,
  });

  if (error) {
    console.error('Stage change error:', error);
    throw new Error(error.message || 'Failed to change stage');
  }

  return data;
}

/**
 * Get AI coaching recommendations for a lead
 */
export async function getAICoaching(params: {
  stage: string;
  lead: { id: string; name: string; phone?: string; project_id?: string };
  lastFeedback?: string;
  inventoryContext?: { hasMatches: boolean; topUnits?: unknown[] };
  history?: Array<{ stage: string; note: string; at: string }>;
}): Promise<AICoachResponse> {
  const { data, error } = await supabase.functions.invoke('case-coach', {
    body: params,
  });

  if (error) {
    console.error('AI coaching error:', error);
    throw new Error(error.message || 'Failed to get AI coaching');
  }

  return data.data;
}

/**
 * Create a new case action
 */
export async function createAction(payload: CreateActionPayload): Promise<CaseAction> {
  const { data, error } = await supabase.functions.invoke('case-actions', {
    body: {
      method: 'CREATE',
      ...payload,
    },
  });

  if (error) {
    console.error('Create action error:', error);
    throw new Error(error.message || 'Failed to create action');
  }

  return data.data;
}

/**
 * Complete a case action
 */
export async function completeAction(actionId: string): Promise<CaseAction> {
  const { data, error } = await supabase.functions.invoke('case-actions', {
    body: {
      method: 'COMPLETE',
      actionId,
    },
  });

  if (error) {
    console.error('Complete action error:', error);
    throw new Error(error.message || 'Failed to complete action');
  }

  return data.data;
}

/**
 * Skip a case action
 */
export async function skipAction(actionId: string): Promise<CaseAction> {
  const { data, error } = await supabase.functions.invoke('case-actions', {
    body: {
      method: 'SKIP',
      actionId,
    },
  });

  if (error) {
    console.error('Skip action error:', error);
    throw new Error(error.message || 'Failed to skip action');
  }

  return data.data;
}

/**
 * Change face (reassign lead to different agent)
 */
export async function changeFace(payload: FaceChangePayload): Promise<CaseFace> {
  const { data, error } = await supabase.functions.invoke('case-face-change', {
    body: payload,
  });

  if (error) {
    console.error('Face change error:', error);
    throw new Error(error.message || 'Failed to change face');
  }

  return data.data;
}

/**
 * Match inventory based on budget constraints
 */
export async function matchInventory(payload: InventoryMatchRequest): Promise<{
  resultCount: number;
  topUnits: unknown[];
  recommendation: string;
  matchId: string;
}> {
  const { data, error } = await supabase.functions.invoke('inventory-matcher', {
    body: payload,
  });

  if (error) {
    console.error('Inventory matcher error:', error);
    throw new Error(error.message || 'Failed to match inventory');
  }

  return data.data;
}

/**
 * Send a notification to a user
 */
export async function notifyUser(params: {
  userId: string;
  title: string;
  body: string;
  url?: string;
  channels?: string[];
}): Promise<{ success: boolean }> {
  const { data, error } = await supabase.functions.invoke('notify-user', {
    body: params,
  });

  if (error) {
    console.error('Notify user error:', error);
    throw new Error(error.message || 'Failed to send notification');
  }

  return data;
}

/**
 * Fetch case feedback for a lead
 */
export async function getCaseFeedback(leadId: string) {
  const { data, error } = await supabase
    .from('case_feedback')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch case actions for a lead
 */
export async function getCaseActions(leadId: string) {
  const { data, error } = await supabase
    .from('case_actions')
    .select('*')
    .eq('lead_id', leadId)
    .order('due_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch case faces (face changes) for a lead
 */
export async function getCaseFaces(leadId: string) {
  const { data, error } = await supabase
    .from('case_faces')
    .select(`
      *,
      from_agent_profile:profiles!case_faces_from_agent_fkey(name, email),
      to_agent_profile:profiles!case_faces_to_agent_fkey(name, email)
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch inventory matches for a lead
 */
export async function getInventoryMatches(leadId: string) {
  const { data, error } = await supabase
    .from('inventory_matches')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch notifications for current user
 */
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'sent');

  if (error) throw error;
}

