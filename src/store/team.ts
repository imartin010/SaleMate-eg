import { create } from "zustand";
import { supabase } from "../lib/supabaseClient"
import type { Database } from "../types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface TeamInvitation {
  id: string;
  manager_id: string;
  invitee_email: string;
  invitee_user_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface TeamState {
  members: ProfileRow[];
  invitations: TeamInvitation[];
  loading: boolean;
  error?: string;
  fetchTeam(): Promise<void>;
  fetchInvitations(): Promise<void>;
  addUserToTeam(userId: string): Promise<boolean>;
  inviteUserByEmail(email: string): Promise<boolean>;
  cancelInvitation(invitationId: string): Promise<boolean>;
  teamUserIds(): Promise<string[]>; // returns my recursive tree ids
  removeUserFromTeam(userId: string): Promise<boolean>;
  clearError(): void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  invitations: [],
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
      // RPC function not available - using direct query
      const { data: ids, error: idsErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', user.user.id);
      
      if (idsErr) { 
        set({ loading: false, error: idsErr.message }); 
        return; 
      }

      const idList = (ids ?? []).map(i => i.id);
      
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
      // RPC function not available - using direct update
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', userId);
      
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
      
      // RPC function not available - using direct query
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', u.user.id);
      
      return (data ?? []).map(i => i.id);
    } catch (error) {
      console.error('Error getting team user IDs:', error);
      return [];
    }
  },

  async fetchInvitations() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('manager_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        set({ error: error.message });
        return;
      }

      set({ invitations: data ?? [] });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  async inviteUserByEmail(email: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        set({ error: 'Not authenticated' });
        return false;
      }

      // Call the edge function to send invitation
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: { invitee_email: email }
      });

      if (error) {
        set({ error: error.message });
        return false;
      }

      if (!data?.success) {
        set({ error: data?.error || 'Failed to send invitation' });
        return false;
      }

      // Refresh invitations list
      await get().fetchInvitations();
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },

  async cancelInvitation(invitationId: string) {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        set({ error: error.message });
        return false;
      }

      // Refresh invitations list
      await get().fetchInvitations();
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },

  clearError() {
    set({ error: undefined });
  }
}));
