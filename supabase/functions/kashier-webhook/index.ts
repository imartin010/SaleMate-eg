// Supabase Edge Function: Kashier Payment Webhook
// Handles server-to-server payment notifications from Kashier
// This ensures wallet updates even if the user closes their browser before the redirect completes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KashierWebhookPayload {
  // Kashier webhook payload structure
  orderId?: string;           // Format: order_<transaction_id>_<timestamp>
  merchantOrderId?: string;   // Our internal transaction ID
  transactionId?: string;     // Kashier's transaction ID
  amount?: string;            // Payment amount
  currency?: string;          // Currency code (EGP)
  status?: string;            // Payment status: SUCCESS, FAILED, PENDING, etc.
  cardNumber?: string;        // Masked card number
  cardBrand?: string;         // Card brand (Visa, Mastercard, etc.)
  paymentMethod?: string;     // Payment method used
  createdAt?: string;         // Payment creation timestamp
  hash?: string;              // HMAC signature for verification
  
  // Additional possible fields
  message?: string;
  response?: string;
  card?: {
    number?: string;
    brand?: string;
  };
}

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'KASHIER_SECRET_KEY',  // For webhook signature verification
] as const;

function getEnv() {
  const missing: string[] = [];
  const values = {} as Record<typeof REQUIRED_ENV_VARS[number], string>;

  for (const key of REQUIRED_ENV_VARS) {
    const value = Deno.env.get(key);
    if (!value) {
      missing.push(key);
    } else {
      values[key] = value;
    }
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return values;
}

/**
 * Extract transaction ID from Kashier orderId
 * Kashier orderId format: order_<transaction_id>_<timestamp>
 */
function extractTransactionId(orderId: string): string | null {
  const match = orderId.match(/^order_([a-f0-9-]+)_\d+$/);
  return match ? match[1] : null;
}

/**
 * Validate Kashier webhook signature
 * Kashier uses HMAC-SHA256 with secret key
 */
async function validateKashierSignature(
  payload: KashierWebhookPayload,
  secretKey: string
): Promise<boolean> {
  const hash = payload.hash;
  if (!hash) {
    console.warn('Webhook payload missing hash signature');
    return false;
  }

  try {
    // Build signature string from payload (Kashier-specific order)
    // Format: amount.currency.orderId.transactionId
    const signatureData = [
      payload.amount || '',
      payload.currency || '',
      payload.orderId || '',
      payload.transactionId || '',
    ].join('.');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(signatureData);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = computedHash === hash.toLowerCase();
    
    if (!isValid) {
      console.warn('Webhook signature validation failed', {
        expected: hash,
        computed: computedHash.substring(0, 16) + '...',
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Map Kashier status to our system status
 */
function mapKashierStatus(kashierStatus: string): 'completed' | 'failed' | 'cancelled' {
  const status = kashierStatus.toUpperCase();
  
  switch (status) {
    case 'SUCCESS':
    case 'SUCCESSFUL':
    case 'PAID':
    case 'APPROVED':
      return 'completed';
    
    case 'FAILED':
    case 'FAILURE':
    case 'DECLINED':
    case 'ERROR':
      return 'failed';
    
    case 'CANCELLED':
    case 'CANCELED':
    case 'VOIDED':
      return 'cancelled';
    
    default:
      console.warn('Unknown Kashier status:', kashierStatus);
      return 'failed';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  console.log('=== Kashier Webhook Received ===');

  try {
    // Get environment variables
    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Parse webhook payload
    const payload: KashierWebhookPayload = await req.json();
    
    console.log('Webhook payload received:', {
      orderId: payload.orderId,
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
      status: payload.status,
      hasHash: !!payload.hash,
    });

    // Validate required fields
    if (!payload.orderId || !payload.status) {
      console.error('Missing required fields in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId and status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract our internal transaction ID from Kashier's orderId
    const transactionId = extractTransactionId(payload.orderId);
    if (!transactionId) {
      console.error('Failed to extract transaction ID from orderId:', payload.orderId);
      return new Response(
        JSON.stringify({ error: 'Invalid orderId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted transaction ID:', transactionId);

    // Validate webhook signature (CRITICAL for security)
    const isValidSignature = await validateKashierSignature(payload, env.KASHIER_SECRET_KEY);
    if (!isValidSignature) {
      console.error('Invalid webhook signature - potential security threat');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✓ Webhook signature validated');

    // Get transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionId, transactionError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction found:', {
      id: transaction.id,
      user_id: transaction.user_id,
      current_status: transaction.status,
      completed_at: transaction.completed_at,
    });

    // Check if already processed (idempotency)
    if (transaction.completed_at) {
      console.log('✓ Transaction already processed (idempotent response)');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction already processed',
          transaction_id: transactionId,
          status: transaction.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount if provided
    if (payload.amount) {
      const webhookAmount = parseFloat(payload.amount);
      const transactionAmount = parseFloat(transaction.amount.toString());
      
      if (Math.abs(webhookAmount - transactionAmount) > 0.01) {
        console.error('Amount mismatch:', {
          webhook: webhookAmount,
          transaction: transactionAmount,
        });
        return new Response(
          JSON.stringify({ error: 'Amount mismatch' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Map Kashier status to our system status
    const systemStatus = mapKashierStatus(payload.status);
    console.log('Mapped status:', { kashier: payload.status, system: systemStatus });

    // Process payment via RPC (idempotent)
    console.log('Calling process_payment_and_topup RPC...');
    const { data: result, error: processError } = await supabase.rpc(
      'process_payment_and_topup',
      {
        p_transaction_id: transactionId,
        p_status: systemStatus,
      }
    );

    if (processError) {
      console.error('Failed to process payment:', processError);
      return new Response(
        JSON.stringify({ error: processError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✓ RPC completed:', result);

    // Update gateway transaction ID if provided
    if (payload.transactionId) {
      console.log('Updating gateway transaction ID...');
      await supabase
        .from('payment_transactions')
        .update({
          gateway_transaction_id: payload.transactionId,
        })
        .eq('id', transactionId);
    }

    const duration = Date.now() - startTime;
    console.log(`=== Webhook processed successfully in ${duration}ms ===`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed successfully',
        transaction_id: transactionId,
        status: systemStatus,
        wallet_updated: result?.wallet_updated || false,
        processing_time_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`=== Webhook error after ${duration}ms ===`);
    console.error('Error details:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed',
        processing_time_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

