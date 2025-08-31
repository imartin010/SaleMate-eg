import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true 
    } 
  }
);

// OTP Functions
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function verifyOTP(
  phone: string, 
  code: string, 
  email?: string, 
  name?: string
): Promise<{ success: boolean; error?: string; session?: any }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phone, code, email, name }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, error: 'Network error' };
  }
}
