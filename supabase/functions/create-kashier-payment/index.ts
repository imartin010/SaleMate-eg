// Supabase Edge Function: Create Kashier Payment
// Creates a payment order with Kashier gateway

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface KashierPaymentRequest {
  amount: number;
  currency?: string;
  transaction_id: string;
  metadata?: Record<string, unknown>;
  payment_method?: string;
  success_url?: string;
  failure_url?: string;
}

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'KASHIER_MERCHANT_ID',
  'KASHIER_PAYMENT_KEY',
  'KASHIER_SECRET_KEY',
] as const;

const PAYMENT_URL = 'https://checkout.kashier.io';

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

function isTestMode() {
  const paymentTestModeEnv = Deno.env.get('PAYMENT_TEST_MODE');
  return paymentTestModeEnv !== 'false' && paymentTestModeEnv !== 'False' && paymentTestModeEnv !== 'FALSE';
}

async function generateOrderHash(
  merchantId: string,
  paymentKey: string,
  orderId: string,
  amount: string,
  currency: string,
) {
  const payload = `${merchantId}:${amount}:${currency}:${orderId}:${paymentKey}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const env = getEnv();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body: KashierPaymentRequest = await req.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Amount must be greater than zero.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!body.transaction_id) {
      return new Response(
        JSON.stringify({ error: 'transaction_id is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const currency = (body.currency || 'EGP').toUpperCase();
    const baseUrl = Deno.env.get('BASE_URL') || env.SUPABASE_URL;
    const testMode = isTestMode();

    if (testMode) {
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const mockRedirect = `${baseUrl.replace(/\/$/, '')}/payment/kashier/test?orderId=${mockOrderId}&transactionId=${body.transaction_id}`;

      return new Response(
        JSON.stringify({
          success: true,
          testMode: true,
          redirectUrl: mockRedirect,
          orderId: mockOrderId,
          transactionId: body.transaction_id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const amountString = amount.toFixed(2).replace(/\.00$/, '');
    const orderId = `order_${body.transaction_id}_${Date.now()}`;
    const orderHash = await generateOrderHash(
      env.KASHIER_MERCHANT_ID,
      env.KASHIER_PAYMENT_KEY,
      orderId,
      amountString,
      currency,
    );

    console.log('Kashier order created', {
      merchantId: env.KASHIER_MERCHANT_ID,
      orderId,
      amountString,
      amount,
      currency,
      paymentKeyLength: env.KASHIER_PAYMENT_KEY.length,
      hashPreview: `${orderHash.slice(0, 8)}...`,
    });

    const paymentUrl = new URL(PAYMENT_URL);
    paymentUrl.searchParams.set('merchantId', env.KASHIER_MERCHANT_ID);
    paymentUrl.searchParams.set('paymentKey', env.KASHIER_PAYMENT_KEY);
    paymentUrl.searchParams.set('amount', amountString);
    paymentUrl.searchParams.set('currency', currency);
    paymentUrl.searchParams.set('orderId', orderId);
    paymentUrl.searchParams.set('hash', orderHash);
    paymentUrl.searchParams.set('mode', 'live');
    paymentUrl.searchParams.set('allowedMethods', 'card,wallet');

    const appUrl = baseUrl.replace(/\/$/, '');
    const successRedirect = body.success_url || `${appUrl}/payment/kashier/callback?status=success&transactionId=${body.transaction_id}`;
    const failureRedirect = body.failure_url || `${appUrl}/payment/kashier/callback?status=failed&transactionId=${body.transaction_id}`;
    paymentUrl.searchParams.set('redirect', successRedirect);
    paymentUrl.searchParams.set('errorRedirect', failureRedirect);

    return new Response(
      JSON.stringify({
        success: true,
        testMode: false,
        orderId,
        transactionId: body.transaction_id,
        redirectUrl: paymentUrl.toString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Kashier payment error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create Kashier payment',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

