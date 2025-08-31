import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';

// Define AuthState interface directly here to avoid import issues
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  
  login: (user: User) => {
    set({ user, isAuthenticated: true, loading: false });
    // Manual localStorage persistence
    localStorage.setItem('salemate-auth', JSON.stringify({ user, isAuthenticated: true }));
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false, loading: false });
      localStorage.removeItem('salemate-auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  initialize: async () => {
    try {
      console.log('⚡ Fast auth initialization...');
      
      // INSTANT: Check localStorage first (no network delay)
      const stored = localStorage.getItem('salemate-auth');
      if (stored) {
        try {
          const { user, isAuthenticated } = JSON.parse(stored);
          if (user && isAuthenticated) {
            console.log('⚡ INSTANT auth from localStorage:', user.email);
            set({ user, isAuthenticated, loading: false });
            
            // Verify session in background (don't block UI)
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (!session?.user) {
                console.log('🧹 Session expired, clearing auth');
                localStorage.removeItem('salemate-auth');
                set({ user: null, isAuthenticated: false, loading: false });
              }
            }).catch(() => {
              // Network error, keep cached auth
              console.log('📡 Network error, keeping cached auth');
            });
            
            return; // Exit immediately - UI loads instantly!
          }
        } catch (error) {
          console.warn('Invalid cached auth, clearing:', error);
          localStorage.removeItem('salemate-auth');
        }
      }

      // FAST: Only check session if no cache (1 second timeout)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout - proceeding')), 1000)
      );

      try {
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (session?.user) {
          // Create immediate fallback profile (no database call)
          const fastProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || undefined,
            role: 'user' as const,
            createdAt: new Date().toISOString()
          };
          
          console.log('⚡ FAST auth with session:', fastProfile.email);
          set({ user: fastProfile, isAuthenticated: true, loading: false });
          localStorage.setItem('salemate-auth', JSON.stringify({ user: fastProfile, isAuthenticated: true }));
          
          // Load full profile in background (don't block UI)
          supabase.from('profiles').select('*').eq('id', session.user.id).single()
            .then(({ data: profile }) => {
              if (profile) {
                const fullProfile = {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  phone: profile.phone || undefined,
                  role: profile.role,
                  managerId: profile.manager_id || undefined,
                  createdAt: profile.created_at
                };
                set({ user: fullProfile });
                localStorage.setItem('salemate-auth', JSON.stringify({ user: fullProfile, isAuthenticated: true }));
              }
            }).catch(() => {
              // Keep fallback profile if database fails
              console.log('📡 Profile fetch failed, keeping fallback');
            });
          
          return;
        }
      } catch (error) {
        console.log('⚡ Auth timeout, proceeding unauthenticated');
      }
      
      // No session - proceed immediately
      console.log('⚡ No auth found, proceeding');
      set({ user: null, isAuthenticated: false, loading: false });
      
    } catch (error) {
      console.error('Auth error, proceeding:', error);
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN' && session?.user) {
    // User signed in, get their profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profile) {
        const userProfile = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          managerId: profile.manager_id || undefined,
          createdAt: profile.created_at
        };
        
        console.log('🎉 Auto-login from auth state change:', userProfile);
        useAuthStore.getState().login(userProfile);
      }
    } catch (error) {
      console.error('Failed to load profile on auth state change:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    // User signed out
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
    localStorage.removeItem('salemate-auth');
  }
});

// ULTRA-FAST auth initialization
const initializeAuth = () => {
  console.log('⚡ Starting ultra-fast auth initialization...');
  
  // SUPER SHORT timeout - never wait more than 500ms
  setTimeout(() => {
    const { loading } = useAuthStore.getState();
    if (loading) {
      console.warn('⚡ Auth timeout (500ms), proceeding unauthenticated');
      useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
    }
  }, 500); // Only 500ms timeout!
  
  // Initialize immediately - no waiting
  useAuthStore.getState().initialize().catch((error) => {
    console.log('⚡ Auth failed, proceeding:', error);
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
  });
};

// Initialize immediately
initializeAuth();

// Debug helper - available in browser console
if (typeof window !== 'undefined') {
  (window as any).clearSaleMateAuth = () => {
    console.log('🧹 Clearing SaleMate auth state...');
    localStorage.removeItem('salemate-auth');
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
    console.log('✅ Auth state cleared. Refresh the page.');
  };
  
  (window as any).debugSaleMateAuth = () => {
    const state = useAuthStore.getState();
    console.log('🔍 Current auth state:', state);
    console.log('🔍 localStorage:', localStorage.getItem('salemate-auth'));
  };
  
  console.log('🛠️ Debug helpers available: clearSaleMateAuth(), debugSaleMateAuth()');
}
