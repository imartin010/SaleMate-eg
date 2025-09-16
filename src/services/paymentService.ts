import { PaymentMethod } from '../types';

export interface PaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
}

export class PaymentService {
  /**
   * Process payment for wallet top-up
   * This is a mock implementation - replace with real payment gateway integration
   */
  static async processWalletPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock payment processing based on method
      switch (request.paymentMethod) {
        case 'credit_card':
          return await this.processCreditCardPayment(request);
        case 'instapay':
          return await this.processInstapayPayment(request);
        case 'vodafone_cash':
          return await this.processVodafoneCashPayment(request);
        case 'bank_transfer':
          return await this.processBankTransferPayment(request);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }

  private static async processCreditCardPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Mock credit card processing
    // In real implementation, integrate with Stripe, Square, or similar
    const mockSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (mockSuccess) {
      return {
        success: true,
        transactionId: `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Credit card payment declined. Please try again.'
      };
    }
  }

  private static async processInstapayPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Mock Instapay processing
    // In real implementation, integrate with Instapay API
    const mockSuccess = Math.random() > 0.05; // 95% success rate for demo

    if (mockSuccess) {
      return {
        success: true,
        transactionId: `instapay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Instapay payment failed. Please check your mobile wallet and try again.'
      };
    }
  }

  private static async processVodafoneCashPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Mock Vodafone Cash processing
    // In real implementation, integrate with Vodafone Cash API
    const mockSuccess = Math.random() > 0.05; // 95% success rate for demo

    if (mockSuccess) {
      return {
        success: true,
        transactionId: `vodafone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Vodafone Cash payment failed. Please check your mobile wallet and try again.'
      };
    }
  }

  private static async processBankTransferPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Mock bank transfer processing
    // In real implementation, this would require manual verification
    const mockSuccess = Math.random() > 0.2; // 80% success rate for demo

    if (mockSuccess) {
      return {
        success: true,
        transactionId: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Bank transfer verification pending. Please contact support.'
      };
    }
  }

  /**
   * Get payment instructions for different methods
   */
  static getPaymentInstructions(method: PaymentMethod): string {
    switch (method) {
      case 'credit_card':
        return 'Enter your card details to complete the payment securely.';
      case 'instapay':
        return 'Send payment to our Instapay account: 01234567890. Include your user ID in the reference.';
      case 'vodafone_cash':
        return 'Send payment to our Vodafone Cash number: 01234567890. Include your user ID in the reference.';
      case 'bank_transfer':
        return 'Transfer to our bank account: Bank Name, Account: 1234567890, Reference: Your User ID. Upload receipt for verification.';
      default:
        return 'Please contact support for payment instructions.';
    }
  }

  /**
   * Get payment method display name
   */
  static getPaymentMethodName(method: PaymentMethod): string {
    switch (method) {
      case 'credit_card':
        return 'Debit/Credit Card';
      case 'instapay':
        return 'Instapay';
      case 'vodafone_cash':
        return 'Vodafone Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return 'Unknown Method';
    }
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    if (amount < 10) {
      return { valid: false, error: 'Minimum amount is EGP 10' };
    }
    if (amount > 10000) {
      return { valid: false, error: 'Maximum amount is EGP 10,000' };
    }
    return { valid: true };
  }
}
