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
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get balance directly from profiles.wallet_balance column
      // This is updated by the payment gateway system (process_payment_and_topup RPC)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Fallback: try using get_wallet_balance RPC function
        const { data, error: balanceError } = await supabase.rpc('get_wallet_balance', {
          p_profile_id: user.id
        });

        if (balanceError) {
          // Final fallback: compute balance from transactions table directly
          const { data: credits } = await supabase
            .from('transactions')
            .select('amount')
            .eq('profile_id', user.id)
            .eq('status', 'completed')
            .eq('ledger_entry_type', 'credit');

          const { data: debits } = await supabase
            .from('transactions')
            .select('amount')
            .eq('profile_id', user.id)
            .eq('status', 'completed')
            .eq('ledger_entry_type', 'debit');

          const creditTotal = credits?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
          const debitTotal = debits?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
          setBalance(creditTotal - debitTotal);
        } else {
          setBalance(parseFloat((data as number) || 0));
        }
      } else {
        // Use wallet_balance from profiles table (primary source for payment gateway)
        setBalance(parseFloat((profile.wallet_balance || 0).toString()));
      }
    } catch (err: unknown) {
      console.error('Error fetching wallet balance:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to fetch wallet balance');
      // Set balance to 0 on error to prevent UI issues
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const addToWallet = async (amount: number, description: string = 'Wallet deposit'): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: addError } = await (supabase as any).rpc('add_to_wallet', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Refresh balance after successful addition
      await refreshBalance();
      return true;
    } catch (err: unknown) {
      console.error('Error adding to wallet:', err);
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to add money to wallet');
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
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setError(null);

      // Call RPC to deduct from wallet
      const { data, error: deductError } = await supabase.rpc('deduct_from_wallet', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description,
      });

      if (deductError) {
        throw new Error(deductError.message);
      }

      // Refresh balance
      await refreshBalance();
      
      return { 
        success: true, 
        new_balance: data?.new_balance || (balance - amount)
      };
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : String(err)) || 'Failed to deduct from wallet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: WalletContextType = {
    balance,
    loading,
    error,
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
