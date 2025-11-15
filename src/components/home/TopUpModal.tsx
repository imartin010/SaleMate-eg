import React, { useState } from 'react';
import { X, Upload, Loader2, CheckCircle2, AlertCircle, CreditCard, Building2, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { useToast } from '../../contexts/ToastContext';
import { useWallet } from '../../contexts/WalletContext';
import { cn } from '../../lib/cn';
import PaymentGatewayService, { PaymentGateway } from '../../services/paymentGateway';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PaymentMethod = 'card' | 'instapay' | 'bank_transfer';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }>; requiresReceipt: boolean }[] = [
  { value: 'card', label: 'Debit/Credit Card', icon: Wallet, requiresReceipt: false },
  { value: 'instapay', label: 'Instapay', icon: CreditCard, requiresReceipt: true },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, requiresReceipt: true },
];

const quickAmounts = [5000, 10000, 15000, 20000, 25000, 50000];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const { refreshBalance } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const selectedPaymentMethod = paymentMethods.find(m => m.value === paymentMethod);
  const paymentTestModeEnv = import.meta.env.VITE_PAYMENT_TEST_MODE;
  const isCardTestMode =
    paymentTestModeEnv !== 'false' &&
    paymentTestModeEnv !== 'False' &&
    paymentTestModeEnv !== 'FALSE';
  const hasKashierKey = Boolean(import.meta.env.VITE_KASHIER_PAYMENT_KEY);
  const defaultGateway: PaymentGateway = !isCardTestMode && hasKashierKey ? 'kashier' : 'test';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = 'File size must be less than 5MB';
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = 'Please upload a JPEG, PNG, or PDF file';
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      setReceiptFile(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Please log in to continue');
      return;
    }

    // Validation
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Check if receipt is required for this payment method
    if (selectedPaymentMethod?.requiresReceipt && !receiptFile) {
      setError('Please upload a payment receipt');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Handle card payment via gateway
      if (paymentMethod === 'card') {
        setIsProcessingPayment(true);
        
        // Create wallet top-up request first
        // Determine environment configuration once for reuse
        const gateway = defaultGateway;

        const { data: topupRequest, error: topupError } = await supabase
          .from('commerce')
          .insert({
            commerce_type: 'topup',
            profile_id: user.id,
            amount: amountValue,
            currency: 'EGP',
            payment_method: 'Card', // Card payment via gateway
            status: 'pending',
            receipt_url: null, // Card payments don't require receipts
            metadata: { gateway },
          })
          .select()
          .single();

        if (topupError || !topupRequest) {
          throw new Error(`Failed to create top-up request: ${topupError?.message}`);
        }

        // Create payment via gateway
        const paymentResult = await PaymentGatewayService.createPayment({
          amount: amountValue,
          currency: 'EGP',
          paymentMethod: 'card',
          gateway: gateway,
          transactionType: 'wallet_topup',
          referenceId: topupRequest.id,
          userId: user.id,
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment processing failed');
        }

        // Handle payment result
        if (paymentResult.success && paymentResult.transactionId) {
          // If redirect URL provided (Kashier), redirect user
          if (paymentResult.redirectUrl && gateway === 'kashier') {
            // Redirect to Kashier payment page
            window.location.href = paymentResult.redirectUrl;
            return;
          }

          // In test mode, auto-approve card payments
          if (gateway === 'test') {
            // Confirm payment (auto-approve in test mode)
            const confirmResult = await PaymentGatewayService.confirmPayment(
              paymentResult.transactionId,
              'completed'
            );

            if (!confirmResult.success) {
              throw new Error(confirmResult.error || 'Failed to confirm payment');
            }

            setSuccess(true);
            showSuccess(`Successfully topped up ${amountValue.toLocaleString()} EGP!`);
            
            // Refresh wallet balance
            await refreshBalance();
            
            // Reset form after success
            setTimeout(() => {
              setAmount('');
              setPaymentMethod('');
              setReceiptFile(null);
              setReceiptPreview(null);
              setSuccess(false);
              onSuccess?.();
              onClose();
            }, 2000);
            
            return;
          }
        }
      }

      // Handle manual payment methods (Instapay, Bank Transfer)
      if (!receiptFile) {
        throw new Error('Please upload a payment receipt');
      }

      // Upload receipt to Supabase Storage
      const fileExtension = receiptFile.name.split('.').pop() || 'png';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const filePath = `${user.id}/topup_${timestamp}_${randomString}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: receiptFile.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      // Map payment method to enum
      const paymentMethodEnum = paymentMethod === 'instapay' ? 'Instapay' : 'BankTransfer';

      // Create top-up request
      const { error: requestError } = await supabase
        .from('commerce')
        .insert({
          commerce_type: 'topup',
          profile_id: user.id,
          amount: parseFloat(amount),
          currency: 'EGP',
          receipt_url: publicUrl,
          receipt_file_name: receiptFile.name,
          payment_method: paymentMethodEnum,
          status: 'pending',
          metadata: { gateway: 'manual' },
        });

      if (requestError) {
        throw new Error(`Failed to create request: ${requestError.message}`);
      }

      setSuccess(true);
      showSuccess(`Top-up request of ${parseFloat(amount).toLocaleString()} EGP submitted successfully!`);
      
      // Refresh wallet balance (in case it was updated by admin)
      await refreshBalance();
      
      // Reset form after success
      setTimeout(() => {
        setAmount('');
        setPaymentMethod('');
        setReceiptFile(null);
        setReceiptPreview(null);
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Top-up request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit top-up request';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setPaymentMethod('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  // Keyboard navigation (ESC to close)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={cn(
                "bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto",
                "border border-gray-100"
              )}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="topup-modal-title"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 id="topup-modal-title" className="text-xl font-bold text-gray-900">Top Up Wallet</h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {paymentMethod === 'card' ? 'Payment Successful!' : 'Request Submitted!'}
                    </h3>
                    <p className="text-gray-600">
                      {paymentMethod === 'card' 
                        ? 'Your wallet has been topped up successfully. The amount has been added to your balance.'
                        : 'Your top-up request has been submitted for review. It will be processed within 1-2 business days.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (EGP)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setError(null);
                        }}
                        placeholder="Enter amount (EGP)"
                        min="0.01"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        disabled={isSubmitting}
                      />
                      
                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {quickAmounts.map((quickAmount) => (
                          <button
                            key={quickAmount}
                            onClick={() => handleQuickAmount(quickAmount)}
                            disabled={isSubmitting}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              amount === quickAmount.toString()
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {quickAmount.toLocaleString()} EGP
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          return (
                            <button
                              key={method.value}
                              onClick={() => {
                                setPaymentMethod(method.value);
                                setError(null);
                                // Clear receipt if not required
                                if (!method.requiresReceipt) {
                                  setReceiptFile(null);
                                  setReceiptPreview(null);
                                }
                              }}
                              disabled={isSubmitting}
                              className={cn(
                                "p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2",
                                paymentMethod === method.value
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                            >
                              <Icon className={cn(
                                "h-6 w-6",
                                paymentMethod === method.value
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              )} strokeWidth={2} />
                              <div className={cn(
                                "text-xs font-medium",
                                paymentMethod === method.value
                                  ? "text-blue-700"
                                  : "text-gray-700"
                              )}>{method.label}</div>
                            </button>
                          );
                        })}
                      </div>
                      {paymentMethod === 'card' && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Instant payment - No receipt required
                        </p>
                      )}
                    </div>

                    {/* Receipt Upload - Only show for methods that require receipt */}
                    {selectedPaymentMethod?.requiresReceipt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Receipt *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="receipt-upload"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            {receiptPreview ? (
                              <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="max-h-32 rounded-lg mb-2"
                              />
                            ) : (
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            )}
                            <span className="text-sm text-gray-600">
                              {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                              JPEG, PNG, or PDF (max 5MB)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting ||
                        !amount ||
                        !paymentMethod ||
                        (selectedPaymentMethod?.requiresReceipt && !receiptFile)
                      }
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
                        "bg-gradient-to-r from-emerald-500 to-teal-500",
                        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      {isSubmitting || isProcessingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>
                            {paymentMethod === 'card' ? 'Processing Payment...' : 'Submitting...'}
                          </span>
                        </>
                      ) : (
                        <span>
                          {paymentMethod === 'card' ? 'Pay Now' : 'Submit Request'}
                        </span>
                      )}
                    </button>

                    {/* Info Note */}
                    <p className="text-xs text-gray-500 text-center">
                      {paymentMethod === 'card' ? (
                        <>
                          {defaultGateway === 'test' ? (
                            <>
                              <span className="font-semibold text-blue-600">Test Mode:</span> Payments are processed instantly.
                              Your wallet will be updated immediately after successful payment.
                            </>
                          ) : (
                            'You will be redirected to our secure Kashier payment page to complete the transaction.'
                          )}
                        </>
                      ) : (
                        'Your request will be reviewed by our team within 1-2 business days. You\'ll receive a notification once it\'s approved.'
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

