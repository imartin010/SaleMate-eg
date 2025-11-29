import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  id: string;
  email: string;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: AuthUser | null) => Promise<void>;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = 'salemate-mobile-auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  async setUser(user) {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set({user, isAuthenticated: true, loading: false});
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({user: null, isAuthenticated: false, loading: false});
    }
  },

  async restoreSession() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as AuthUser;
        set({user, isAuthenticated: true, loading: false});
      } else {
        set({user: null, isAuthenticated: false, loading: false});
      }
    } catch {
      set({user: null, isAuthenticated: false, loading: false});
    }
  },

  async signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({user: null, isAuthenticated: false});
  },
}));


