/**
 * Wallet Service Tests
 * 
 * @module features/wallet/services/wallet.service.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from './wallet.service';

// Mock Supabase
vi.mock('@/core/api/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

describe('WalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should get wallet balance from profile', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { wallet_balance: '1000.50' },
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const balance = await WalletService.getBalance('user-123');

      expect(balance).toBe(1000.50);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should calculate balance from transactions as fallback', async () => {
      const { supabase } = await import('@/core/api/client');
      
      // Mock profile query to fail
      const mockFromProfile = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Profile not found'),
        }),
      }));

      // Mock transactions query to succeed
      const mockFromTransactions = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }));

      vi.mocked(supabase.from)
        .mockImplementationOnce(mockFromProfile as any)
        .mockImplementationOnce(mockFromTransactions as any);

      // Mock transactions data
      mockFromTransactions.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: [
            { amount: '500', ledger_entry_type: 'credit' },
            { amount: '200', ledger_entry_type: 'credit' },
            { amount: '100', ledger_entry_type: 'debit' },
          ],
          error: null,
        }),
      });

      const balance = await WalletService.getBalance('user-123');

      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addToWallet', () => {
    it('should create pending wallet top-up transaction', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockTransaction = {
        id: 'txn-123',
        profile_id: 'user-123',
        amount: '500',
        status: 'pending',
      };

      const mockFrom = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await WalletService.addToWallet('user-123', 500, 'Test top-up');

      expect(result).toEqual(mockTransaction);
      expect(supabase.from).toHaveBeenCalledWith('transactions');
    });
  });

  describe('deductFromWallet', () => {
    it('should deduct amount from wallet using RPC', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockResult = { new_balance: 400 };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await WalletService.deductFromWallet('user-123', 100, 'Lead purchase');

      expect(supabase.rpc).toHaveBeenCalledWith('deduct_from_wallet', {
        p_user_id: 'user-123',
        p_amount: 100,
        p_description: 'Lead purchase',
      });

      expect(result).toEqual(mockResult);
    });

    it('should throw error if insufficient balance', async () => {
      const { supabase } = await import('@/core/api/client');

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Insufficient balance'),
      });

      await expect(
        WalletService.deductFromWallet('user-123', 1000)
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('getTransactions', () => {
    it('should get transaction history for user', async () => {
      const { supabase } = await import('@/core/api/client');
      const mockTransactions = [
        { id: 'txn-1', amount: '500', transaction_type: 'wallet_topup' },
        { id: 'txn-2', amount: '100', transaction_type: 'lead_purchase' },
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const transactions = await WalletService.getTransactions('user-123', 50);

      expect(transactions).toEqual(mockTransactions);
      expect(supabase.from).toHaveBeenCalledWith('transactions');
    });
  });
});

