# Payment Integration Guide for Wallet System

This guide explains how the payment system works and how to integrate with real payment gateways.

## 🏗️ Current Implementation

### Payment Methods Supported:
1. **Debit/Credit Card** - For online card payments
2. **Instapay** - Mobile wallet payment
3. **Vodafone Cash** - Mobile wallet payment  
4. **Bank Transfer** - Manual transfer with receipt upload

### Architecture:
- **PaymentService** - Handles payment processing logic
- **WalletContext** - Manages wallet state and payment integration
- **WalletDisplay** - UI for adding money with payment methods
- **LeadRequestDialog** - Integrated payment for lead requests

## 🔧 How It Works

### 1. User Flow:
1. User clicks "Add Money" in wallet
2. Selects amount and payment method
3. System processes payment (currently simulated)
4. Money is added to wallet on successful payment
5. User can use wallet balance for lead requests

### 2. Payment Processing:
```typescript
// Current mock implementation
const result = await PaymentService.processWalletPayment({
  amount: 100,
  paymentMethod: 'credit_card',
  description: 'Wallet deposit',
  userId: 'user-id'
});
```

## 🚀 Real Payment Gateway Integration

### For Credit Card Payments (Stripe Example):

```typescript
// Replace in PaymentService.processCreditCardPayment()
private static async processCreditCardPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: request.amount * 100, // Convert to cents
      currency: 'egp',
      metadata: {
        userId: request.userId,
        description: request.description
      }
    });

    return {
      success: true,
      transactionId: paymentIntent.id,
      redirectUrl: paymentIntent.client_secret
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### For Mobile Wallets (Instapay/Vodafone Cash):

```typescript
// Replace in PaymentService.processInstapayPayment()
private static async processInstapayPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    // Example API call to Instapay
    const response = await fetch('https://api.instapay.com/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INSTAPAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: 'EGP',
        reference: request.userId,
        description: request.description
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        transactionId: result.transactionId
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# Payment Gateway Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
INSTAPAY_API_KEY=your_instapay_key
VODAFONE_CASH_API_KEY=your_vodafone_key

# Bank Transfer Details
BANK_ACCOUNT_NUMBER=1234567890
BANK_NAME=Your Bank Name
BANK_REFERENCE_PREFIX=SM
```

## 📱 Frontend Integration

### Payment Method Selection:
The UI automatically shows all available payment methods:

```tsx
{(['credit_card', 'instapay', 'vodafone_cash', 'bank_transfer'] as PaymentMethod[]).map((method) => (
  <PaymentMethodCard 
    key={method}
    method={method}
    selected={paymentMethod === method}
    onClick={() => setPaymentMethod(method)}
  />
))}
```

### Payment Instructions:
Each payment method shows relevant instructions:

```typescript
const getPaymentInstructions = (method: PaymentMethod): string => {
  switch (method) {
    case 'credit_card':
      return 'Enter your card details to complete the payment securely.';
    case 'instapay':
      return 'Send payment to our Instapay account: 01234567890.';
    case 'vodafone_cash':
      return 'Send payment to our Vodafone Cash number: 01234567890.';
    case 'bank_transfer':
      return 'Transfer to our bank account and upload receipt.';
  }
};
```

## 🛡️ Security Considerations

### 1. Payment Validation:
- Amount limits (min: EGP 10, max: EGP 10,000)
- User authentication required
- Transaction logging

### 2. Error Handling:
- Graceful failure handling
- User-friendly error messages
- Retry mechanisms

### 3. Data Protection:
- No sensitive payment data stored
- Secure API communication
- PCI compliance for card payments

## 📊 Transaction Tracking

### Database Schema:
```sql
-- Wallet transactions table tracks all payments
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY,
    wallet_id UUID REFERENCES user_wallets(id),
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(20), -- 'deposit', 'withdrawal', 'payment', 'refund', 'lead_request'
    amount DECIMAL(10,2),
    description TEXT,
    reference_id UUID, -- Payment gateway transaction ID
    status VARCHAR(20), -- 'pending', 'completed', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Transaction Types:
- `deposit` - Money added to wallet
- `withdrawal` - Money removed from wallet
- `payment` - Payment for leads
- `refund` - Refunded amount
- `lead_request` - Lead request payment

## 🔄 Testing

### Mock Payment Service:
The current implementation includes mock payment processing for testing:

```typescript
// 90% success rate for credit cards
const mockSuccess = Math.random() > 0.1;

// 95% success rate for mobile wallets
const mockSuccess = Math.random() > 0.05;

// 80% success rate for bank transfers
const mockSuccess = Math.random() > 0.2;
```

### Test Scenarios:
1. **Successful Payment** - Money added to wallet
2. **Failed Payment** - Error message shown
3. **Insufficient Balance** - User prompted to add money
4. **Invalid Amount** - Validation error shown

## 🚀 Production Deployment

### 1. Replace Mock Services:
- Update `PaymentService` with real API calls
- Add proper error handling
- Implement retry logic

### 2. Add Monitoring:
- Payment success/failure rates
- Transaction volume tracking
- Error logging

### 3. Security Audit:
- Review payment data handling
- Test security measures
- Compliance verification

## 📞 Support Integration

### Bank Transfer Process:
1. User selects bank transfer
2. System shows bank details
3. User uploads receipt
4. Admin verifies and approves
5. Money added to wallet

### Manual Verification:
- Admin panel shows pending bank transfers
- Receipt verification workflow
- Approval/rejection system

## 🎯 Next Steps

1. **Choose Payment Gateways** - Select providers for each method
2. **Implement APIs** - Replace mock services with real integrations
3. **Add Webhooks** - Handle payment confirmations
4. **Test Thoroughly** - Verify all payment flows
5. **Deploy Gradually** - Start with one payment method

The system is designed to be easily extensible - you can add new payment methods by updating the `PaymentMethod` type and adding new cases to the `PaymentService` class.
