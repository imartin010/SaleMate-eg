import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method, actionId, leadId, actionType, payload, dueInMinutes, userId, status } = await req.json();

    switch (method) {
      case 'CREATE': {
        if (!leadId || !actionType || !userId) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: leadId, actionType, userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let dueAt: string | null = null;
        if (dueInMinutes && dueInMinutes > 0) {
          dueAt = new Date(Date.now() + dueInMinutes * 60 * 1000).toISOString();
        }

        const { data, error } = await supabase
          .from('case_actions')
          .insert({
            lead_id: leadId,
            action_type: actionType,
            payload: payload || null,
            due_at: dueAt,
            status: 'PENDING',
            created_by: userId,
          })
          .select()
          .single();

        if (error) throw error;

        // If action has due date, create notification
        if (dueAt) {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              userId,
              title: `Action Required: ${actionType.replace(/_/g, ' ')}`,
              body: `You have a pending action for this case`,
              url: `/crm/case/${leadId}`,
              channels: ['inapp'],
            }),
          });
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'UPDATE': {
        if (!actionId) {
          return new Response(
            JSON.stringify({ error: 'Missing actionId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (status === 'DONE') updates.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('case_actions')
          .update(updates)
          .eq('id', actionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'COMPLETE': {
        if (!actionId) {
          return new Response(
            JSON.stringify({ error: 'Missing actionId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('case_actions')
          .update({
            status: 'DONE',
            completed_at: new Date().toISOString(),
          })
          .eq('id', actionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'SKIP': {
        if (!actionId) {
          return new Response(
            JSON.stringify({ error: 'Missing actionId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('case_actions')
          .update({ status: 'SKIPPED' })
          .eq('id', actionId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid method. Use CREATE, UPDATE, COMPLETE, or SKIP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Case actions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

