/**
 * Environment Variables
 * 
 * Centralized environment variable access with validation.
 * All environment variables should be accessed through this module.
 * 
 * @module core/config/env
 */

/**
 * Supabase configuration
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8';
export const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

/**
 * OpenAI configuration (for AI Case Manager)
 */
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Payment gateway configuration
 */
export const KASHIER_MERCHANT_ID = import.meta.env.VITE_KASHIER_MERCHANT_ID;
export const KASHIER_PAYMENT_KEY = import.meta.env.VITE_KASHIER_PAYMENT_KEY;
export const KASHIER_SECRET_KEY = import.meta.env.VITE_KASHIER_SECRET_KEY;

export const PAYMOB_API_KEY = import.meta.env.VITE_PAYMOB_API_KEY;

/**
 * SMS/Twilio configuration
 */
export const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
export const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

/**
 * Application mode
 */
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

/**
 * Test mode for payments
 */
export const PAYMENT_TEST_MODE = import.meta.env.VITE_PAYMENT_TEST_MODE !== 'false';

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = [
    { name: 'VITE_SUPABASE_URL', value: SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingNames = missing.map(({ name }) => name).join(', ');
    throw new Error(
      `Missing required environment variables: ${missingNames}\n\n` +
      'Please ensure your .env file contains all required variables.\n' +
      'See .env.example for reference.'
    );
  }
}

/**
 * Get all environment variables (for debugging)
 * Only available in development mode
 */
export function getAllEnvVars(): Record<string, string> {
  if (!IS_DEV) {
    throw new Error('getAllEnvVars() is only available in development mode');
  }

  return Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      acc[key] = import.meta.env[key];
      return acc;
    }, {} as Record<string, string>);
}

