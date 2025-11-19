/**
 * Wallet Hook
 * 
 * React Query-based wallet state management
 * This replaces the old WalletContext with better caching and server state management
 * 
 * @module features/wallet/hooks/useWallet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletService } from '../services/wallet.service';
import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Hook to manage wallet balance and transactions
 * 
 * This hook uses React Query for server state management,
 * providing automatic caching, refetching, and optimistic updates
 */
export function useWallet() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Get wallet balance with React Query
  const {
    data: balance = 0,
    isLoading: loading,
    error,
    refetch: refreshBalance,
  } = useQuery({
    queryKey: ['wallet', 'balance', user?.id],
    queryFn: () => WalletService.getBalance(user!.id),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get transaction history
  const {
    data: transactions = [],
    isLoading: loadingTransactions,
  } = useQuery({
    queryKey: ['wallet', 'transactions', user?.id],
    queryFn: () => WalletService.getTransactions(user!.id, 50),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  // Add to wallet mutation
  const addToWalletMutation = useMutation({
    mutationFn: ({ amount, description }: { amount: number; description?: string }) =>
      WalletService.addToWallet(user!.id, amount, description),
    onSuccess: () => {
      // Invalidate wallet queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  // Deduct from wallet mutation
  const deductFromWalletMutation = useMutation({
    mutationFn: ({ amount, description }: { amount: number; description?: string }) =>
      WalletService.deductFromWallet(user!.id, amount, description),
    onSuccess: () => {
      // Invalidate wallet queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  return {
    // State
    balance,
    loading,
    error: error ? String(error) : null,
    transactions,
    loadingTransactions,

    // Actions
    refreshBalance: () => refreshBalance(),
    addToWallet: (amount: number, description?: string) =>
      addToWalletMutation.mutateAsync({ amount, description }),
    deductFromWallet: async (amount: number, description?: string) => {
      try {
        const result = await deductFromWalletMutation.mutateAsync({ amount, description });
        return { success: true, ...result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Deduction failed',
        };
      }
    },

    // Loading states
    isAddingToWallet: addToWalletMutation.isPending,
    isDeducting: deductFromWalletMutation.isPending,
  };
}

/**
 * Hook for wallet balance only (lighter version)
 */
export function useWalletBalance() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['wallet', 'balance', user?.id],
    queryFn: () => WalletService.getBalance(user!.id),
    enabled: !!user,
    staleTime: 30000,
  });
}

