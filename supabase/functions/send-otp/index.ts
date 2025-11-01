import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  
  // 30 second cooldown
  if (now - record.lastSent < 30 * 1000) {
    return true;
  }
  
  // Max 3 attempts per 15 minutes
  if (record.attempts >= 3 && now - record.lastSent < 15 * 60 * 1000) {
    return true;
  }
  
  return false;
}

function updateRateLimit(identifier: string) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { lastSent: 0, attempts: 0 };
  
  // Reset attempts if more than 15 minutes passed
  if (now - record.lastSent > 15 * 60 * 1000) {
    record.attempts = 0;
  }
  
  record.lastSent = now;
  record.attempts += 1;
  rateLimitStore.set(identifier, record);
}

function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOTP(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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
    const { phone, purpose = 'signup' } = await req.json();

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
          error: 'Too many requests. Please wait 30 seconds before requesting another code.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate OTP
    const otpCode = generateOTP();
    const otpHash = await hashOTP(otpCode);

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing unverified OTPs for this phone
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('phone', phone)
      .eq('verified', false);

    // Insert new OTP
    const { error: dbError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone,
        code_hash: otpHash,
        purpose,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to store verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

    if (!accountSid || !authToken || !messagingServiceSid) {
      console.error('Missing Twilio configuration');
      
      // In development, log the OTP to console
      console.log('===================================');
      console.log('📱 DEVELOPMENT MODE - OTP CODE');
      console.log('===================================');
      console.log('Phone:', phone);
      console.log('OTP Code:', otpCode);
      console.log('Purpose:', purpose);
      console.log('Expires:', expiresAt.toLocaleString());
      console.log('===================================');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Development mode: OTP logged to console',
          dev_otp: otpCode // Only in dev mode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via Twilio Messaging Service
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const message = `Your SaleMate verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this message.`;

    // Use alphanumeric sender "SaleMate" for Egypt numbers (Paid account)
    // Fall back to Messaging Service for other countries or if alphanumeric fails
    const isEgyptPhone = phone.startsWith('+20');
    
    const bodyParams: Record<string, string> = {
      To: phone,
      Body: message,
    };

    // Use alphanumeric sender "SaleMate" for Egypt numbers
    if (isEgyptPhone) {
      bodyParams.From = 'SaleMate';
    } else {
      // Use Messaging Service for non-Egypt countries
      bodyParams.MessagingServiceSid = messagingServiceSid;
    }

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(bodyParams),
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
        message: 'Verification code sent successfully',
        expires_in: 300 // 5 minutes in seconds
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
