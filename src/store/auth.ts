import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
// type Role = Database["public"]["Enums"]["user_role"]; // Unused

interface AuthState {
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null;
  profile: Profile | null;
  loading: boolean;
  error?: string;
  init(): Promise<void>;
  signUpEmail(name: string, email: string, password: string, phone?: string): Promise<boolean>;
  signUpWithOTP(name: string, email: string, phone: string, password: string, otp: string): Promise<boolean>;
  signInEmail(email: string, password: string, rememberMe?: boolean): Promise<boolean>;
  signInWith2FA(email: string, password: string, otp: string, rememberMe?: boolean): Promise<boolean>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
  resendConfirmation(email: string): Promise<boolean>;
  sendOTP(phone: string, purpose?: string): Promise<{ success: boolean; error?: string }>;
  verifyOTP(phone: string, code: string, purpose?: string): Promise<{ success: boolean; error?: string }>;
  // Legacy methods for compatibility
  loadUserProfile(user: unknown): Promise<void>;
  resetPassword(email: string): Promise<boolean>;
  updatePassword(password: string): Promise<boolean>;
  clearError(): void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  
  async init() {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    set({ user: user ?? null });
    if (user) await get().refreshProfile();
    supabase.auth.onAuthStateChange(async (_e, session) => {
      set({ user: session?.user ?? null });
      if (session?.user) await get().refreshProfile();
      else set({ profile: null });
    });
    set({ loading: false });
  },
  
  async signUpEmail(name, email, password, phone) {
    set({ error: undefined, loading: true });
    const { error: err, data } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone } },
    });
    if (err) {
      set({ error: err.message, loading: false });
      return false;
    }

    // Wait and ensure profile row exists (handle trigger lag)
    const uid = data.user?.id;
    if (uid) {
      try {
        // Try to create profile manually if trigger doesn't work
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: uid,
            name: name,
            email: email,
            phone: phone || '',
            role: 'user'
          });
        
        if (profileError) {
          console.warn('Profile creation failed:', profileError);
          // Don't fail the signup if profile creation fails
          // The trigger might still work or we can handle it later
        }
        
        await get().refreshProfile();
      } catch (error) {
        console.warn('Profile creation failed, may be handled by trigger');
      }
    }
    set({ loading: false });
    return true;
  },
  
  async signUpWithOTP(name, email, phone, password, otp) {
    set({ error: undefined, loading: true });
    
    try {
      // First verify the OTP
      const verifyResult = await get().verifyOTP(phone, otp, 'signup');
      if (!verifyResult.success) {
        set({ error: verifyResult.error || 'OTP verification failed', loading: false });
        return false;
      }

      // Create the user account
      const { error: err, data } = await supabase.auth.signUp({
        email, 
        password,
        options: { 
          data: { 
            name, 
            phone,
            phone_verified: true,
          } 
        },
      });
      
      if (err) {
        set({ error: err.message, loading: false });
        return false;
      }

      // Ensure profile row exists with verified phone
      const uid = data.user?.id;
      if (uid) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: uid,
              name: name,
              email: email,
              phone: phone,
              role: 'user',
              phone_verified_at: new Date().toISOString(),
            });
          
          if (profileError) {
            console.warn('Profile creation failed:', profileError);
          }
          
          await get().refreshProfile();
        } catch (error) {
          console.warn('Profile creation failed, may be handled by trigger');
        }
      }
      
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Signup failed. Please try again.', loading: false });
      return false;
    }
  },

  async signInEmail(email, password, rememberMe = false) {
    set({ error: undefined, loading: true });
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    // Update last login time
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    // Handle remember me
    if (rememberMe && data.session) {
      // Extend session duration (Supabase handles this automatically)
      localStorage.setItem('remember_me', 'true');
    } else {
      localStorage.removeItem('remember_me');
    }

    await get().refreshProfile();
    set({ loading: false });
    return true;
  },

  async signInWith2FA(email, password, otp, rememberMe = false) {
    set({ error: undefined, loading: true });

    try {
      // First verify password
      const { error: authError, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) {
        set({ error: authError.message, loading: false });
        return false;
      }

      // Get user's phone from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('email', email)
        .single();

      if (!profile?.phone) {
        set({ error: 'No phone number found for 2FA', loading: false });
        return false;
      }

      // Verify OTP
      const verifyResult = await get().verifyOTP(profile.phone, otp, '2fa');
      if (!verifyResult.success) {
        // Sign out since 2FA failed
        await supabase.auth.signOut();
        set({ error: verifyResult.error || '2FA verification failed', loading: false });
        return false;
      }

      // Update last login time
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

      await get().refreshProfile();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: '2FA login failed. Please try again.', loading: false });
      return false;
    }
  },
  
  async signOut() {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },
  
  async refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('RefreshProfile: No user found');
      return set({ profile: null });
    }
    
    console.log('RefreshProfile: Fetching profile for user:', user.id, 'email:', user.email);
    
    // Try to find profile by ID first (standard case)
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    
    // If not found by ID, try by email (fallback for cases where IDs don't match)
    if (!data && !error && user.email) {
      console.log('RefreshProfile: Profile not found by ID, trying by email:', user.email);
      const emailQuery = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      if (emailQuery.data) {
        data = emailQuery.data;
        error = emailQuery.error;
        console.log('RefreshProfile: Found profile by email with ID:', data.id);
      } else if (emailQuery.error) {
        error = emailQuery.error;
      }
    }
    
    console.log('RefreshProfile: Data received:', data);
    console.log('RefreshProfile: Error:', error);
    console.log('RefreshProfile: Role value:', data?.role);
      
    if (error) {
      console.error('RefreshProfile: Error loading profile:', error);
      set({ error: error.message });
    }
    
    set({ profile: data ?? null });
    
    console.log('RefreshProfile: Profile set in store:', data);
    
    // If profile found but role is not admin, log warning
    if (data && data.role !== 'admin' && user.email === 'themartining@gmail.com') {
      console.warn('⚠️ Warning: Admin user profile role is not "admin". Current role:', data.role);
    }
  },

  async resendConfirmation(email: string) {
    set({ error: undefined, loading: true });
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      return false;
    }
    return true;
  },

  // Legacy methods for compatibility
  async loadUserProfile() {
    await get().refreshProfile();
  },

  async resetPassword(email: string) {
    set({ error: undefined, loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      return false;
    }
    return true;
  },

  async updatePassword(password) {
    set({ error: undefined, loading: true });
    const { error } = await supabase.auth.updateUser({ password });
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      return false;
    }
    return true;
  },

  clearError() {
    set({ error: undefined });
  },

  async sendOTP(phone: string, purpose: string = 'signup') {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, purpose }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Failed to send OTP' };
      }

      return { success: true };
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async verifyOTP(phone: string, code: string, purpose: string = 'signup') {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone, code, purpose }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Invalid verification code' };
      }

      return { success: true };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
}));