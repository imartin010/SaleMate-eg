import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PaymentGatewayService from '../../services/paymentGateway';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Payment Callback Page
 * Handles redirects from payment gateways (Kashier, Stripe, Paymob)
 */
export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing payment...');
  
  // Get wallet and toast hooks with error handling
  let refreshBalance: (() => Promise<void>) | undefined;
  let showSuccess: ((message: string) => void) | undefined;
  let showError: ((message: string) => void) | undefined;
  
  try {
    const wallet = useWallet();
    refreshBalance = wallet.refreshBalance;
  } catch (error) {
    console.error('PaymentCallback: Error getting wallet context', error);
  }
  
  try {
    const toast = useToast();
    showSuccess = toast.showSuccess;
    showError = toast.showError;
  } catch (error) {
    console.error('PaymentCallback: Error getting toast context', error);
  }
  
  const transactionId = searchParams.get('transactionId');
  const statusParam = searchParams.get('status'); // 'success' or 'failed' from Kashier
  const paymentStatusParam = searchParams.get('paymentStatus'); // 'SUCCESS' or 'FAILED' from Kashier
  const orderId = searchParams.get('orderId'); // From Kashier
  const paymentId = searchParams.get('paymentId'); // From Kashier

  useEffect(() => {
    const processPayment = async () => {
      console.log('PaymentCallback: Starting payment processing', {
        transactionId,
        statusParam,
        paymentStatusParam,
        orderId,
        paymentId
      });

      if (!transactionId) {
        console.error('PaymentCallback: Transaction ID not found');
        setStatus('error');
        setMessage('Transaction ID not found');
        // Redirect anyway after 3 seconds
        setTimeout(() => {
          console.log('PaymentCallback: No transaction ID, redirecting to home');
          navigate('/app/home', { replace: true });
        }, 3000);
        return;
      }

      try {
        // Determine payment status from URL params
        // Kashier returns 'status=success' or 'paymentStatus=SUCCESS' in the redirect URL
        let paymentStatusToUse: 'completed' | 'failed' = 'failed';
        
        // Check both status and paymentStatus parameters (Kashier uses both)
        const isSuccess = 
          statusParam?.toLowerCase() === 'success' || 
          statusParam?.toLowerCase() === 'completed' ||
          paymentStatusParam?.toUpperCase() === 'SUCCESS';
        
        const isFailed = 
          statusParam?.toLowerCase() === 'failed' || 
          statusParam?.toLowerCase() === 'error' ||
          paymentStatusParam?.toUpperCase() === 'FAILED';
        
        if (isSuccess) {
          paymentStatusToUse = 'completed';
        } else if (isFailed) {
          paymentStatusToUse = 'failed';
        } else {
          // If no status in URL, check if paymentId or orderId exists (Kashier success indicator)
          if (paymentId || orderId) {
            paymentStatusToUse = 'completed';
          }
        }

        // Confirm payment via RPC
        console.log('PaymentCallback: Calling confirmPayment', { transactionId, paymentStatusToUse });
        const result = await PaymentGatewayService.confirmPayment(
          transactionId,
          paymentStatusToUse
        );

        console.log('PaymentCallback: confirmPayment result', result);

        // Check if payment was successful (either newly processed or already processed)
        // The RPC may return success=true even if transaction was already processed
        if (result.success && paymentStatusToUse === 'completed') {
          console.log('PaymentCallback: Payment successful, refreshing balance and redirecting');
          setStatus('success');
          setMessage('Payment successful! Your wallet has been topped up.');
          
          // Refresh wallet balance
          if (refreshBalance) {
            try {
              await refreshBalance();
              console.log('PaymentCallback: Balance refreshed');
            } catch (refreshError) {
              console.error('PaymentCallback: Error refreshing balance', refreshError);
              // Continue anyway - balance will update on next page load
            }
          }
          
          // Show success toast
          if (showSuccess) {
            try {
              showSuccess('Payment successful! Your wallet balance has been updated.');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing toast', toastError);
            }
          }
          
          // Redirect to home immediately after balance refresh (better UX)
          setTimeout(() => {
            console.log('PaymentCallback: Redirecting to /app/home');
            navigate('/app/home', { replace: true });
          }, 1000); // 1 second - just enough to see success message
        } else {
          // Only show error if payment actually failed
          console.error('PaymentCallback: Payment failed', result);
          setStatus('error');
          setMessage(result.error || 'Payment processing failed. Please contact support if the payment was deducted.');
          if (showError) {
            try {
              showError(result.error || 'Payment processing failed');
            } catch (toastError) {
              console.error('PaymentCallback: Error showing error toast', toastError);
            }
          }
          
          // Redirect to home after 5 seconds
          setTimeout(() => {
            console.log('PaymentCallback: Redirecting to /app/home (error case)');
            navigate('/app/home', { replace: true });
          }, 5000);
        }
      } catch (error) {
        console.error('PaymentCallback: Payment callback error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while processing your payment. Please contact support if the payment was deducted.'
        );
        if (showError) {
          try {
            showError('Payment processing error');
          } catch (toastError) {
            console.error('PaymentCallback: Error showing error toast', toastError);
          }
        }
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          console.log('PaymentCallback: Error occurred, redirecting to home');
          navigate('/app/home', { replace: true });
        }, 3000);
      }
    };

    // Add a safety timeout - if nothing happens after 10 seconds, redirect anyway
    const safetyTimeout = setTimeout(() => {
      console.warn('PaymentCallback: Safety timeout triggered, redirecting to home');
      navigate('/app/home', { replace: true });
    }, 10000);

    processPayment().finally(() => {
      clearTimeout(safetyTimeout);
    });
  }, [transactionId, statusParam, paymentStatusParam, orderId, paymentId, navigate]);

  // Always render something, even if there's an error
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {status === 'processing' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4">
                  <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you back to home...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/app/home')}
                className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

