import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: 'user',
  loading: true,
  error: null,

  init: async () => {
    try {
      console.log('🔐 Initializing clean auth...');
      set({ loading: true, error: null });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ user: null, profile: null, role: 'user', loading: false });
        return;
      }

      if (session?.user) {
        console.log('✅ Found session for:', session.user.email);
        await get().loadUserProfile(session.user);
      } else {
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
      set({ user: null, profile: null, role: 'user', loading: false, error: 'Failed to initialize' });
    }
  },

  loadUserProfile: async (user: User) => {
    try {
      console.log('🔍 Loading profile for user:', user.email);
      
      // Load profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile fetch error:', profileError);
        
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          role: (user.email?.toLowerCase().includes('admin') ? 'admin' : user.email?.toLowerCase().includes('support') ? 'support' : user.email?.toLowerCase().includes('manager') ? 'manager' : 'user') as UserRole,
          phone: user.phone || null,
          is_banned: false
        };

        console.log('🔄 Creating new profile:', newProfile);
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        if (!createError && createdProfile) {
          console.log('✅ Profile created successfully:', createdProfile);
          set({ 
            user, 
            profile: createdProfile, 
            role: createdProfile.role, 
            loading: false 
          });
        } else {
          console.error('❌ Failed to create profile:', createError);
          set({ 
            user, 
            profile: newProfile as Profile, 
            role: 'user', 
            loading: false 
          });
        }
      } else {
        console.log('✅ Profile loaded:', profile);
        set({ 
          user, 
          profile, 
          role: profile.role, 
          loading: false 
        });
      }
    } catch (error) {
      console.error('❌ Load profile error:', error);
      set({ loading: false, error: 'Failed to load profile' });
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
        set({ loading: false, error: error.message });
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
      set({ loading: false, error: 'Network error' });
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
          data: { name, phone: phone || null },
        },
      });

      if (error) {
        set({ loading: false, error: error.message });
        return false;
      }

      set({ loading: false, error: null });
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, role: 'user', loading: false, error: null });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ user: null, profile: null, role: 'user', loading: false, error: null });
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('❌ Profile refresh error:', error);
        return;
      }

      set({ profile, role: profile.role });
      console.log('✅ Profile refreshed:', profile);
    } catch (error) {
      console.error('❌ Profile refresh exception:', error);
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        set({ loading: false, error: error.message });
        return false;
      }
      set({ loading: false });
      return true;
    } catch (error) {
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
      set({ loading: false });
      return true;
    } catch (error) {
      set({ loading: false, error: 'Network error' });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));