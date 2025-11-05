/**
 * Payment Gateway Service - Test Mode
 * Supports Stripe, Paymob, Kashier, and Test Gateway
 */

import { supabase } from '../lib/supabaseClient';

export type PaymentGateway = 'stripe' | 'paymob' | 'kashier' | 'test';
export type PaymentMethod = 'card' | 'instapay' | 'bank_transfer';
export type TransactionType = 'wallet_topup' | 'lead_purchase' | 'subscription';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentRequest {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  transactionType: TransactionType;
  referenceId?: string; // wallet_topup_request_id or purchase_request_id
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  gateway: PaymentGateway;
  gateway_transaction_id: string | null;
  gateway_payment_intent_id: string | null;
  status: PaymentStatus;
  transaction_type: TransactionType;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  test_mode: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

class PaymentGatewayService {
  private static readonly TEST_MODE = import.meta.env.VITE_PAYMENT_TEST_MODE !== 'false';
  private static readonly STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  private static readonly PAYMOB_API_KEY = import.meta.env.VITE_PAYMOB_API_KEY || '';
  private static readonly KASHIER_PAYMENT_KEY = import.meta.env.VITE_KASHIER_PAYMENT_KEY || '';
  private static readonly KASHIER_MERCHANT_ID = import.meta.env.VITE_KASHIER_MERCHANT_ID || '';

  /**
   * Create a payment transaction and initiate payment
   */
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate amount
      if (request.amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      if (request.amount < 5000 && request.transactionType === 'wallet_topup') {
        return { success: false, error: 'Minimum top-up amount is 5000 EGP' };
      }

      // Create transaction record in database
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: request.userId,
          amount: request.amount,
          currency: request.currency || 'EGP',
          payment_method: request.paymentMethod,
          gateway: request.gateway,
          status: 'pending',
          transaction_type: request.transactionType,
          reference_id: request.referenceId || null,
          metadata: request.metadata || null,
          test_mode: this.TEST_MODE,
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        console.error('Failed to create transaction:', transactionError);
        return {
          success: false,
          error: transactionError?.message || 'Failed to create payment transaction',
        };
      }

      // Process payment based on gateway
      let paymentResult: PaymentResponse;

      if (request.gateway === 'test' || this.TEST_MODE) {
        // Test mode - simulate payment
        paymentResult = await this.processTestPayment(transaction.id, request);
      } else if (request.gateway === 'stripe') {
        paymentResult = await this.processStripePayment(transaction.id, request);
      } else if (request.gateway === 'paymob') {
        paymentResult = await this.processPaymobPayment(transaction.id, request);
      } else if (request.gateway === 'kashier') {
        paymentResult = await this.processKashierPayment(transaction.id, request);
      } else {
        return { success: false, error: 'Unsupported payment gateway' };
      }

      // Update transaction with gateway response
      if (paymentResult.success && paymentResult.transactionId) {
        await supabase
          .from('payment_transactions')
          .update({
            gateway_transaction_id: paymentResult.transactionId,
            gateway_payment_intent_id: paymentResult.paymentIntentId || null,
            status: paymentResult.clientSecret ? 'processing' : 'completed',
          })
          .eq('id', transaction.id);
      } else {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            error_message: paymentResult.error || 'Payment processing failed',
          })
          .eq('id', transaction.id);
      }

      return {
        ...paymentResult,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('Payment gateway error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Test Mode Payment - Simulates payment processing
   */
  private static async processTestPayment(
    transactionId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In test mode, card payments are auto-approved
    if (request.paymentMethod === 'card') {
      return {
        success: true,
        transactionId: `test_txn_${Date.now()}`,
        paymentIntentId: `test_pi_${Date.now()}`,
        clientSecret: `test_secret_${transactionId}`,
      };
    }

    // For other methods, simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        transactionId: `test_txn_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        error: 'Payment failed in test mode',
      };
    }
  }

  /**
   * Stripe Payment Processing
   */
  private static async processStripePayment(
    transactionId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Call Edge Function to create Stripe payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: request.amount,
          currency: request.currency || 'egp',
          payment_method: request.paymentMethod,
          transaction_id: transactionId,
          metadata: {
            user_id: request.userId,
            transaction_type: request.transactionType,
            reference_id: request.referenceId,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create payment intent',
        };
      }

      return {
        success: true,
        paymentIntentId: data.paymentIntentId,
        clientSecret: data.clientSecret,
        transactionId: data.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed',
      };
    }
  }

  /**
   * Paymob Payment Processing
   */
  private static async processPaymobPayment(
    transactionId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Call Edge Function to create Paymob payment
      const { data, error } = await supabase.functions.invoke('create-paymob-payment', {
        body: {
          amount: request.amount,
          currency: request.currency || 'EGP',
          payment_method: request.paymentMethod,
          transaction_id: transactionId,
          metadata: {
            user_id: request.userId,
            transaction_type: request.transactionType,
            reference_id: request.referenceId,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create Paymob payment',
        };
      }

      return {
        success: true,
        transactionId: data.transactionId,
        redirectUrl: data.redirectUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Paymob payment failed',
      };
    }
  }

  /**
   * Kashier Payment Processing
   */
  private static async processKashierPayment(
    transactionId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Call Edge Function to create Kashier payment
      const { data, error } = await supabase.functions.invoke('create-kashier-payment', {
        body: {
          amount: request.amount,
          currency: request.currency || 'EGP',
          payment_method: request.paymentMethod,
          transaction_id: transactionId,
          metadata: {
            user_id: request.userId,
            transaction_type: request.transactionType,
            reference_id: request.referenceId,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create Kashier payment',
        };
      }

      return {
        success: true,
        transactionId: data.transactionId,
        redirectUrl: data.redirectUrl,
        paymentIntentId: data.orderId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kashier payment failed',
      };
    }
  }

  /**
   * Confirm payment (for webhook callbacks)
   */
  static async confirmPayment(
    transactionId: string,
    status: 'completed' | 'failed',
    gatewayTransactionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('process_payment_and_topup', {
        p_transaction_id: transactionId,
        p_status: status,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update gateway transaction ID if provided
      if (gatewayTransactionId) {
        await supabase
          .from('payment_transactions')
          .update({ gateway_transaction_id: gatewayTransactionId })
          .eq('id', transactionId);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment',
      };
    }
  }

  /**
   * Get payment transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as PaymentTransaction;
  }

  /**
   * Get user's payment transactions
   */
  static async getUserTransactions(userId: string, limit = 50): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }

    return (data || []) as PaymentTransaction[];
  }
}

export default PaymentGatewayService;

