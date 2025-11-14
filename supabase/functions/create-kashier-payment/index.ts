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
    
    // Get Kashier credentials from environment variables (must be set in Supabase Edge Function secrets)
    const kashierPaymentKey = Deno.env.get('KASHIER_PAYMENT_KEY');
    const kashierSecretKey = Deno.env.get('KASHIER_SECRET_KEY');
    const kashierMerchantId = Deno.env.get('KASHIER_MERCHANT_ID');
    
    // Validate required credentials
    if (!kashierSecretKey || !kashierMerchantId) {
      console.error('Missing Kashier credentials:', {
        hasSecretKey: !!kashierSecretKey,
        hasMerchantId: !!kashierMerchantId,
      });
      return new Response(
        JSON.stringify({ error: 'Kashier credentials not configured. Please set KASHIER_SECRET_KEY and KASHIER_MERCHANT_ID in Edge Function secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
    
    // According to Kashier documentation, amount should be in BASE currency (EGP) for both hash and URL
    // Format: merchantId:amount:currency:orderId:secretKey
    // Example: MID-1234:100:EGP:order_xxx:secret_key (100 EGP, not 10000 piasters)
    const amount = body.amount.toString(); // Use base currency amount
    
    // Kashier order hash format: merchantId:amount:currency:orderId:secretKey
    const hashString = `${kashierMerchantId}:${amount}:${body.currency.toUpperCase()}:${orderId}:${kashierSecretKey}`;
    
    // Log hash string for debugging (without secret key)
    console.log('Hash string (masked):', `${kashierMerchantId}:${amount}:${body.currency.toUpperCase()}:${orderId}:***`);
    
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
    // IMPORTANT: Both hash and URL amount must use the SAME format (base currency)
    // Kashier verifies the hash by recalculating it using the amount from the URL
    // If they don't match, you get "Forbidden request" error
    const kashierBaseUrl = 'https://checkout.kashier.io';
    const paymentUrl = new URL(kashierBaseUrl);
    paymentUrl.searchParams.set('merchantId', kashierMerchantId);
    paymentUrl.searchParams.set('amount', amount); // Use base currency to match hash calculation
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

