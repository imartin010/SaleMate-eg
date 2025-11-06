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

    const now = new Date().toISOString();

    // Fetch all pending actions that are due
    const { data: dueActions, error: fetchError } = await supabase
      .from('case_actions')
      .select(`
        id,
        lead_id,
        action_type,
        payload,
        due_at,
        created_by,
        leads!inner(client_name, buyer_user_id, assigned_to_id, owner_id)
      `)
      .eq('status', 'PENDING')
      .lte('due_at', now)
      .is('notified_at', null);

    if (fetchError) throw fetchError;

    if (!dueActions || dueActions.length === 0) {
      console.log('✅ No due actions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No due actions', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📬 Processing ${dueActions.length} due actions`);

    let notified = 0;
    let failed = 0;

    // Process each due action
    for (const action of dueActions) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lead = action.leads as any;
        const targetUserId = lead?.buyer_user_id || lead?.assigned_to_id || lead?.owner_id || action.created_by;

        if (!targetUserId) {
          console.warn(`⚠️ No user ID found for action ${action.id}`);
          failed++;
          continue;
        }

        // Send notification
        const notifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            userId: targetUserId,
            title: getActionTitle(action.action_type),
            body: getActionBody(action.action_type, lead?.client_name),
            url: `/crm/case/${action.lead_id}`,
            channels: ['inapp'],
          }),
        });

        if (!notifyResponse.ok) {
          console.error(`Failed to notify for action ${action.id}`);
          failed++;
          continue;
        }

        // Mark action as notified
        await supabase
          .from('case_actions')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', action.id);

        notified++;
      } catch (actionError) {
        console.error(`Error processing action ${action.id}:`, actionError);
        failed++;
      }
    }

    console.log(`✅ Reminder scheduler complete: ${notified} notified, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reminders processed',
        total: dueActions.length,
        notified,
        failed,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reminder scheduler error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getActionTitle(actionType: string): string {
  const titles: Record<string, string> = {
    'CALL_NOW': '📞 Call Lead Now',
    'PUSH_MEETING': '📅 Schedule Meeting',
    'REMIND_MEETING': '⏰ Meeting Reminder',
    'CHANGE_FACE': '👤 Face Change Required',
    'ASK_FOR_REFERRALS': '🤝 Request Referrals',
    'NURTURE': '💬 Nurture Lead',
    'CHECK_INVENTORY': '🏠 Check Inventory',
  };
  return titles[actionType] || `Action Required: ${actionType}`;
}

function getActionBody(actionType: string, clientName?: string): string {
  const name = clientName || 'the client';
  const bodies: Record<string, string> = {
    'CALL_NOW': `Time to call ${name}. Don't miss the 15-minute SLA!`,
    'PUSH_MEETING': `Follow up with ${name} to schedule a meeting`,
    'REMIND_MEETING': `Meeting with ${name} is coming up soon`,
    'CHANGE_FACE': `Consider reassigning ${name} for better engagement`,
    'ASK_FOR_REFERRALS': `Great time to ask ${name} for referrals!`,
    'NURTURE': `Check in with ${name} to maintain engagement`,
    'CHECK_INVENTORY': `Review inventory matches for ${name}`,
  };
  return bodies[actionType] || `You have a pending action for ${name}`;
}

