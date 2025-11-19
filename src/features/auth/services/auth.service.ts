/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls
 * 
 * @module features/auth/services/auth.service
 */

import { supabase } from '@/core/api/client';
import type { Database } from '@/shared/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, name: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign up with OTP verification
   */
  static async signUpWithOTP(
    email: string,
    password: string,
    name: string,
    phone: string,
    challengeId: string,
    otp: string
  ) {
    // Verify OTP first
    await this.verifyOTP(challengeId, otp);

    // Then create account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, phone_verified: true },
      },
    });

    if (error) throw error;

    // Create/update profile with verified phone
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name,
          email,
          phone,
          role: 'user',
          phone_verified_at: new Date().toISOString(),
        });
    }

    return data;
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Request password reset
   */
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  /**
   * Send OTP to phone
   */
  static async sendOTP(phone: string, context = 'signup') {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/otp-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, context }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send OTP');
    }

    return result;
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(challengeId: string, code: string) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/otp-verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ challengeId, code }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Invalid verification code');
    }

    return result;
  }

  /**
   * Resend email confirmation
   */
  static async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }
}

