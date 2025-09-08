import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

interface CleanAuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  
  // Actions
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useCleanAuth = create<CleanAuthState>((set, get) => ({
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
        
        // Load profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('❌ Profile fetch error:', profileError);
          // Create profile if it doesn't exist
          const newProfile = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
            role: 'user' as UserRole,
            phone: session.user.phone || null,
            is_banned: false
          };

          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select()
            .single();

          if (createdProfile) {
            set({ 
              user: session.user, 
              profile: createdProfile, 
              role: createdProfile.role, 
              loading: false 
            });
          } else {
            set({ 
              user: session.user, 
              profile: newProfile as Profile, 
              role: 'user', 
              loading: false 
            });
          }
        } else {
          set({ 
            user: session.user, 
            profile, 
            role: profile.role, 
            loading: false 
          });
        }
      } else {
        set({ user: null, profile: null, role: 'user', loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await get().refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, role: 'user', loading: false, error: null });
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, profile: null, role: 'user', loading: false, error: 'Failed to initialize' });
    }
  },

  signIn: async (email: string, password: string) => {
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
        await get().refreshProfile();
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

  signUp: async (name: string, email: string, password: string, phone?: string) => {
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

  clearError: () => {
    set({ error: null });
  },
}));