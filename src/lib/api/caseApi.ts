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
  Notification,
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
    .from('lead_events')
    .select(`
      id,
      lead_id,
      stage,
      summary,
      payload,
      actor_profile_id,
      created_at
    `)
    .eq('lead_id', leadId)
    .eq('event_type', 'feedback')
    .contains('payload', { source: 'case_feedback' })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((event) => {
    const payload = (event as any)?.payload ?? {};
    return {
      id: event.id,
      lead_id: event.lead_id,
      stage: event.stage ?? 'N/A',
      feedback: event.summary ?? payload.feedback_text ?? '',
      ai_coach: payload.ai_coach ?? undefined,
      created_by: event.actor_profile_id ?? '',
      created_at: event.created_at,
    } satisfies CaseFeedback;
  });
}

/**
 * Fetch case actions for a lead
 */
export async function getCaseActions(leadId: string) {
  const { data, error } = await supabase
    .from('lead_tasks')
    .select(`
      id,
      lead_id,
      created_by_profile_id,
      task_type,
      status,
      due_at,
      completed_at,
      payload,
      created_at
    `)
    .eq('lead_id', leadId)
    .contains('payload', { source: 'case_actions' })
    .order('due_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((task) => {
    const payload = (task as any)?.payload ?? {};
    const originalActionType = payload.action_type ?? task.task_type ?? 'custom';
    const rawStatus = (task.status ?? '').toString().toLowerCase();

    const statusMap: Record<string, CaseActionStatus> = {
      completed: 'DONE',
      cancelled: 'SKIPPED',
      skipped: 'SKIPPED',
      expired: 'EXPIRED',
      overdue: 'EXPIRED',
      in_progress: 'PENDING',
      pending: 'PENDING',
    };

    return {
      id: task.id,
      lead_id: task.lead_id,
      action_type: String(originalActionType).toUpperCase() as CaseAction['action_type'],
      payload: (payload.payload ?? payload) as Record<string, unknown>,
      due_at: task.due_at ?? undefined,
      status: statusMap[rawStatus] ?? 'PENDING',
      created_by: task.created_by_profile_id ?? '',
      created_at: task.created_at,
      completed_at: task.completed_at ?? undefined,
      notified_at: payload.notified_at ?? undefined,
    } satisfies CaseAction;
  });
}

/**
 * Fetch case faces (face changes) for a lead
 */
export async function getCaseFaces(leadId: string) {
  const { data, error } = await supabase
    .from('lead_transfers')
    .select(`
      *,
      from_agent_profile:profiles!lead_transfers_from_profile_id_fkey(name, email),
      to_agent_profile:profiles!lead_transfers_to_profile_id_fkey(name, email)
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((transfer) => ({
    id: transfer.id,
    lead_id: transfer.lead_id,
    from_agent: transfer.from_profile_id ?? undefined,
    to_agent: transfer.to_profile_id,
    reason: transfer.reason ?? undefined,
    created_by: transfer.created_by_profile_id ?? '',
    created_at: transfer.created_at,
    from_agent_profile: transfer.from_agent_profile ?? undefined,
    to_agent_profile: transfer.to_agent_profile ?? undefined,
  })) as CaseFace[];
}

/**
 * Fetch inventory matches for a lead
 */
export async function getInventoryMatches(leadId: string) {
  const { data, error } = await supabase
    .from('lead_recommendations')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((match) => ({
    id: match.id,
    lead_id: match.lead_id,
    filters: match.filters ?? {},
    result_count: match.result_count ?? 0,
    top_units: match.top_units ?? [],
    recommendation: match.recommendation ?? undefined,
    created_by: match.generated_by_profile_id ?? '',
    created_at: match.created_at,
  })) as InventoryMatch[];
}

/**
 * Fetch notifications for current user
 */
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notification_events')
    .select('*')
    .eq('target_profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((notification) => ({
    id: notification.id,
    user_id: notification.target_profile_id,
    title: notification.title,
    body: notification.body,
    url: notification.metadata?.url ?? undefined,
    channels: notification.channels ?? [],
    status: notification.status,
    read_at: notification.read_at ?? undefined,
    sent_at: notification.sent_at ?? undefined,
    created_at: notification.created_at,
  })) as Notification[];
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notification_events')
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
    .from('notification_events')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('target_profile_id', userId)
    .eq('status', 'sent');

  if (error) throw error;
}

