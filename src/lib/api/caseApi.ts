import { supabase } from '../supabaseClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Initialize chat - returns first AI message or null if chat already exists
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
        action: 'initialize',
        leadId,
        ...params,
      },
    });

    if (error) {
      console.error('Chat initialize error:', error);
      throw new Error(error.message || 'Failed to initialize chat');
    }

    return data?.message || null;
  } catch (error) {
    console.error('Error initializing chat:', error);
    throw error;
  }
}

/**
 * Send a message and get AI response
 */
export async function sendChatMessage(
  leadId: string,
  params: {
    message: string;
    lead: { id: string; name: string; phone?: string; project_id?: string };
    stage: string;
  }
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase.functions.invoke('case-chat', {
      body: {
        action: 'send',
        leadId,
        ...params,
      },
    });

    if (error) {
      console.error('Chat send error:', error);
      throw new Error(error.message || 'Failed to send message');
    }

    return data?.message || null;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Get all chat messages for a lead
 */
export async function getChatMessages(leadId: string): Promise<ChatMessage[]> {
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('id, body, created_at, payload')
    .eq('lead_id', leadId)
    .eq('activity_type', 'chat')
    .order('created_at', { ascending: true });

  if (eventsError) {
    console.error('Error fetching chat messages:', eventsError);
    return [];
  }

  if (!eventsData || eventsData.length === 0) {
    return [];
  }

  return eventsData.map((event) => {
    const payload = (event.payload ?? {}) as any;
    return {
      id: event.id,
      role: payload.role || 'user',
      content: event.body || '',
      created_at: event.created_at,
    } as ChatMessage;
  });
}

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('target_profile_id', userId)
    .eq('event_type', 'notification')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('events')
    .update({ 
      notification_status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('event_type', 'notification');

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('events')
    .update({ 
      notification_status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('target_profile_id', userId)
    .eq('event_type', 'notification')
    .eq('notification_status', 'sent');

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get case feedback for a lead
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

  if (error) {
    console.error('Error fetching case feedback:', error);
    throw error;
  }

  return (data ?? []).map((activity) => ({
    id: activity.id,
    lead_id: activity.lead_id,
    stage: activity.stage ?? 'N/A',
    feedback: activity.body ?? '',
    ai_coach: activity.ai_coach ?? undefined,
    created_by: activity.actor_profile_id ?? '',
    created_at: activity.created_at,
  }));
}

/**
 * Get case actions for a lead
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

  if (error) {
    console.error('Error fetching case actions:', error);
    throw error;
  }

  return (data ?? []).map((activity) => {
    const payload = (activity.payload ?? {}) as any;
    const originalActionType = payload.action_type ?? activity.task_type ?? 'custom';
    const rawStatus = (activity.task_status ?? '').toString().toLowerCase();

    const statusMap: Record<string, string> = {
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
      action_type: String(originalActionType).toUpperCase(),
      payload: (payload.payload ?? payload) as Record<string, unknown>,
      due_at: activity.due_at ?? undefined,
      status: statusMap[rawStatus] ?? 'PENDING',
      created_by: activity.actor_profile_id ?? '',
      created_at: activity.created_at,
      completed_at: activity.completed_at ?? undefined,
      notified_at: payload.notified_at ?? undefined,
    };
  });
}

/**
 * Get case faces (face changes) for a lead
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

  if (error) {
    console.error('Error fetching case faces:', error);
    throw error;
  }

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
  }));
}

/**
 * Get inventory matches for a lead
 */
export async function getInventoryMatches(leadId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('lead_id', leadId)
    .eq('event_type', 'activity')
    .eq('activity_type', 'recommendation')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory matches:', error);
    throw error;
  }

  return (data ?? []).map((activity) => ({
    id: activity.id,
    lead_id: activity.lead_id,
    filters: activity.filters ?? {},
    result_count: activity.result_count ?? 0,
    top_units: activity.top_units ?? [],
    recommendation: activity.recommendation ?? undefined,
    created_by: activity.actor_profile_id ?? '',
    created_at: activity.created_at,
  }));
}
