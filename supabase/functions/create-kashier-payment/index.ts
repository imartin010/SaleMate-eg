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
  currency: string;
  payment_method: string;
  transaction_id: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // Read PAYMENT_TEST_MODE - default to true (test mode) if not set
    const paymentTestModeEnv = Deno.env.get('PAYMENT_TEST_MODE');
    const testMode = paymentTestModeEnv !== 'false' && paymentTestModeEnv !== 'False' && paymentTestModeEnv !== 'FALSE';
    
    // Log for debugging
    console.log('PAYMENT_TEST_MODE env value:', paymentTestModeEnv);
    console.log('testMode determined as:', testMode);
    const kashierPaymentKey = Deno.env.get('KASHIER_PAYMENT_KEY') || 'd02f9fd0-d7c3-408e-84ac-c4c3ae6fe8a2';
    const kashierSecretKey = Deno.env.get('KASHIER_SECRET_KEY') || '86d1f6ad6358c144a45b9cd918522f71$ea45afd990143d51dce936af207a94ff9ef7bf30f2fbed1a185625a490094ebd7eb1ec264e521ca9ea91a925dd95b8fe';
    const kashierMerchantId = Deno.env.get('KASHIER_MERCHANT_ID') || 'MID-40169-389';
    const baseUrl = Deno.env.get('BASE_URL') || 'https://your-project.supabase.co';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: KashierPaymentRequest = await req.json();

    // Validate request
    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test Mode - Generate mock payment URL
    if (testMode) {
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockPaymentUrl = `${baseUrl}/payment/kashier/test?orderId=${mockOrderId}&transactionId=${body.transaction_id}`;

      return new Response(
        JSON.stringify({
          success: true,
          orderId: mockOrderId,
          redirectUrl: mockPaymentUrl,
          transactionId: body.transaction_id,
          testMode: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production Mode - Create Kashier Order
    // Generate order hash (HMAC-SHA256)
    const orderId = `order_${body.transaction_id}_${Date.now()}`;
    const amountInCents = Math.round(body.amount * 100); // Convert to piasters (Egyptian cents)
    
    // Kashier order hash format: merchantId:amount:currency:orderId:secretKey
    const hashString = `${kashierMerchantId}:${amountInCents}:${body.currency.toUpperCase()}:${orderId}:${kashierSecretKey}`;
    
    // Create HMAC-SHA256 hash using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(kashierSecretKey);
    const messageData = encoder.encode(hashString);
    
    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const orderHash = hashHex;

    // Build Kashier payment URL
    const kashierBaseUrl = 'https://checkout.kashier.io';
    const paymentUrl = new URL(kashierBaseUrl);
    paymentUrl.searchParams.set('merchantId', kashierMerchantId);
    paymentUrl.searchParams.set('amount', amountInCents.toString());
    paymentUrl.searchParams.set('currency', body.currency.toUpperCase());
    paymentUrl.searchParams.set('orderId', orderId);
    paymentUrl.searchParams.set('hash', orderHash);
    paymentUrl.searchParams.set('mode', testMode ? 'test' : 'live'); // Use 'live' for production
    paymentUrl.searchParams.set('allowedMethods', 'card,wallet'); // card, wallet, bank, etc.
    // Use baseUrl for redirect, or construct from request origin
    const appUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    paymentUrl.searchParams.set('redirect', `${appUrl}/payment/kashier/callback?transactionId=${body.transaction_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderId,
        redirectUrl: paymentUrl.toString(),
        transactionId: body.transaction_id,
        hash: orderHash,
        testMode: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Kashier payment error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create Kashier payment',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

