import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<string, { lastSent: number; attempts: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.lastSent > 5 * 60 * 1000) { // 5 minutes
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function validateE164Phone(phone: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record) return false;
  
  // 45 second cooldown
  if (now - record.lastSent < 45 * 1000) {
    return true;
  }
  
  // Max 5 attempts per hour
  if (record.attempts >= 5 && now - record.lastSent < 60 * 60 * 1000) {
    return true;
  }
  
  return false;
}

function updateRateLimit(identifier: string) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { lastSent: 0, attempts: 0 };
  
  // Reset attempts if more than 1 hour passed
  if (now - record.lastSent > 60 * 60 * 1000) {
    record.attempts = 0;
  }
  
  record.lastSent = now;
  record.attempts += 1;
  rateLimitStore.set(identifier, record);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { phone } = await req.json();

    // Validate input
    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate E.164 format
    if (!validateE164Phone(phone)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Phone number must be in E.164 format (e.g., +201234567890)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = `${clientIP}:${phone}`;

    // Check rate limiting
    if (isRateLimited(identifier)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please wait before requesting another code.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'SMS service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        Channel: 'sms',
      }),
    });

    if (!twilioResponse.ok) {
      const twilioError = await twilioResponse.text();
      console.error('Twilio error:', twilioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update rate limiting
    updateRateLimit(identifier);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send OTP error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
