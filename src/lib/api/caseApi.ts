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
