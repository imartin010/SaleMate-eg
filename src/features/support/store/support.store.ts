import { create } from 'zustand';
import { SupportCase, SupportCaseStatus, SupportCaseReply } from '@/shared/types';
import { 
  getAllSupportCases,
  getUserSupportCasesWithDetails,
  createSupportCase as createSupportCaseDB,
  updateSupportCase as updateSupportCaseDB,
  createSupportCaseReply as createSupportCaseReplyDB,
  getSupportCaseReplies as getSupportCaseRepliesDB
} from '@/core/api/client';

interface SupportState {
  cases: any[];
  loading: boolean;
  error: string | null;
  replies: { [caseId: string]: SupportCaseReply[] };
  loadingReplies: boolean;
  
  fetchUserCases: (userId: string) => Promise<void>;
  fetchAllCases: () => Promise<void>;
  createCase: (userId: string, subject: string, description: string, topic: string, issue: string) => Promise<void>;
  updateCase: (id: string, updates: { status?: SupportCaseStatus; assignedTo?: string }) => Promise<void>;
  fetchReplies: (caseId: string) => Promise<void>;
  createReply: (caseId: string, userId: string, message: string, isInternalNote?: boolean) => Promise<void>;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  cases: [],
  loading: false,
  error: null,
  replies: {},
  loadingReplies: false,
  
  fetchUserCases: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserSupportCasesWithDetails(userId);
      const mappedCases = (data || []).map((item: any) => ({
        id: item.id,
        createdBy: item.created_by,
        assignedTo: item.assigned_to,
        subject: item.subject,
        description: item.description,
        status: item.status || 'open',
        topic: item.topic,
        issue: item.issue,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        creator: item.creator,
        assignee: item.assignee,
      }));
      set({ cases: mappedCases, loading: false });
    } catch (error) {
      console.error('Failed to fetch user cases:', error);
      set({ error: 'Failed to fetch support cases', loading: false });
    }
  },
  
  fetchAllCases: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getAllSupportCases();
      const mappedCases = (data || []).map((item: any) => ({
        id: item.id,
        createdBy: item.created_by,
        assignedTo: item.assigned_to,
        subject: item.subject,
        description: item.description,
        status: item.status || 'open',
        topic: item.topic,
        issue: item.issue,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        creator: item.creator,
        assignee: item.assignee,
      }));
      set({ cases: mappedCases, loading: false });
    } catch (error) {
      console.error('Failed to fetch all cases:', error);
      set({ error: 'Failed to fetch support cases', loading: false });
    }
  },
  
  createCase: async (userId: string, subject: string, description: string, topic: string, issue: string) => {
    try {
      await createSupportCaseDB(userId, subject, description, topic, issue);
      // Refresh cases after creation
      const currentCases = get().cases;
      if (currentCases.length > 0 && currentCases[0].creator) {
        // If we have detailed cases, we're viewing all cases (support role)
        await get().fetchAllCases();
      } else {
        // Otherwise, we're viewing user cases
        await get().fetchUserCases(userId);
      }
    } catch (error) {
      console.error('Failed to create case:', error);
      set({ error: 'Failed to create support case' });
      throw error;
    }
  },
  
  updateCase: async (id: string, updates: { status?: SupportCaseStatus; assignedTo?: string }) => {
    try {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo;
      
      await updateSupportCaseDB(id, dbUpdates);
      
      // Update local state optimistically
      const cases = get().cases.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );
      set({ cases });
    } catch (error) {
      console.error('Failed to update case:', error);
      set({ error: 'Failed to update support case' });
      throw error;
    }
  },
  
  fetchReplies: async (caseId: string) => {
    set({ loadingReplies: true });
    try {
      const data = await getSupportCaseRepliesDB(caseId);
      const mappedReplies = (data || []).map((item: any) => ({
        id: item.id,
        caseId: item.case_id,
        userId: item.user_id,
        message: item.message,
        isInternalNote: item.is_internal_note,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user: item.user ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
          role: item.user.role
        } : undefined
      }));
      
      set((state) => ({
        replies: { ...state.replies, [caseId]: mappedReplies },
        loadingReplies: false
      }));
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      set({ loadingReplies: false });
    }
  },
  
  createReply: async (caseId: string, userId: string, message: string, isInternalNote: boolean = false) => {
    try {
      await createSupportCaseReplyDB(caseId, userId, message, isInternalNote);
      // Refresh replies for this case
      await get().fetchReplies(caseId);
      // Also refresh the cases list to update lastReplyAt
      const currentCases = get().cases;
      if (currentCases.length > 0 && currentCases[0].creator) {
        await get().fetchAllCases();
      } else {
        await get().fetchUserCases(userId);
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
      set({ error: 'Failed to send reply' });
      throw error;
    }
  },
}));
