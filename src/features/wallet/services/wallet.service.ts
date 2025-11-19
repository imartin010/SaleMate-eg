/**
 * Wallet Service
 * 
 * Handles all wallet and payment-related API calls
 * 
 * @module features/wallet/services/wallet.service
 */

import { supabase } from '@/core/api/client';
import type { Database } from '@/shared/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export class WalletService {
  /**
   * Get wallet balance for a user
   */
  static async getBalance(userId: string): Promise<number> {
    // Try to get from profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (profile && !profileError) {
      return Number(profile.wallet_balance || 0);
    }

    // Fallback: calculate from transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, ledger_entry_type')
      .eq('profile_id', userId)
      .eq('status', 'completed');

    if (error) throw error;

    const balance = transactions?.reduce((sum, t) => {
      return t.ledger_entry_type === 'credit'
        ? sum + Number(t.amount)
        : sum - Number(t.amount);
    }, 0) || 0;

    return balance;
  }

  /**
   * Get transaction history
   */
  static async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Add money to wallet (requires payment confirmation)
   */
  static async addToWallet(userId: string, amount: number, description = 'Wallet top-up') {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        profile_id: userId,
        amount: amount.toString(),
        currency: 'EGP',
        ledger_entry_type: 'credit',
        transaction_type: 'wallet_topup',
        status: 'pending',
        description,
        metadata: { initiated_at: new Date().toISOString() },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Deduct money from wallet
   */
  static async deductFromWallet(
    userId: string,
    amount: number,
    description = 'Lead purchase'
  ) {
    const { data, error } = await supabase.rpc('deduct_from_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Create payment transaction
   */
  static async createPaymentTransaction(
    userId: string,
    amount: number,
    paymentMethod: string,
    transactionType = 'wallet_topup'
  ) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount.toString(),
        currency: 'EGP',
        gateway: 'test',
        status: 'pending',
        metadata: {
          payment_method: paymentMethod,
          transaction_type: transactionType,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get wallet transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get pending top-up requests
   */
  static async getPendingTopUps(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', userId)
      .eq('transaction_type', 'wallet_topup')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

