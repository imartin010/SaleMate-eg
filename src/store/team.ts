import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface TeamState {
  members: ProfileRow[];
  loading: boolean;
  error?: string;
  fetchTeam(): Promise<void>;
  addUserToTeam(userId: string): Promise<boolean>;
  teamUserIds(): Promise<string[]>; // returns my recursive tree ids
  removeUserFromTeam(userId: string): Promise<boolean>;
  clearError(): void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  loading: false,
  error: undefined,

  async fetchTeam() {
    set({ loading: true, error: undefined });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) { 
        set({ loading: false }); 
        return; 
      }

      // Get ids in my tree via RPC
      const { data: ids, error: idsErr } = await supabase.rpc("rpc_team_user_ids", { 
        root: user.user.id 
      });
      
      if (idsErr) { 
        set({ loading: false, error: idsErr.message }); 
        return; 
      }

      const idList = (ids ?? []).map(i => i.user_id);
      
      if (idList.length === 0) {
        set({ members: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", idList)
        .order("created_at", { ascending: false });

      set({ 
        members: data ?? [], 
        loading: false, 
        error: error?.message 
      });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  async addUserToTeam(userId: string) {
    try {
      const { data, error } = await supabase.rpc("rpc_add_user_to_team", { 
        target_user_id: userId 
      });
      
      if (error) { 
        set({ error: error.message }); 
        return false; 
      }
      
      await get().fetchTeam();
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },

  async removeUserFromTeam(userId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return false;

      // Update the user's manager_id to null
      const { error } = await supabase
        .from("profiles")
        .update({ manager_id: null })
        .eq("id", userId);

      if (error) {
        set({ error: error.message });
        return false;
      }

      await get().fetchTeam();
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },

  async teamUserIds() {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return [];
      
      const { data } = await supabase.rpc("rpc_team_user_ids", { 
        root: u.user.id 
      });
      
      return (data ?? []).map(i => i.user_id);
    } catch (error) {
      console.error('Error getting team user IDs:', error);
      return [];
    }
  },

  clearError() {
    set({ error: undefined });
  }
}));
