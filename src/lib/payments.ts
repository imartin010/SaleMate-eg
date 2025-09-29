import { PaymentMethod } from '../types';

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'Instapay':
      return '💳';
    case 'VodafoneCash':
      return '📱';
    case 'BankTransfer':
      return '🏦';
    default:
      return '💰';
  }
};

export const getPaymentMethodColor = (method: PaymentMethod): string => {
  switch (method) {
    case 'Instapay':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'VodafoneCash':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'BankTransfer':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Mock payment processing
export const processPayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _method: PaymentMethod,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _amount: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _metadata?: Record<string, unknown>
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock 95% success rate
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } else {
    return {
      success: false,
      error: 'Payment processing failed. Please try again.',
    };
  }
};

export const getLeadPrice = (): number => {
  // Mock price per lead in EGP
  return 25;
};

export const calculateTotalAmount = (quantity: number): number => {
  return quantity * getLeadPrice();
};
