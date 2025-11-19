/**
 * @deprecated
 * WalletContext has been migrated to React Query.
 * Please use the new hook-based approach:
 * import { useWallet } from '@/features/wallet'
 * 
 * This Context wrapper is kept for backward compatibility
 * but will be removed in a future version.
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet as useWalletNew } from '../features/wallet/hooks/useWallet';
import PaymentGatewayService, { PaymentGateway } from '../services/paymentGateway';
import { PaymentMethod } from '../types';

if (import.meta.env.DEV) {
  console.warn(
    '⚠️ DEPRECATED: WalletContext is deprecated.\n' +
    'Please migrate to the new hook:\n' +
    "import { useWallet } from '@/features/wallet';"
  );
}

interface WalletContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  addToWallet: (amount: number, description?: string) => Promise<boolean>;
  addToWalletWithPayment: (amount: number, paymentMethod: PaymentMethod, description?: string) => Promise<{ success: boolean; error?: string }>;
  deductFromWallet: (amount: number, description?: string) => Promise<{ success: boolean; error?: string; new_balance?: number }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * WalletProvider with React Query integration
 * Now uses the new useWallet hook internally for better performance
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  // Use the new React Query-based hook internally
  const walletHook = useWalletNew();

  const refreshBalance = async () => {
    await walletHook.refreshBalance();
  };

  const addToWallet = async (amount: number, description: string = 'Wallet deposit'): Promise<boolean> => {
    try {
      await walletHook.addToWallet(amount, description);
      return true;
    } catch (err: unknown) {
      console.error('Error adding to wallet:', err);
      return false;
    }
  };

  const addToWalletWithPayment = async (amount: number, paymentMethod: PaymentMethod, description: string = 'Wallet deposit'): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setError(null);

      // Validate amount
      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      // Map PaymentMethod to gateway-specific values
      let gateway: PaymentGateway = 'test';
      let paymentMethodForGateway: 'card' | 'instapay' | 'bank_transfer' = 'card';

      // Determine gateway and payment method based on environment and method
      if (paymentMethod === 'card') {
        // Use Kashier for card payments if available, otherwise test
        const hasKashierKey = Boolean(import.meta.env.VITE_KASHIER_PAYMENT_KEY);
        gateway = (!import.meta.env.VITE_PAYMENT_TEST_MODE || import.meta.env.VITE_PAYMENT_TEST_MODE === 'false') && hasKashierKey ? 'kashier' : 'test';
        paymentMethodForGateway = 'card';
      } else if (paymentMethod === 'instapay') {
        gateway = 'test'; // Instapay uses manual approval for now
        paymentMethodForGateway = 'instapay';
      } else if (paymentMethod === 'bank_transfer') {
        gateway = 'test'; // Bank transfer uses manual approval for now
        paymentMethodForGateway = 'bank_transfer';
      }

      // For manual payment methods (instapay, bank_transfer), this should create commerce requests
      // For card payments, this should go through the gateway system
      if (paymentMethod === 'card') {
        // Process card payment through gateway
        const paymentResult = await PaymentGatewayService.createPayment({
          amount,
          currency: 'EGP',
          paymentMethod: paymentMethodForGateway,
          gateway,
          transactionType: 'wallet_topup',
          userId: user.id,
          metadata: {
            description,
            payment_method: paymentMethodForGateway,
            transaction_type: 'wallet_topup'
          }
        });

        if (!paymentResult.success) {
          return { success: false, error: paymentResult.error };
        }

        // For test gateway, confirm payment immediately
        if (gateway === 'test') {
          const confirmResult = await PaymentGatewayService.confirmPayment(
            paymentResult.transactionId!,
            'completed'
          );

          if (!confirmResult.success) {
            return { success: false, error: confirmResult.error };
          }
        }

        // For Kashier, the callback/webhook will handle confirmation
        // Refresh balance to get updated amount
        await refreshBalance();
        return { success: true };
      } else {
        // Manual payment methods - create commerce request for approval
        // This is handled by TopUpModal for manual methods
        return { success: false, error: 'Manual payment methods should use TopUpModal' };
      }
    } catch (err: unknown) {
      console.error('Error adding to wallet with payment:', err);
      return { success: false, error: (err instanceof Error ? err.message : String(err)) || 'Payment processing failed' };
    }
  };

  const deductFromWallet = async (amount: number, description: string = 'Lead purchase'): Promise<{ success: boolean; error?: string; new_balance?: number }> => {
    const result = await walletHook.deductFromWallet(amount, description);
    return {
      success: result.success,
      error: result.error,
      new_balance: walletHook.balance - amount,
    };
  };

  // Adapt the new hook's API to match the old Context API
  const value: WalletContextType = {
    balance: walletHook.balance,
    loading: walletHook.loading,
    error: walletHook.error,
    refreshBalance,
    addToWallet,
    addToWalletWithPayment,
    deductFromWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
