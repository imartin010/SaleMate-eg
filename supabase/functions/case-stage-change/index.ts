import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StageChangePayload {
  leadId: string;
  newStage: string;
  userId: string;
  feedback?: string;
  budget?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  meetingDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: StageChangePayload = await req.json();
    const { leadId, newStage, userId, feedback, budget, downPayment, monthlyInstallment, meetingDate } = payload;

    // Update lead stage
    const { error: updateError } = await supabase
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (updateError) {
      throw new Error(`Failed to update lead stage: ${updateError.message}`);
    }

    // Get lead details for notifications
    const { data: lead } = await supabase
      .from('leads')
      .select('client_name, buyer_user_id, assigned_to_id, owner_id')
      .eq('id', leadId)
      .single();

    // Handle stage-specific actions
    const targetUserId = lead?.buyer_user_id || lead?.assigned_to_id || lead?.owner_id || userId;

    switch (newStage) {
      case 'New Lead': {
        // Create CALL_NOW action with 15-minute SLA
        const dueAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'CALL_NOW',
          payload: { sla: '15m' },
          due_at: dueAt,
          status: 'PENDING',
          created_by: userId,
        });

        // Send notification
        await fetch(`${supabaseUrl}/functions/v1/notify-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            userId: targetUserId,
            title: '📞 Call Now Required',
            body: `New lead "${lead?.client_name}" requires immediate call within 15 minutes`,
            url: `/crm/case/${leadId}`,
            channels: ['inapp'],
          }),
        });
        break;
      }

      case 'Potential': {
        // Save feedback if provided
        if (feedback) {
          await supabase.from('case_feedback').insert({
            lead_id: leadId,
            stage: newStage,
            feedback,
            created_by: userId,
          });

          // Call AI coach
          const coachResponse = await fetch(`${supabaseUrl}/functions/v1/case-coach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stage: newStage,
              lead: { id: leadId, name: lead?.client_name },
              lastFeedback: feedback,
            }),
          });

          if (coachResponse.ok) {
            const coachData = await coachResponse.json();
            // Update feedback with AI coach recommendations
            await supabase.from('case_feedback').update({ 
              ai_coach: JSON.stringify(coachData.data) 
            }).eq('lead_id', leadId).eq('feedback', feedback);
          }
        }

        // Create PUSH_MEETING action
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'PUSH_MEETING',
          status: 'PENDING',
          created_by: userId,
        });

        // If meeting date provided, create reminders
        if (meetingDate) {
          const meetingTime = new Date(meetingDate).getTime();
          const reminder24h = new Date(meetingTime - 24 * 60 * 60 * 1000).toISOString();
          const reminder2h = new Date(meetingTime - 2 * 60 * 60 * 1000).toISOString();

          await supabase.from('case_actions').insert([
            {
              lead_id: leadId,
              action_type: 'REMIND_MEETING',
              payload: { meeting_date: meetingDate, reminder: '24h' },
              due_at: reminder24h,
              status: 'PENDING',
              created_by: userId,
            },
            {
              lead_id: leadId,
              action_type: 'REMIND_MEETING',
              payload: { meeting_date: meetingDate, reminder: '2h' },
              due_at: reminder2h,
              status: 'PENDING',
              created_by: userId,
            },
          ]);
        }
        break;
      }

      case 'Non Potential': {
        // Save feedback if provided
        if (feedback) {
          await supabase.from('case_feedback').insert({
            lead_id: leadId,
            stage: newStage,
            feedback,
            created_by: userId,
          });
        }

        // Create CHANGE_FACE action
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'CHANGE_FACE',
          payload: { reason: 'Verify non potential classification' },
          status: 'PENDING',
          created_by: userId,
        });
        break;
      }

      case 'Low Budget': {
        // Trigger inventory matching if budget info provided
        if (budget || downPayment || monthlyInstallment) {
          await fetch(`${supabaseUrl}/functions/v1/inventory-matcher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            body: JSON.stringify({
              leadId,
              userId,
              totalBudget: budget,
              downPayment,
              monthlyInstallment,
            }),
          });
        }
        break;
      }

      case 'EOI': {
        // Expression of Interest - suggest face change for pre-launch reinforcement
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'CHANGE_FACE',
          payload: { reason: 'Pre-launch reinforcement - second opinion' },
          status: 'PENDING',
          created_by: userId,
        });
        break;
      }

      case 'Closed Deal': {
        // Create ASK_FOR_REFERRALS action immediately
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'ASK_FOR_REFERRALS',
          status: 'PENDING',
          created_by: userId,
        });

        // Create follow-up referral request for 30 days later
        const followupDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('case_actions').insert({
          lead_id: leadId,
          action_type: 'ASK_FOR_REFERRALS',
          payload: { followup: '30d' },
          due_at: followupDate,
          status: 'PENDING',
          created_by: userId,
        });

        // Send congratulations notification
        await fetch(`${supabaseUrl}/functions/v1/notify-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            userId: targetUserId,
            title: '🎉 Deal Closed!',
            body: `Congratulations on closing the deal with "${lead?.client_name}"!`,
            url: `/crm/case/${leadId}`,
            channels: ['inapp'],
          }),
        });
        break;
      }
    }

    console.log(`✅ Stage changed to "${newStage}" for lead ${leadId}`);

    return new Response(
      JSON.stringify({ success: true, message: `Stage changed to ${newStage}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stage change error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

