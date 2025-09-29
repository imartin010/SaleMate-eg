import { PaymentMethod } from '../types';

export interface PaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  userId: string;
  metadata?: Record<string, unknown>;
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
        case 'Instapay':
          return await this.processInstapayPayment();
        case 'VodafoneCash':
          return await this.processVodafoneCashPayment();
        case 'BankTransfer':
          return await this.processBankTransferPayment();
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: (error instanceof Error ? error.message : String(error)) || 'Payment processing failed'
      };
    }
  }

  // Credit card payment method removed as it's not in the PaymentMethod type

  private static async processInstapayPayment(): Promise<PaymentResult> {
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

  private static async processVodafoneCashPayment(): Promise<PaymentResult> {
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

  private static async processBankTransferPayment(): Promise<PaymentResult> {
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
      case 'Instapay':
        return 'Send payment to our Instapay account: 01234567890. Include your user ID in the reference.';
      case 'VodafoneCash':
        return 'Send payment to our Vodafone Cash number: 01234567890. Include your user ID in the reference.';
      case 'BankTransfer':
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
      case 'Instapay':
        return 'Instapay';
      case 'VodafoneCash':
        return 'Vodafone Cash';
      case 'BankTransfer':
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
