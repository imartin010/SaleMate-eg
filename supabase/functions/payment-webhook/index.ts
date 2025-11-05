// Supabase Edge Function: Payment Webhook
// Handles payment callbacks from payment gateways (Stripe, Paymob, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  transaction_id: string;
  status: 'completed' | 'failed' | 'cancelled';
  gateway_transaction_id?: string;
  amount?: number;
  gateway?: string;
  signature?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET') || 'test-secret';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();

    // Validate signature (in production, implement proper signature validation)
    if (payload.signature && payload.signature !== webhookSecret && webhookSecret !== 'test-secret') {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!payload.transaction_id || !payload.status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', payload.transaction_id)
      .single();

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    if (transaction.status === 'completed' && payload.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, message: 'Transaction already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount if provided
    if (payload.amount && payload.amount !== parseFloat(transaction.amount.toString())) {
      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process payment
    const { data: result, error: processError } = await supabase.rpc(
      'process_payment_and_topup',
      {
        p_transaction_id: payload.transaction_id,
        p_status: payload.status,
      }
    );

    if (processError) {
      console.error('Failed to process payment:', processError);
      return new Response(
        JSON.stringify({ error: processError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update gateway transaction ID if provided
    if (payload.gateway_transaction_id) {
      await supabase
        .from('payment_transactions')
        .update({ gateway_transaction_id: payload.gateway_transaction_id })
        .eq('id', payload.transaction_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed successfully',
        transaction_id: payload.transaction_id,
        status: payload.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

