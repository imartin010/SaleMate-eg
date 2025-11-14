import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_REQUESTS,
  DEFAULT_RESEND_COOLDOWN,
  DEFAULT_TTL_SECONDS,
  DEFAULT_WINDOW_MS,
  FALLBACK_ENABLED,
  addSeconds,
  createSupabaseAdmin,
  evaluateRateLimit,
  formatIso,
  generateOtp,
  hashOtp,
  normalizePhone,
  now,
  sendSmsThroughTwilio,
  shouldFallback,
  TwilioConfig,
} from '../_shared/otp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OtpRequestBody {
  phone: string;
  context?: string;
  channel?: 'sms' | 'email' | 'whatsapp';
}

const twilioConfig: TwilioConfig = {
  accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
  authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
  messagingServiceSid: Deno.env.get('TWILIO_MESSAGING_SERVICE_SID'),
  fromNumber: Deno.env.get('TWILIO_FROM_NUMBER'),
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed' },
      405,
    );
  }

  try {
    const body = (await req.json()) as OtpRequestBody;
    const context = body.context ?? 'signup';
    const channel = body.channel ?? 'sms';
    if (!body.phone) {
      return jsonResponse({ success: false, error: 'Phone number is required' }, 400);
    }

    if (channel !== 'sms') {
      return jsonResponse({ success: false, error: 'Only SMS channel is supported currently' }, 400);
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(body.phone);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Phone normalization error:', err.message);
      return jsonResponse({ 
        success: false, 
        error: err.message || 'Invalid phone number format' 
      }, 400);
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseAdmin();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Supabase admin client creation error:', err.message);
      return jsonResponse({ 
        success: false, 
        error: 'Server configuration error' 
      }, 500);
    }

    const { data: recentChallenges, error: recentError } = await supabaseAdmin
      .from('otp_challenges')
      .select('id, created_at, status, send_count')
      .eq('target', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(DEFAULT_MAX_REQUESTS + 2);

    if (recentError) {
      console.error('Failed to fetch recent OTP challenges:', recentError);
      return jsonResponse({ success: false, error: 'Unable to process request' }, 500);
    }

    const rateLimitResult = evaluateRateLimit(
      recentChallenges ?? [],
      {
        maxRequests: DEFAULT_MAX_REQUESTS,
        windowMs: DEFAULT_WINDOW_MS,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
      },
    );

    if (!rateLimitResult.allowed) {
      return jsonResponse({
        success: false,
        error: rateLimitResult.reason,
        retry_after_seconds: rateLimitResult.waitSeconds ?? DEFAULT_RESEND_COOLDOWN,
        code: 'OTP_RATE_LIMIT',
      }, 429);
    }

    const challengeTtl = DEFAULT_TTL_SECONDS;
    const resendCooldown = DEFAULT_RESEND_COOLDOWN;
    const createdAt = now();
    const expiresAt = addSeconds(createdAt, challengeTtl);
    const otpCode = generateOtp();
    const otpHash = await hashOtp(otpCode);

    const { data: insertedChallenge, error: insertError } = await supabaseAdmin
      .from('otp_challenges')
      .insert({
        context,
        channel,
        target: normalizedPhone,
        phone: normalizedPhone,
        code_hash: otpHash,
        status: 'pending',
        provider: 'twilio_sms',
        metadata: {},
        attempt_count: 0,
        send_count: 0,
        expires_at: formatIso(expiresAt),
      })
      .select('id')
      .single();

    if (insertError || !insertedChallenge) {
      console.error('Failed to create OTP challenge', insertError);
      return jsonResponse({ success: false, error: 'Failed to create OTP challenge' }, 500);
    }

    let provider = 'twilio_sms';
    let metadata: Record<string, unknown> = {};
    let devOtp: string | undefined;
    let fallbackReason: string | undefined;

    // Check if Twilio is properly configured
    const hasTwilioConfig = twilioConfig.accountSid && twilioConfig.authToken && 
                            (twilioConfig.messagingServiceSid || twilioConfig.fromNumber);

    console.log('Twilio config check:', {
      hasAccountSid: !!twilioConfig.accountSid,
      hasAuthToken: !!twilioConfig.authToken,
      hasMessagingService: !!twilioConfig.messagingServiceSid,
      hasFromNumber: !!twilioConfig.fromNumber,
      hasTwilioConfig,
    });

    if (!hasTwilioConfig) {
      // No Twilio config - use fallback immediately
      console.warn('Twilio credentials not fully configured, using fallback mode');
      provider = 'fallback_dev';
      fallbackReason = 'Twilio credentials are not configured';
      metadata = { fallback: true, reason: fallbackReason };
      devOtp = otpCode;
    } else {
      // Try to send via Twilio
      try {
        const message = `Your SaleMate verification code is: ${otpCode}\n\nThis code expires in ${Math.round(challengeTtl / 60)} minutes.`;
        const twilioResult = await sendSmsThroughTwilio(twilioConfig, normalizedPhone, message);
        metadata = { sid: twilioResult.sid, status: twilioResult.status };
        provider = 'twilio_sms';
        console.log('✅ OTP sent via Twilio:', twilioResult.sid);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('❌ Twilio SMS dispatch error:', err.message);
        
        // If alphanumeric sender fails, try with phone number as fallback
        const isAlphanumericError = err.message.toLowerCase().includes('sender') || 
                                    err.message.toLowerCase().includes('invalid from') ||
                                    err.message.toLowerCase().includes('not registered');
        
        if (isAlphanumericError && twilioConfig.fromNumber) {
          console.log('🔄 Alphanumeric sender failed, trying with phone number...');
          try {
            const message = `Your SaleMate verification code is: ${otpCode}\n\nThis code expires in ${Math.round(challengeTtl / 60)} minutes.`;
            const twilioResult = await sendSmsThroughTwilio(
              { ...twilioConfig, messagingServiceSid: undefined }, // Force use of fromNumber
              normalizedPhone, 
              message
            );
            metadata = { sid: twilioResult.sid, status: twilioResult.status, used_phone_fallback: true };
            provider = 'twilio_sms';
            console.log('✅ OTP sent via Twilio (phone number fallback):', twilioResult.sid);
          } catch (fallbackError) {
            // If phone number also fails, use dev fallback
            const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
            if (shouldFallback(fallbackErr)) {
              provider = 'fallback_dev';
              fallbackReason = `Alphanumeric sender failed: ${err.message}. Phone fallback also failed: ${fallbackErr.message}`;
              metadata = { fallback: true, reason: fallbackReason, twilio_error: err.message };
              devOtp = otpCode;
              console.log('===================================');
              console.log('📱 OTP FALLBACK MODE (DEV)');
              console.log('Phone:', normalizedPhone);
              console.log('Code:', otpCode);
              console.log('Reason:', fallbackReason);
              console.log('===================================');
            } else {
              // Non-recoverable error
              await supabaseAdmin
                .from('otp_challenges')
                .update({
                  status: 'failed',
                  provider: 'twilio_sms',
                  metadata: { error: fallbackErr.message },
                  updated_at: formatIso(now()),
                })
                .eq('id', insertedChallenge.id);

              return jsonResponse({
                success: false,
                error: 'Failed to send verification code',
                code: 'OTP_DISPATCH_FAILED',
              }, 500);
            }
          }
        } else if (shouldFallback(err)) {
          // Other Twilio errors - use dev fallback
          provider = 'fallback_dev';
          fallbackReason = err.message;
          metadata = { fallback: true, reason: fallbackReason, twilio_error: err.message };
          devOtp = otpCode;

          console.log('===================================');
          console.log('📱 OTP FALLBACK MODE (DEV)');
          console.log('Phone:', normalizedPhone);
          console.log('Code:', otpCode);
          console.log('Reason:', fallbackReason);
          console.log('===================================');
        } else {
          // Non-recoverable error - don't fallback
          await supabaseAdmin
            .from('otp_challenges')
            .update({
              status: 'failed',
              provider: 'twilio_sms',
              metadata: { error: err.message },
              updated_at: formatIso(now()),
            })
            .eq('id', insertedChallenge.id);

          return jsonResponse({
            success: false,
            error: 'Failed to send verification code',
            code: 'OTP_DISPATCH_FAILED',
          }, 500);
        }
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('otp_challenges')
      .update({
        status: 'sent',
        provider,
        send_count: 1,
        metadata,
        updated_at: formatIso(now()),
      })
      .eq('id', insertedChallenge.id);

    if (updateError) {
      console.error('Failed to update OTP challenge status:', updateError);
      // Don't fail the request if update fails - the challenge was created and OTP was sent
    }

    return jsonResponse({
      success: true,
      message: provider === 'fallback_dev'
        ? 'SMS delivery unavailable. Use the code shown below.'
        : 'Verification code sent successfully',
      challenge_id: insertedChallenge.id,
      expires_in: challengeTtl,
      resend_cooldown: resendCooldown,
      fallback: provider === 'fallback_dev',
      dev_otp: devOtp,
      fallback_reason: fallbackReason,
      provider,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('===================================');
    console.error('❌ OTP-REQUEST FATAL ERROR');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error type:', err.constructor.name);
    console.error('===================================');
    return jsonResponse(
      {
        success: false,
        error: err.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      500,
    );
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

