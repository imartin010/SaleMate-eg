import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FaceChangePayload {
  leadId: string;
  toAgentId: string;
  reason?: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: FaceChangePayload = await req.json();
    const { leadId, toAgentId, reason, userId } = payload;

    if (!leadId || !toAgentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: leadId, toAgentId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current lead assignment
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('assigned_to_id, client_name')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;

    const fromAgentId = lead?.assigned_to_id;

    // Record face change
    const { data: faceChange, error: faceError } = await supabase
      .from('case_faces')
      .insert({
        lead_id: leadId,
        from_agent: fromAgentId,
        to_agent: toAgentId,
        reason,
        created_by: userId,
      })
      .select()
      .single();

    if (faceError) throw faceError;

    // Update lead assignment
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        assigned_to_id: toAgentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) throw updateError;

    // Get new agent details
    const { data: newAgent } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', toAgentId)
      .single();

    // Notify new agent
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userId: toAgentId,
        title: '👤 New Lead Assigned',
        body: `You've been assigned lead: ${lead?.client_name}${reason ? ` - ${reason}` : ''}`,
        url: `/crm/case/${leadId}`,
        channels: ['inapp'],
      }),
    });

    // Notify previous agent if exists
    if (fromAgentId && fromAgentId !== toAgentId) {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          userId: fromAgentId,
          title: '👤 Lead Reassigned',
          body: `Lead "${lead?.client_name}" has been reassigned to ${newAgent?.name || 'another agent'}`,
          url: `/crm/case/${leadId}`,
          channels: ['inapp'],
        }),
      });
    }

    console.log(`✅ Face changed for lead ${leadId}: ${fromAgentId || 'none'} → ${toAgentId}`);

    return new Response(
      JSON.stringify({ success: true, data: faceChange }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Face change error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

