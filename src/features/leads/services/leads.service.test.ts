/**
 * Leads Service Tests
 * 
 * Unit tests for leads service layer
 * 
 * @module features/leads/services/leads.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadsService } from './leads.service';

// Create chainable mock helper
function createChainableMock(finalResult: any) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
  };

  // Make all chain methods return the chain itself
  Object.keys(chain).forEach(key => {
    if (key !== 'single' && key !== 'maybeSingle') {
      (chain as any)[key].mockImplementation(() => chain);
    }
  });

  // Make order resolve to the final result
  chain.order.mockImplementation(() => Promise.resolve(finalResult));

  return chain;
}

// Mock Supabase
vi.mock('@/core/api/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('LeadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeads', () => {
    it('should call Supabase with correct table name', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockLeads = [
        { id: 'lead-1', name: 'John Doe', phone: '+201234567890', stage: 'new_lead' },
        { id: 'lead-2', name: 'Jane Smith', phone: '+201234567891', stage: 'contacted' },
      ];

      const mockChain = createChainableMock({ data: mockLeads, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const leads = await LeadsService.getLeads('user-123');

      expect(leads).toEqual(mockLeads);
      expect(supabase.from).toHaveBeenCalledWith('leads');
    });
  });

  describe('getLead', () => {
    it('should get a single lead by ID', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockLead = { id: 'lead-1', name: 'John Doe' };

      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockLead,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const lead = await LeadsService.getLead('lead-1');

      expect(lead).toEqual(mockLead);
    });
  });

  describe('createLead', () => {
    it('should create a new lead', async () => {
      const { supabase } = await import('@/core/api/client');
      const newLead = {
        name: 'John Doe',
        phone: '+201234567890',
        profile_id: 'user-123',
        project_id: 'proj-1',
        stage: 'new_lead',
      };

      const mockFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'lead-1', ...newLead },
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const lead = await LeadsService.createLead(newLead as any);

      expect(lead).toHaveProperty('id');
      expect(lead.name).toBe('John Doe');
    });
  });

  describe('updateLead', () => {
    it('should update a lead', async () => {
      const { supabase } = await import('@/core/api/client');
      const updates = { stage: 'contacted', last_feedback: 'Called client' };
      const updatedLead = { id: 'lead-1', ...updates };

      const mockFrom = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedLead,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const lead = await LeadsService.updateLead('lead-1', updates);

      expect(lead).toEqual(updatedLead);
    });
  });

  describe('updateStage', () => {
    it('should update lead stage', async () => {
      const { supabase } = await import('@/core/api/client');
      const updatedLead = { id: 'lead-1', stage: 'contacted' };

      const mockFrom = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedLead,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const lead = await LeadsService.updateStage('lead-1', 'contacted', 'First contact made');

      expect(lead.stage).toBe('contacted');
    });
  });

  describe('bulkAssignLeads', () => {
    it('should assign multiple leads to a user', async () => {
      const { supabase } = await import('@/core/api/client');
      const leadIds = ['lead-1', 'lead-2', 'lead-3'];

      const mockFrom = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      await LeadsService.bulkAssignLeads(leadIds, 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('leads');
    });
  });
});

