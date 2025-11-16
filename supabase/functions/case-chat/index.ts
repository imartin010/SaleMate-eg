import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface ChatRequest {
  method: 'INITIALIZE' | 'SEND';
  leadId: string;
  lead: {
    id: string;
    name: string;
    phone?: string;
    project_id?: string;
  };
  stage: string;
  message?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key for auth verification
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const input: ChatRequest = await req.json();
    const { method, leadId, lead, stage, message, conversationHistory = [] } = input;

    // Get lead details and project info
    const { data: leadData } = await supabase
      .from('leads')
      .select('*, projects(id, name, region)')
      .eq('id', leadId)
      .single();

    const projectName = leadData?.projects?.name || 'Unknown Project';
    const projectRegion = leadData?.projects?.region || '';

    // Get existing chat messages if not provided
    let history = conversationHistory;
    if (history.length === 0) {
      const { data: existingMessages } = await supabase
        .from('activities')
        .select('body, payload')
        .eq('lead_id', leadId)
        .eq('activity_type', 'chat')
        .order('created_at', { ascending: true })
        .limit(20);

      if (existingMessages) {
        history = existingMessages.map((msg) => ({
          role: (msg.payload as any)?.role || 'user',
          content: msg.body || '',
        }));
      }
    }

    // Build system prompt
    const systemPrompt = `You are an expert real estate sales coach specializing in the Egyptian market. Your role is to help sales agents close deals by providing:

1. **Strategic advice** - What to do next to move the deal forward
2. **Communication scripts** - Ready-to-use messages in Egyptian Arabic for calls/WhatsApp
3. **Objection handling** - How to address client concerns
4. **Timing recommendations** - When to follow up
5. **Risk identification** - Warning signs to watch for

**Lead Context:**
- Client Name: ${lead.name}
- Phone: ${lead.phone || 'N/A'}
- Current Stage: ${stage}
- Project: ${projectName}${projectRegion ? ` (${projectRegion})` : ''}

**Your Communication Style:**
- Be conversational, friendly, and supportive
- Ask clarifying questions when needed
- Provide actionable, specific advice
- Use Egyptian Arabic for scripts (Arabic script)
- Be proactive - suggest next steps
- Celebrate wins and encourage persistence

**Important:** 
- Keep responses concise but helpful
- Focus on closing the deal
- Consider Egyptian market context and cultural norms
- Always be encouraging and professional`;

    let aiResponse: string;

    if (method === 'INITIALIZE') {
      // AI initiates conversation
      const initPrompt = `Start a conversation with the sales agent to help them close this deal. 

Based on the lead being at stage "${stage}", provide:
1. A friendly greeting
2. An assessment of where they are in the sales process
3. A specific question or recommendation to help move forward

Keep it conversational and helpful.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: initPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;

      // Save AI's initial message
      const { data: savedMessage, error: saveError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'ai_coach',
          actor_profile_id: user.id,
          stage: stage,
          body: aiResponse,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving initial message:', saveError);
      }

      return new Response(
        JSON.stringify({
          data: {
            message: {
              id: savedMessage?.id || `temp-${Date.now()}`,
              role: 'assistant',
              content: aiResponse,
              created_at: savedMessage?.created_at || new Date().toISOString(),
            },
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (method === 'SEND') {
      // User sends message, AI responds
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'feedback',
          actor_profile_id: user.id,
          stage: stage,
          body: message,
          payload: { role: 'user' },
        })
        .select()
        .single();

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
      }

      // Build conversation context for AI
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;

      // Save AI response
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'ai_coach',
          actor_profile_id: user.id,
          stage: stage,
          body: aiResponse,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
      }

      return new Response(
        JSON.stringify({
          data: {
            message: {
              id: aiMessage?.id || `temp-${Date.now()}`,
              role: 'assistant',
              content: aiResponse,
              created_at: aiMessage?.created_at || new Date().toISOString(),
            },
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

