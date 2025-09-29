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
  signInEmail(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
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
        // RPC function not available - profile will be created by trigger
        console.log('Profile creation handled by database trigger');
        await get().refreshProfile();
      } catch {
        console.warn('Profile creation failed, may be handled by trigger');
      }
    }
    set({ loading: false });
    return true;
  },
  
  async signInEmail(email, password) {
    set({ error: undefined, loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }
    await get().refreshProfile();
    set({ loading: false });
    return true;
  },
  
  async signOut() {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },
  
  async refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return set({ profile: null });
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
      
    if (error) set({ error: error.message });
    set({ profile: data ?? null });
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
}));