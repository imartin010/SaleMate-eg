import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.68.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface SummaryRequest {
  leadId: string;
}

serve(async (req) => {
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

    const payload: SummaryRequest = await req.json();
    const { leadId } = payload;

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'leadId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, client_name, stage, budget')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all feedback entries with AI coach data
    const { data: feedbackEvents, error: feedbackError } = await supabase
      .from('events')
      .select('id, body, ai_coach, stage, created_at')
      .eq('lead_id', leadId)
      .eq('event_type', 'activity')
      .eq('activity_type', 'feedback')
      .order('created_at', { ascending: false })
      .limit(10);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
    }

    // If no feedback, return a simple message
    if (!feedbackEvents || feedbackEvents.length === 0) {
      return new Response(
        JSON.stringify({
          summary: 'No feedback or AI analysis available yet. Start by adding feedback to get AI insights.',
          hasData: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from feedback and AI coach data
    const feedbackContext: string[] = [];
    const aiInsights: string[] = [];

    for (const event of feedbackEvents) {
      if (event.body) {
        feedbackContext.push(`[${event.stage || 'Unknown Stage'}] ${event.body}`);
      }

      if (event.ai_coach) {
        try {
          const aiCoach = typeof event.ai_coach === 'string' 
            ? JSON.parse(event.ai_coach) 
            : event.ai_coach;
          
          if (aiCoach.recommendations && Array.isArray(aiCoach.recommendations)) {
            aiCoach.recommendations.forEach((rec: any) => {
              if (rec.cta) aiInsights.push(rec.cta);
              if (rec.reason) aiInsights.push(rec.reason);
            });
          }

          if (aiCoach.followupScript) {
            aiInsights.push(aiCoach.followupScript);
          }

          if (aiCoach.riskFlags && Array.isArray(aiCoach.riskFlags)) {
            aiInsights.push(`⚠️ Risks: ${aiCoach.riskFlags.join(', ')}`);
          }
        } catch (e) {
          console.error('Error parsing AI coach data:', e);
        }
      }
    }

    // Combine all context
    const allContext = [
      `Lead: ${lead.client_name}`,
      `Current Stage: ${lead.stage}`,
      lead.budget ? `Budget: EGP ${lead.budget.toLocaleString()}` : '',
      '',
      'Feedback History:',
      ...feedbackContext,
      '',
      'AI Insights:',
      ...aiInsights,
    ].filter(Boolean).join('\n');

    // Generate concise summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sales AI assistant. Generate a concise, actionable summary (2-4 short sentences) about the current situation with this lead based on feedback and AI coaching conversations. Focus on:
- Current status and situation
- Key insights from conversations
- Important next steps or concerns
- Any risks or opportunities

Keep it brief, clear, and actionable. Use simple language.`,
        },
        {
          role: 'user',
          content: `Based on this lead's feedback and AI coaching history, provide a concise summary:\n\n${allContext}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content || 
      'Unable to generate AI summary at this time.';

    return new Response(
      JSON.stringify({
        summary,
        hasData: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        summary: 'Unable to generate AI summary at this time.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

