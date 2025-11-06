import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

interface CoachInput {
  stage: string;
  lead: {
    id: string;
    name: string;
    phone?: string;
    project_id?: string;
  };
  lastFeedback?: string;
  inventoryContext?: {
    hasMatches: boolean;
    topUnits?: Array<Record<string, unknown>>;
  };
  history?: Array<{ stage: string; note: string; at: string }>;
}

interface CoachOutput {
  recommendations: Array<{
    cta: string;
    reason: string;
    suggestedActionType?: string;
    dueInMinutes?: number;
  }>;
  followupScript: string;
  riskFlags?: string[];
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

    const input: CoachInput = await req.json();
    const { stage, lead, lastFeedback, inventoryContext, history } = input;

    // Build detailed prompt for GPT-4
    const prompt = `You are an expert real estate sales coach for the Egyptian market. Analyze this lead case and provide actionable, specific recommendations.

**Lead Information:**
- Name: ${lead.name}
- Phone: ${lead.phone || 'N/A'}
- Current Stage: ${stage}

**Context:**
- Last Feedback: ${lastFeedback || 'None yet'}
- Inventory Matches Available: ${inventoryContext?.hasMatches ? 'Yes' : 'No'}
${inventoryContext?.hasMatches && inventoryContext?.topUnits ? `- Top ${inventoryContext.topUnits.length} matching units found` : ''}
${history && history.length > 0 ? `\n**History:**\n${history.map(h => `- ${h.stage}: ${h.note} (${h.at})`).join('\n')}` : ''}

**Task:**
Provide a detailed coaching response with:

1. **3-5 Specific Recommendations**: Each with:
   - A clear call-to-action (CTA)
   - Reasoning/justification
   - Suggested action type (CALL_NOW, PUSH_MEETING, CHANGE_FACE, etc.)
   - Recommended timing in minutes (if time-sensitive)

2. **Follow-up Script**: Ready-to-use script for phone call or WhatsApp message (keep it professional but conversational for Egyptian market)

3. **Risk Flags**: Any concerns (e.g., "Low engagement", "Budget mismatch", "Wrong timing", "Needs immediate attention")

**Important**: Consider the Egyptian real estate market context, typical buyer behavior, and cultural communication styles.

Respond in valid JSON format with this exact structure:
{
  "recommendations": [
    {
      "cta": "string",
      "reason": "string",
      "suggestedActionType": "string",
      "dueInMinutes": number
    }
  ],
  "followupScript": "string",
  "riskFlags": ["string"]
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate sales coach specializing in the Egyptian market. Provide actionable, specific advice in valid JSON format only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI coaching advice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    // Parse JSON response
    let aiResponse: CoachOutput;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      aiResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback response
      aiResponse = {
        recommendations: [
          {
            cta: 'Follow up with client',
            reason: 'Maintain engagement based on current stage',
            suggestedActionType: 'CALL_NOW',
            dueInMinutes: 60,
          },
        ],
        followupScript: `Hello ${lead.name}, this is regarding the property inquiry. How can I assist you today?`,
        riskFlags: ['AI parsing error - using fallback recommendations'],
      };
    }

    console.log(`✅ AI coaching generated for lead ${lead.id} at stage ${stage}`);

    return new Response(
      JSON.stringify({ success: true, data: aiResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

