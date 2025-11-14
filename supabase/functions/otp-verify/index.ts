import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  DEFAULT_MAX_ATTEMPTS,
  addSeconds,
  createSupabaseAdmin,
  formatIso,
  hashOtp,
  now,
} from '../_shared/otp.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OtpVerifyBody {
  challengeId?: string;
  code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as OtpVerifyBody;
    if (!body.challengeId || !body.code) {
      return jsonResponse(
        { success: false, error: 'challengeId and code are required', code: 'OTP_INVALID_REQUEST' },
        400,
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const challengeId = body.challengeId;
    const userAgent = req.headers.get('user-agent') ?? undefined;
    const forwardedFor = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
    const rawCode = body.code.trim();

    if (!/^\d{4,8}$/.test(rawCode)) {
      return jsonResponse(
        { success: false, error: 'Invalid verification code format', code: 'OTP_INVALID_CODE' },
        400,
      );
    }

    const { data: challenge, error: fetchError } = await supabaseAdmin
      .from('otp_challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch OTP challenge:', fetchError);
      return jsonResponse({ success: false, error: 'Unable to verify code' }, 500);
    }

    if (!challenge) {
      return jsonResponse(
        { success: false, error: 'Verification challenge not found', code: 'OTP_NOT_FOUND' },
        404,
      );
    }

    if (challenge.status === 'verified') {
      return jsonResponse(
        { success: true, message: 'Code already verified', context: challenge.context },
      );
    }

    if (challenge.status === 'failed' || challenge.status === 'cancelled') {
      return jsonResponse(
        { success: false, error: 'Verification challenge is no longer valid', code: 'OTP_INVALID_STATE' },
        400,
      );
    }

    const expiresAt = new Date(challenge.expires_at);
    const currentTime = now();

    if (expiresAt.getTime() < currentTime.getTime()) {
      await supabaseAdmin
        .from('otp_challenges')
        .update({
          status: 'expired',
          updated_at: formatIso(currentTime),
        })
        .eq('id', challenge.id);

      return jsonResponse(
        { success: false, error: 'Verification code expired', code: 'OTP_EXPIRED' },
        400,
      );
    }

    const attemptsUsed = challenge.attempt_count ?? 0;
    if (attemptsUsed >= DEFAULT_MAX_ATTEMPTS) {
      await supabaseAdmin
        .from('otp_challenges')
        .update({
          status: 'failed',
          updated_at: formatIso(currentTime),
        })
        .eq('id', challenge.id);

      return jsonResponse(
        {
          success: false,
          error: 'Too many incorrect attempts. Please request a new code.',
          code: 'OTP_MAX_ATTEMPTS',
        },
        400,
      );
    }

    const incomingHash = await hashOtp(rawCode);
    const isMatch = challenge.code_hash === incomingHash;

    await supabaseAdmin.from('otp_attempts').insert({
      challenge_id: challenge.id,
      result: isMatch ? 'success' : 'mismatch',
      ip_address: clientIp ?? null,
      user_agent: userAgent ?? null,
      created_at: formatIso(currentTime),
    });

    if (!isMatch) {
      await supabaseAdmin
        .from('otp_challenges')
        .update({
          attempt_count: attemptsUsed + 1,
          updated_at: formatIso(currentTime),
        })
        .eq('id', challenge.id);

      const attemptsRemaining = Math.max(0, DEFAULT_MAX_ATTEMPTS - attemptsUsed - 1);

      return jsonResponse(
        {
          success: false,
          error: attemptsRemaining > 0
            ? `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
            : 'Invalid verification code.',
          attempts_remaining: attemptsRemaining,
          code: 'OTP_MISMATCH',
        },
        400,
      );
    }

    const verifiedAt = formatIso(currentTime);

    await supabaseAdmin
      .from('otp_challenges')
      .update({
        status: 'verified',
        verified_at: verifiedAt,
        attempt_count: attemptsUsed + 1,
        updated_at: verifiedAt,
      })
      .eq('id', challenge.id);

    return jsonResponse({
      success: true,
      message: 'Verification successful',
      context: challenge.context,
      verified_at: verifiedAt,
    });
  } catch (error) {
    console.error('otp-verify error:', error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
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

