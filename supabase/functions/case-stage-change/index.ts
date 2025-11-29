import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StageChangePayload {
  leadId?: string;
  leadIds?: string[];
  newStage: string;
  userId: string;
  feedback?: string;
  budget?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  meetingDate?: string;
  propertyType?: string;
  bulk?: boolean;
}

async function processStageChange(
  leadId: string,
  newStage: string,
  userId: string,
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string,
  feedback?: string,
  budget?: number,
  downPayment?: number,
  monthlyInstallment?: number,
  meetingDate?: string,
  propertyType?: string
): Promise<{ success: boolean; error?: string; inventoryMatch?: any }> {
  try {
    // Update lead stage
    const { error: updateError } = await supabase
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (updateError) {
      return { success: false, error: `Failed to update lead stage: ${updateError.message}` };
    }

    // Get lead details for notifications
    const { data: lead } = await supabase
      .from('leads')
      .select('client_name, buyer_user_id, assigned_to_id, owner_id')
      .eq('id', leadId)
      .single();

    // Handle stage-specific actions
    const targetUserId = lead?.buyer_user_id || lead?.assigned_to_id || lead?.owner_id || userId;
    let inventoryMatchResult = null;

    switch (newStage) {
      case 'New Lead': {
        // Create CALL_NOW action with 15-minute SLA
        const dueAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'follow_up',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          due_at: dueAt,
          payload: { action_type: 'CALL_NOW', sla: '15m' },
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
          const { data: feedbackData } = await supabase.from('activities').insert({
            lead_id: leadId,
            activity_type: 'feedback',
            event_type: 'feedback',
            actor_profile_id: userId,
            stage: newStage,
            body: feedback,
          }).select().single();

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

          if (coachResponse.ok && feedbackData) {
            const coachData = await coachResponse.json();
            // Update feedback with AI coach recommendations
            await supabase.from('activities').update({ 
              ai_coach: JSON.stringify(coachData.data) 
            }).eq('id', feedbackData.id);
          }
        }

        // Create PUSH_MEETING action
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'meeting',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          payload: { action_type: 'PUSH_MEETING' },
        });

        // If meeting date provided, create reminders
        if (meetingDate) {
          const meetingTime = new Date(meetingDate).getTime();
          const reminder24h = new Date(meetingTime - 24 * 60 * 60 * 1000).toISOString();
          const reminder2h = new Date(meetingTime - 2 * 60 * 60 * 1000).toISOString();

          await supabase.from('activities').insert([
            {
              lead_id: leadId,
              activity_type: 'task',
              task_type: 'meeting',
              task_status: 'pending',
              actor_profile_id: userId,
              assignee_profile_id: userId,
              payload: { action_type: 'REMIND_MEETING', meeting_date: meetingDate, reminder: '24h' },
              due_at: reminder24h,
            },
            {
              lead_id: leadId,
              activity_type: 'task',
              task_type: 'meeting',
              task_status: 'pending',
              actor_profile_id: userId,
              assignee_profile_id: userId,
              payload: { action_type: 'REMIND_MEETING', meeting_date: meetingDate, reminder: '2h' },
              due_at: reminder2h,
            },
          ]);
        }
        break;
      }

      case 'Non Potential': {
        // Save feedback if provided
        if (feedback) {
          await supabase.from('activities').insert({
            lead_id: leadId,
            activity_type: 'feedback',
            event_type: 'feedback',
            actor_profile_id: userId,
            stage: newStage,
            body: feedback,
          });
        }

        // Create CHANGE_FACE action
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'custom',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          payload: { action_type: 'CHANGE_FACE', reason: 'Verify non potential classification' },
        });
        break;
      }

      case 'Low Budget': {
        // Trigger inventory matching if budget info provided
        if (budget || downPayment || monthlyInstallment) {
          try {
            const matchResponse = await fetch(`${supabaseUrl}/functions/v1/inventory-matcher`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
              body: JSON.stringify({
                leadId,
                userId,
                totalBudget: budget,
                downPayment,
                monthlyInstallment,
                propertyType,
              }),
            });

            if (matchResponse.ok) {
              const matchData = await matchResponse.json();
              inventoryMatchResult = matchData.data || matchData;
            } else {
              const errorData = await matchResponse.json().catch(() => ({}));
              console.error('Inventory matcher error:', errorData);
              inventoryMatchResult = {
                resultCount: 0,
                topUnits: [],
                recommendation: errorData.error || 'Unable to match inventory. Please try again.',
                matchId: '',
              };
            }
          } catch (err) {
            console.error('Inventory matcher exception:', err);
            inventoryMatchResult = {
              resultCount: 0,
              topUnits: [],
              recommendation: 'Error matching inventory. Please try again later.',
              matchId: '',
            };
          }
        } else {
          inventoryMatchResult = {
            resultCount: 0,
            topUnits: [],
            recommendation: 'No budget information provided for matching.',
            matchId: '',
          };
        }
        break;
      }

      case 'EOI': {
        // Expression of Interest - suggest face change for pre-launch reinforcement
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'custom',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          payload: { action_type: 'CHANGE_FACE', reason: 'Pre-launch reinforcement - second opinion' },
        });
        break;
      }

      case 'Closed Deal': {
        // Create ASK_FOR_REFERRALS action immediately
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'follow_up',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          payload: { action_type: 'ASK_FOR_REFERRALS' },
        });

        // Create follow-up referral request for 30 days later
        const followupDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('activities').insert({
          lead_id: leadId,
          activity_type: 'task',
          task_type: 'follow_up',
          task_status: 'pending',
          actor_profile_id: userId,
          assignee_profile_id: userId,
          payload: { action_type: 'ASK_FOR_REFERRALS', followup: '30d' },
          due_at: followupDate,
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
    return { success: true, inventoryMatch: inventoryMatchResult };
  } catch (error) {
    console.error(`Error processing stage change for lead ${leadId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
    const { leadId, leadIds, newStage, userId, feedback, budget, downPayment, monthlyInstallment, meetingDate, propertyType, bulk } = payload;

    // Handle bulk operations
    if (bulk && leadIds && leadIds.length > 0) {
      const results: Array<{ leadId: string; success: boolean; error?: string }> = [];
      let successCount = 0;
      let failedCount = 0;

      for (const id of leadIds) {
        const result = await processStageChange(
          id,
          newStage,
          userId,
          supabase,
          supabaseUrl,
          supabaseKey,
          feedback,
          budget,
          downPayment,
          monthlyInstallment,
          meetingDate,
          propertyType
        );

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          results.push({ leadId: id, success: false, error: result.error });
        }
      }

      return new Response(
        JSON.stringify({
          success: successCount,
          failed: failedCount,
          errors: results.filter(r => !r.success).map(r => ({ leadId: r.leadId, error: r.error || 'Unknown error' })),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single lead operation
    if (!leadId) {
      throw new Error('leadId is required for single stage change');
    }

    const result = await processStageChange(
      leadId,
      newStage,
      userId,
      supabase,
      supabaseUrl,
      supabaseKey,
      feedback,
      budget,
      downPayment,
      monthlyInstallment,
      meetingDate,
      propertyType
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to change stage');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Stage changed to ${newStage}`,
        inventoryMatch: result.inventoryMatch
      }),
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

