import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/auth';
import { PaymentService, PaymentRequest } from '../services/paymentService';
import { PaymentMethod } from '../types';

interface WalletContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  addToWallet: (amount: number, description?: string) => Promise<boolean>;
  addToWalletWithPayment: (amount: number, paymentMethod: PaymentMethod, description?: string) => Promise<{ success: boolean; error?: string }>;
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

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const refreshBalance = async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_user_wallet_balance', {
        p_user_id: user.id
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setBalance(data || 0);
    } catch (err: any) {
      console.error('Error fetching wallet balance:', err);
      setError(err.message || 'Failed to fetch wallet balance');
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

      const { error: addError } = await supabase.rpc('add_to_wallet', {
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
    } catch (err: any) {
      console.error('Error adding to wallet:', err);
      setError(err.message || 'Failed to add money to wallet');
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
      const validation = PaymentService.validateAmount(amount);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Process payment
      const paymentRequest: PaymentRequest = {
        amount,
        paymentMethod,
        description,
        userId: user.id
      };

      const paymentResult = await PaymentService.processWalletPayment(paymentRequest);

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error };
      }

      // Add to wallet after successful payment
      const { error: addError } = await supabase.rpc('add_to_wallet', {
        p_user_id: user.id,
        p_amount: amount,
        p_description: `${description} (${paymentResult.transactionId})`
      });

      if (addError) {
        throw new Error(addError.message);
      }

      // Refresh balance after successful addition
      await refreshBalance();
      return { success: true };
    } catch (err: any) {
      console.error('Error adding to wallet with payment:', err);
      return { success: false, error: err.message || 'Payment processing failed' };
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [user]);

  const value: WalletContextType = {
    balance,
    loading,
    error,
    refreshBalance,
    addToWallet,
    addToWalletWithPayment
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
