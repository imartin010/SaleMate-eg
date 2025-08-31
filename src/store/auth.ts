import { create } from 'zustand';
import { supabase, fetchProfileBypassRLS } from '../lib/supabaseClient';
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

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loadUserProfile: (user: User) => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
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
      }, 5000); // Increased timeout

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
        console.log('🔍 Session user ID:', session.user.id);
        await get().loadUserProfile(session.user);
        
        // Force a second profile load after a short delay to ensure we get the latest data
        setTimeout(async () => {
          console.log('🔄 Force reloading profile after delay...');
          await get().refreshProfile();
        }, 1000);
      } else {
        console.log('❌ No session found');
        set({ user: null, profile: null, role: 'user', loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔄 User signed in, loading profile...');
          await get().loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('🔄 User signed out, clearing state...');
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
      console.log('🔍 Loading profile for user:', user.id, user.email);
      
      // Try to fetch profile using bypass function first
      let profile = await fetchProfileBypassRLS(user.id);
      
      if (!profile) {
        // Fallback to regular method
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('❌ Profile fetch error:', error);
          profile = null;
        } else {
          profile = data;
        }
      }

      if (!profile) {
        console.error('❌ Profile fetch failed');
        
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

      console.log('✅ Profile loaded successfully:', profile);

      // Check if user is banned
      if (profile.is_banned) {
        console.warn('⚠️ User is banned, signing out');
        await get().signOut();
        set({ error: 'Your account has been suspended. Please contact support.' });
        return;
      }

      console.log('🎯 Setting user role to:', profile.role);
      set({ 
        user, 
        profile, 
        role: profile.role, 
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Load profile error:', error);
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

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      console.log('🔄 Refreshing profile for user:', user.email);
      console.log('🔄 User ID:', user.id);
      
      // Force reload from database with retry mechanism
      let retries = 3;
      while (retries > 0) {
        try {
          // Try bypass function first
          let profile = await fetchProfileBypassRLS(user.id);
          
          if (!profile) {
            // Fallback to regular method
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (error) {
              console.error(`❌ Refresh profile error (attempt ${4-retries}/3):`, error);
              retries--;
              if (retries > 0) {
                console.log(`🔄 Retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              return;
            }
            
            profile = data;
          }

          console.log('✅ Refreshed profile:', profile);
          
          // Update the store with fresh data
          set({ 
            profile, 
            role: profile.role,
            error: null
          });
          
          console.log('🎯 Updated store role to:', profile.role);
          break; // Success, exit retry loop
        } catch (error) {
          console.error(`❌ Refresh profile exception (attempt ${4-retries}/3):`, error);
          retries--;
          if (retries > 0) {
            console.log(`🔄 Retrying in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    }
  },
}));

