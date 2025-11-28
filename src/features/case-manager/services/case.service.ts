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
export async function changeStage(payload: StageChangePayload): Promise<{ 
  success: boolean; 
  message: string;
  inventoryMatch?: {
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
  } | null;
}> {
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
    .from('events')
    .select(`
      id,
      lead_id,
      stage,
      body,
      ai_coach,
      actor_profile_id,
      created_at
    `)
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'feedback')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((activity) => ({
    id: activity.id,
    lead_id: activity.lead_id,
    stage: activity.stage ?? 'N/A',
    feedback: activity.body ?? '',
    ai_coach: activity.ai_coach ?? undefined,
    created_by: activity.actor_profile_id ?? '',
    created_at: activity.created_at,
  })) as CaseFeedback[];
}

/**
 * Fetch case actions for a lead
 */
export async function getCaseActions(leadId: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      lead_id,
      actor_profile_id,
      task_type,
      task_status,
      due_at,
      completed_at,
      payload,
      created_at
    `)
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'task')
    .order('due_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((activity) => {
    const payload = (activity.payload ?? {}) as any;
    const originalActionType = payload.action_type ?? activity.task_type ?? 'custom';
    const rawStatus = (activity.task_status ?? '').toString().toLowerCase();

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
      id: activity.id,
      lead_id: activity.lead_id,
      action_type: String(originalActionType).toUpperCase() as CaseAction['action_type'],
      payload: (payload.payload ?? payload) as Record<string, unknown>,
      due_at: activity.due_at ?? undefined,
      status: statusMap[rawStatus] ?? 'PENDING',
      created_by: activity.actor_profile_id ?? '',
      created_at: activity.created_at,
      completed_at: activity.completed_at ?? undefined,
      notified_at: payload.notified_at ?? undefined,
    } satisfies CaseAction;
  });
}

/**
 * Fetch case faces (face changes) for a lead
 */
export async function getCaseFaces(leadId: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      lead_id,
      from_profile_id,
      to_profile_id,
      reason,
      actor_profile_id,
      created_at,
      from_profile:profiles!events_from_profile_id_fkey(name, email),
      to_profile:profiles!events_to_profile_id_fkey(name, email)
    `)
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'transfer')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((activity) => ({
    id: activity.id,
    lead_id: activity.lead_id,
    from_agent: activity.from_profile_id ?? undefined,
    to_agent: activity.to_profile_id ?? '',
    reason: activity.reason ?? undefined,
    created_by: activity.actor_profile_id ?? '',
    created_at: activity.created_at,
    from_agent_profile: activity.from_profile ?? undefined,
    to_agent_profile: activity.to_profile ?? undefined,
  })) as CaseFace[];
}

/**
 * Fetch inventory matches for a lead
 */
export async function getInventoryMatches(leadId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'recommendation')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((activity) => ({
    id: activity.id,
    lead_id: activity.lead_id,
    filters: activity.filters ?? {},
    result_count: activity.result_count ?? 0,
    top_units: activity.top_units ?? [],
    recommendation: activity.recommendation ?? undefined,
    created_by: activity.actor_profile_id ?? '',
    created_at: activity.created_at,
  })) as InventoryMatch[];
}

/**
 * Fetch notifications for current user
 */
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'notification')
    .eq('target_profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((notification) => ({
    id: notification.id,
    user_id: notification.target_profile_id,
    title: notification.title,
    body: notification.body,
    url: notification.notification_url ?? undefined,
    channels: notification.notification_channels ?? [],
    status: notification.notification_status,
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
    .from('events')
    .update({ notification_status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('event_type', 'notification')
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
    .from('events')
    .update({ notification_status: 'read', read_at: new Date().toISOString() })
    .eq('event_type', 'notification')
    .eq('target_profile_id', userId)
    .eq('notification_status', 'sent');

  if (error) throw error;
}

/**
 * Chat Interface Functions
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Initialize chat with AI's first message
 */
export async function initializeChat(
  leadId: string,
  params: {
    lead: { id: string; name: string; phone?: string; project_id?: string };
    stage: string;
  }
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase.functions.invoke('case-chat', {
      body: {
        method: 'INITIALIZE',
        leadId,
        ...params,
      },
    });

    if (error) {
      console.error('Chat initialization error:', error);
      return null;
    }

    console.log('Chat init response data:', data); // Debug log
    return data?.data?.message || data?.message || null;
  } catch (error) {
    console.error('Error initializing chat:', error);
    return null;
  }
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  leadId: string,
  params: {
    message: string;
    lead: { id: string; name: string; phone?: string; project_id?: string };
    stage: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase.functions.invoke('case-chat', {
      body: {
        method: 'SEND',
        leadId,
        ...params,
      },
    });

    if (error) {
      console.error('Chat send error:', error);
      throw new Error(error.message || 'Failed to send message');
    }

    console.log('Chat response data:', data); // Debug log
    return data?.data?.message || data?.message || null;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Get chat messages for a lead
 */
export async function getChatMessages(leadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, body, created_at, payload')
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'chat')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return (data ?? []).map((activity) => {
    const payload = (activity.payload ?? {}) as any;
    return {
      id: activity.id,
      role: payload.role || 'user',
      content: activity.body || '',
      created_at: activity.created_at,
    } as ChatMessage;
  });
}

