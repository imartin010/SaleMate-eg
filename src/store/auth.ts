import { create } from 'zustand';
import { supabase, sendOTP, verifyOTP } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  
  // Actions
  init: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<boolean>;
  signUpEmail: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, code: string, email?: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: 'user',
  loading: true,
  error: null,

  init: async () => {
    try {
      console.log('🔐 Initializing auth...');
      set({ loading: true, error: null });

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Auth timeout, setting to unauthenticated');
        set({ user: null, profile: null, role: 'user', loading: false });
      }, 3000);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);

      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ user: null, profile: null, role: 'user', loading: false });
        return;
      }

      if (session?.user) {
        console.log('✅ Found session for:', session.user.email);
        await get().loadUserProfile(session.user);
      } else {
        console.log('❌ No session found');
        set({ user: null, profile: null, role: 'user', loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await get().loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, role: 'user', loading: false, error: null });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, profile: null, role: 'user', loading: false, error: 'Failed to initialize auth' });
    }
  },

  loadUserProfile: async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        // Create fallback profile
        const fallbackProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || null,
          phone: user.phone || null,
          role: 'user',
          manager_id: null,
          is_banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set({ 
          user, 
          profile: fallbackProfile, 
          role: 'user', 
          loading: false 
        });
        return;
      }

      // Check if user is banned
      if (profile.is_banned) {
        console.warn('User is banned, signing out');
        await get().signOut();
        set({ error: 'Your account has been suspended. Please contact support.' });
        return;
      }

      set({ 
        user, 
        profile, 
        role: profile.role, 
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Load profile error:', error);
      set({ loading: false, error: 'Failed to load user profile' });
    }
  },

  signInEmail: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = 'Login failed';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later';
        }

        set({ loading: false, error: errorMessage });
        return false;
      }

      if (data.user) {
        await get().loadUserProfile(data.user);
        return true;
      }

      set({ loading: false, error: 'Login failed' });
      return false;

    } catch (error) {
      console.error('Sign in error:', error);
      set({ loading: false, error: 'Network error during login' });
      return false;
    }
  },

  signUpEmail: async (name: string, email: string, password: string, phone?: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || null,
          },
        },
      });

      if (error) {
        let errorMessage = 'Signup failed';
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters';
        } else if (error.message.includes('Email')) {
          errorMessage = 'Please enter a valid email address';
        }

        set({ loading: false, error: errorMessage });
        return false;
      }

      if (data.user) {
        // Update profile with additional info
        if (phone) {
          await supabase
            .from('profiles')
            .update({ name, phone })
            .eq('id', data.user.id);
        }

        set({ loading: false, error: null });
        return true;
      }

      set({ loading: false, error: 'Signup failed' });
      return false;

    } catch (error) {
      console.error('Sign up error:', error);
      set({ loading: false, error: 'Network error during signup' });
      return false;
    }
  },

  sendOTP: async (phone: string) => {
    try {
      set({ loading: true, error: null });

      const result = await sendOTP(phone);

      if (result.success) {
        set({ loading: false, error: null });
        return true;
      } else {
        set({ loading: false, error: result.error || 'Failed to send verification code' });
        return false;
      }

    } catch (error) {
      console.error('Send OTP error:', error);
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  verifyOTP: async (phone: string, code: string, email?: string, name?: string) => {
    try {
      set({ loading: true, error: null });

      const result = await verifyOTP(phone, code, email, name);

      if (result.success && result.session) {
        // Set session using Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          set({ loading: false, error: 'Failed to establish session' });
          return false;
        }

        // Profile will be loaded automatically via auth state change
        return true;

      } else {
        set({ loading: false, error: result.error || 'Invalid verification code' });
        return false;
      }

    } catch (error) {
      console.error('Verify OTP error:', error);
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }

      set({ 
        user: null, 
        profile: null, 
        role: 'user', 
        loading: false, 
        error: null 
      });

    } catch (error) {
      console.error('Sign out error:', error);
      set({ 
        user: null, 
        profile: null, 
        role: 'user', 
        loading: false, 
        error: null 
      });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      await get().loadUserProfile(user);
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        set({ loading: false, error: error.message });
        return false;
      }

      set({ loading: false, error: null });
      return true;

    } catch (error) {
      console.error('Reset password error:', error);
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  updatePassword: async (password: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        set({ loading: false, error: error.message });
        return false;
      }

      set({ loading: false, error: null });
      return true;

    } catch (error) {
      console.error('Update password error:', error);
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Add loadUserProfile as a separate function for internal use
(useAuthStore as any).getState().loadUserProfile = async (user: User) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      // Create fallback profile
      const fallbackProfile: Profile = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || null,
        phone: user.phone || null,
        role: 'user',
        manager_id: null,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      useAuthStore.setState({ 
        user, 
        profile: fallbackProfile, 
        role: 'user', 
        loading: false 
      });
      return;
    }

    // Check if user is banned
    if (profile.is_banned) {
      console.warn('User is banned, signing out');
      await useAuthStore.getState().signOut();
      useAuthStore.setState({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    useAuthStore.setState({ 
      user, 
      profile, 
      role: profile.role, 
      loading: false,
      error: null
    });

  } catch (error) {
    console.error('Load profile error:', error);
    useAuthStore.setState({ loading: false, error: 'Failed to load user profile' });
  }
};