import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DIGITS = '0123456789';

export interface OtpChallengeOptions {
  context: string;
  target: string;
  channel?: 'sms' | 'email' | 'whatsapp';
  ttlSeconds: number;
  cooldownSeconds: number;
}

export interface RateLimitInfo {
  maxRequests: number;
  windowMs: number;
  maxAttempts: number;
}

export interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  messagingServiceSid?: string;
  fromNumber?: string;
}

export interface SupabaseEnvConfig {
  url?: string;
  serviceRoleKey?: string;
}

export const DEFAULT_TTL_SECONDS = Number(Deno.env.get('OTP_TTL_SECONDS') ?? 300);
export const DEFAULT_RESEND_COOLDOWN = Number(Deno.env.get('OTP_RESEND_COOLDOWN_SECONDS') ?? 30);
// More lenient rate limits for development - allow 10 requests per 15 minutes instead of 3
export const DEFAULT_MAX_REQUESTS = Number(Deno.env.get('OTP_MAX_REQUESTS') ?? 10);
export const DEFAULT_WINDOW_MS = Number(Deno.env.get('OTP_RATE_LIMIT_WINDOW_MS') ?? 15 * 60 * 1000);
export const DEFAULT_MAX_ATTEMPTS = Number(Deno.env.get('OTP_MAX_ATTEMPTS') ?? 5);

export const FALLBACK_ENABLED = Deno.env.get('OTP_FALLBACK_ENABLED') === 'true';

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('+')) {
    throw new Error('Phone number must be in E.164 format (e.g. +201234567890)');
  }
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) {
    throw new Error('Invalid phone number format');
  }
  return trimmed;
}

export function generateOtp(length = 6, alphabet = DIGITS): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = arr[i] % alphabet.length;
    result += alphabet[idx];
  }
  return result;
}

export async function hashOtp(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createSupabaseAdmin(config?: SupabaseEnvConfig): SupabaseClient {
  const supabaseUrl = config?.url ?? Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = config?.serviceRoleKey ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for service role access');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function sendSmsThroughTwilio(
  twilio: TwilioConfig,
  to: string,
  body: string,
  forceFromNumber?: boolean,
): Promise<{ sid: string; status: string }> {
  const { accountSid, authToken, messagingServiceSid, fromNumber } = twilio;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const headers = {
    Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('Body', body);

  // Use Messaging Service if available - it will automatically use "SaleMate" from sender pool
  // If Messaging Service is configured with "SaleMate" in its sender pool, it will use it
  // Otherwise, try direct "SaleMate" sender ID, then fall back to phone number
  if (forceFromNumber && fromNumber) {
    // Force use of phone number (for fallback scenarios)
    params.append('From', fromNumber);
  } else if (messagingServiceSid && !forceFromNumber) {
    // Use Messaging Service - it will select "SaleMate" from sender pool if configured
    // Make sure your Messaging Service has "SaleMate" in its Sender Pool
    params.append('MessagingServiceSid', messagingServiceSid);
  } else {
    // Direct use of "SaleMate" as alphanumeric sender ID
    // This works if "SaleMate" is registered as a standalone sender
    params.append('From', 'SaleMate');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error('Twilio SMS error:', text);
    let message = 'Failed to send verification code';
    try {
      const parsed = JSON.parse(text);
      // Include the error message and code for better fallback detection
      message = parsed.message ?? parsed.error ?? message;
      if (parsed.code) {
        message = `${message} (code: ${parsed.code})`;
      }
    } catch {
      message = text.slice(0, 200);
    }
    // Always throw with a message that will trigger fallback for auth errors
    if (response.status === 401) {
      throw new Error(`Twilio authentication failed: ${message}`);
    }
    throw new Error(message);
  }

  try {
    const parsed = JSON.parse(text);
    return { sid: parsed.sid, status: parsed.status ?? 'sent' };
  } catch {
    return { sid: 'unknown', status: 'sent' };
  }
}

export function now(): Date {
  return new Date();
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function formatIso(date: Date): string {
  return date.toISOString();
}

export function shouldFallback(error: unknown): boolean {
  // Always enable fallback in development or when explicitly enabled
  if (FALLBACK_ENABLED) return true;
  
  // If no error object, don't fallback
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  
  // Fallback for common Twilio/credential errors
  const shouldFallbackForError = (
    message.includes('twilio') ||
    message.includes('failed to send') ||
    message.includes('credentials') ||
    message.includes('not configured') ||
    message.includes('timeout') ||
    message.includes('messaging service') ||
    message.includes('from number') ||
    message.includes('authenticate') ||  // Twilio auth errors
    message.includes('unauthorized') ||  // HTTP 401 errors
    message.includes('401')              // HTTP status code
  );
  
  // If fallback is not explicitly disabled and we have a recognizable error, enable fallback
  // This ensures development/testing works even without Twilio credentials
  return shouldFallbackForError;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  waitSeconds?: number;
}

export function evaluateRateLimit(
  existing: Array<{ created_at: string; status: string; send_count: number }>,
  rateLimit: RateLimitInfo,
): RateLimitCheckResult {
  const now = new Date();
  const recent = existing.filter((entry) => {
    const createdAt = new Date(entry.created_at);
    return now.getTime() - createdAt.getTime() <= rateLimit.windowMs;
  });

  if (recent.length >= rateLimit.maxRequests) {
    const oldest = recent
      .map((entry) => new Date(entry.created_at))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const waitMs = rateLimit.windowMs - (now.getTime() - oldest.getTime());
    return {
      allowed: false,
      reason: 'Too many requests. Please wait before requesting a new code.',
      waitSeconds: Math.ceil(waitMs / 1000),
    };
  }

  return { allowed: true };
}

